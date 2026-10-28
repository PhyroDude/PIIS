'use strict';
// InterLAB v0.4.0: catálogo transitorio, reservas de cuota y streaming.
const crypto = require('node:crypto');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { once } = require('node:events');

const MB = 1000 * 1000;
const GB = 1000 * MB;
const LIMITS = Object.freeze({ file: 50 * MB, batch: 200 * MB, session: 10 * GB, concurrency: 2 });
const TICKET_TTL = 60_000;
const BATCH_TTL = 20 * 60_000;
function failure(code, message, status = 400) { const e = new Error(message); e.code = code; e.status = status; return e; }
function cleanName(input) {
  if (typeof input !== 'string') throw failure('BAD_NAME','Nombre de archivo inválido.');
  const name = input.replace(/\\/g, '/').split('/').at(-1).replace(/[\x00-\x1f\x7f]/g, '').trim();
  if (!name || name === '.' || name === '..' || name.length > 220 || Buffer.byteLength(name, 'utf8') > 255) throw failure('BAD_NAME','Nombre de archivo inválido.');
  return name;
}
function safeHeaderName(name) { return name.replace(/[^a-zA-Z0-9._ -]/g, '_').replace(/["\\]/g, '_'); }
function disposition(name) { return `attachment; filename="${safeHeaderName(name)}"; filename*=UTF-8''${encodeURIComponent(name)}`; }
function updateCrc(crc, buffer) {
  let c = crc;
  for (const byte of buffer) { c ^= byte; for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0); }
  return c >>> 0;
}
function finalCrc(crc) { return (crc ^ 0xffffffff) >>> 0; }
function dosTime(date) {
  const d = new Date(date);
  const year = Math.max(1980, d.getFullYear());
  return { date: ((year-1980) << 9) | ((d.getMonth()+1) << 5) | d.getDate(), time: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds()/2) };
}
function zipName(fileName, already) {
  let candidate = cleanName(fileName);
  let number = 2;
  while (already.has(candidate.toLowerCase())) {
    const dot = fileName.lastIndexOf('.');
    const base = dot > 0 ? fileName.slice(0, dot) : fileName;
    const ext = dot > 0 ? fileName.slice(dot) : '';
    candidate = cleanName(`${base.slice(0, 180)} (${number++})${ext}`);
  }
  already.add(candidate.toLowerCase());
  return candidate;
}
async function writeResponse(res, chunk) {
  if (res.destroyed || res.writableEnded) throw failure('INTERRUPTED', 'Descarga interrumpida.', 409);
  if (!res.write(chunk)) await once(res, 'drain');
}

// Limita bytes por segundo en lugar de aplicar un porcentaje arbitrario de red.
// El límite solo se aplica mientras hay una proyección seleccionada y autorizada.
class ProjectionBandwidth {
  constructor(isActive, bytesPerSecond = 1024 * 1024) {
    this.isActive = isActive;
    this.rate = bytesPerSecond;
    this.next = 0;
  }
  async wait(bytes) {
    if (!this.isActive() || !Number.isFinite(this.rate) || this.rate <= 0) { this.next = 0; return; }
    const now = Date.now();
    this.next = Math.max(now, this.next) + bytes * 1000 / this.rate;
    const delay = Math.max(0, this.next - now - 250); // pequeña ráfaga para respuestas HTTP.
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
  }
}

class FileStore {
  constructor({ rootDir = path.join(os.tmpdir(), 'interlab-temp-files'), onChange = () => {}, onCapacity = () => {}, isProjectionActive = () => false, isOwnerConnected = () => true, projectionBytesPerSecond = 1024 * 1024 } = {}) {
    this.rootDir = rootDir;
    this.onChange = onChange;
    this.onCapacity = onCapacity;
    this.isOwnerConnected = isOwnerConnected;
    this.bandwidth = new ProjectionBandwidth(isProjectionActive, projectionBytesPerSecond);
    this.state = null;
    // El directorio pertenece exclusivamente a InterLAB; no se sirven archivos desde public/.
    // Nunca borrar arbitrariamente la ruta configurada: podría contener otros datos.
    fs.mkdirSync(rootDir, { recursive: true, mode: 0o700 });
  }
  startSession(sessionId) {
    if (this.state) throw failure('ACTIVE', 'Ya existe una sesión de archivos.');
    const directory = path.join(this.rootDir, sessionId);
    fs.mkdirSync(this.rootDir,{recursive:true,mode:0o700});
    fs.mkdirSync(directory, { mode: 0o700 });
    this.state = { id: sessionId, directory, closing: false, files: new Map(), batches: new Map(), tickets: new Map(), used: 0, reserved: 0, active: new Set(), pending: new Set(), warningBytes: null };
  }
  getState() {
    if (!this.state || this.state.closing) throw failure('NO_SESSION', 'No hay una sesión activa.', 409);
    return this.state;
  }
  actorKey(actor) { return `${actor.role}:${actor.id}`; }
  checkActor(actor) {
    const s = this.getState();
    if (!actor || actor.sessionId !== s.id || !['teacher','student'].includes(actor.role)) throw failure('UNAUTHORIZED', 'Permiso denegado.', 403);
    return s;
  }
  list(actor) {
    const s = this.checkActor(actor);
    return [...s.files.values()].filter(file => !file.deleted).sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(file => ({
      id:file.id, name:file.name, role:file.role, alias:file.alias, createdAt:file.createdAt,
      own:file.ownerId === actor.id && file.role === actor.role
    }));
  }
  freeBytes(s) {
    let diskFree = Infinity;
    try { const info = fs.statfsSync(s.directory, { bigint:true }); diskFree = Number(info.bavail * info.bsize); } catch { /* fallará al intentar escribir si se agota el disco */ }
    return Math.min(LIMITS.session-s.used-s.reserved, diskFree);
  }
  notifyCapacity(s) {
    if (s !== this.state || s.closing) return;
    if (s.warningBytes != null && this.freeBytes(s) >= s.warningBytes) { s.warningBytes = null; this.onCapacity(false); }
  }
  reserve(actor, descriptors) {
    const s = this.checkActor(actor);
    if (!Array.isArray(descriptors) || descriptors.length < 1 || descriptors.length > 500) throw failure('BAD_BATCH','Selecciona entre 1 y 500 archivos.');
    const files = descriptors.map(item => {
      const size = item?.size;
      if (!Number.isSafeInteger(size) || size < 0 || size > LIMITS.file) throw failure('TOO_LARGE','Cada archivo debe tener como máximo 50 MB.',413);
      return { id:crypto.randomUUID(), name:cleanName(item.name), size, status:'reserved' };
    });
    const total = files.reduce((n,f)=>n+f.size,0);
    if (total > LIMITS.batch) throw failure('BATCH_TOO_LARGE','La selección supera los 200 MB por operación.',413);
    if (total > this.freeBytes(s)) {
      s.warningBytes = total;
      this.onCapacity(true);
      throw failure('NO_SPACE','No hay espacio suficiente para esta carga.',507);
    }
    const id = crypto.randomUUID();
    s.reserved += total;
    s.batches.set(id, { id, owner:this.actorKey(actor), files:new Map(files.map(f=>[f.id,f])), expiresAt:Date.now()+BATCH_TTL });
    return { batchId:id, files:files.map(f => ({id:f.id,name:f.name,size:f.size})) };
  }
  expireBatches() {
    const s = this.state;
    if (!s || s.closing) return;
    for (const [id,batch] of s.batches) if (batch.expiresAt < Date.now()) {
      if ([...batch.files.values()].some(f=>f.status==='uploading')) continue;
      for (const f of batch.files.values()) if (f.status==='reserved') s.reserved-=f.size;
      s.batches.delete(id);
    }
    for (const [id,ticket] of s.tickets) if (ticket.expiresAt < Date.now()) s.tickets.delete(id);
    this.notifyCapacity(s);
  }
  begin(actor, req, res) {
    const s = this.checkActor(actor);
    const owner = this.actorKey(actor);
    if ([...s.active].filter(item=>item.owner===owner).length >= LIMITS.concurrency) throw failure('CONCURRENCY','Máximo dos transferencias simultáneas por participante.',429);
    const slot = { owner, req, res };
    s.active.add(slot);
    return { s, slot, release:() => s.active.delete(slot) };
  }
  async upload(actor, batchId, fileId, req, res) {
    const s = this.checkActor(actor);
    const batch = s.batches.get(batchId);
    const entry = batch?.files.get(fileId);
    if (!batch || batch.owner !== this.actorKey(actor) || entry?.status !== 'reserved') throw failure('INVALID_UPLOAD','Carga no encontrada o ya procesada.',404);
    const claimedSize = Number(req.headers['content-length']);
    if (!req.headers['content-length'] || claimedSize !== entry.size) throw failure('SIZE_MISMATCH','El tamaño enviado no corresponde al archivo reservado.',400);
    const {slot, release} = this.begin(actor,req,res);
    entry.status = 'uploading';
    const temporary = path.join(s.directory, `${entry.id}.part`);
    const permanent = path.join(s.directory, `${entry.id}.bin`);
    let handle, written=0, crc=0xffffffff, success=false;
    try {
      handle = await fsp.open(temporary,'wx',0o600);
      for await (const chunk of req) {
        if (s.closing || req.destroyed && !req.complete) throw failure('INTERRUPTED','Carga interrumpida.',409);
        written+=chunk.length;
        if (written > entry.size || written > LIMITS.file) throw failure('TOO_LARGE','El archivo supera el tamaño reservado.',413);
        await this.bandwidth.wait(chunk.length);
        crc=updateCrc(crc,chunk);
        let offset=0;
        while (offset<chunk.length) { const {bytesWritten}=await handle.write(chunk,offset,chunk.length-offset); if (!bytesWritten) throw failure('WRITE_ERROR','No se pudo guardar el archivo.',507);offset+=bytesWritten; }
      }
      if (written !== entry.size || !req.complete) throw failure('INCOMPLETE','Carga incompleta.',400);
      await handle.close(); handle=null;
      if (s.closing || this.state !== s) throw failure('SESSION_ENDED','La sesión terminó.',409);
      await fsp.rename(temporary,permanent);
      if (s.closing || this.state !== s) { await fsp.rm(permanent,{force:true}); throw failure('SESSION_ENDED','La sesión terminó.',409); }
      const file={id:entry.id,name:entry.name,size:written,crc:finalCrc(crc),path:permanent,role:actor.role,ownerId:actor.id,alias:actor.alias,createdAt:new Date().toISOString(),deleted:false,readers:0};
      s.files.set(file.id,file);
      s.used+=written;
      success=true;
      this.onChange();
      return {ok:true,id:file.id};
    } catch(error) {
      if(error.code === 'ENOSPC' || error.code === 'EDQUOT') {
        s.warningBytes=entry.size;
        this.onCapacity(true);
        throw failure('NO_SPACE','Se agotó el espacio del disco. El archivo no se guardó.',507);
      }
      throw error;
    } finally {
      if(handle) await handle.close().catch(()=>{});
      if (!success) await fsp.rm(temporary,{force:true}).catch(()=>{});
      if (!s.closing && entry.status==='uploading') { entry.status=success?'done':'failed'; s.reserved-=entry.size; }
      // La reserva de cada archivo se consume o libera individualmente.
      if (batch && [...batch.files.values()].every(f => f.status !== 'reserved' && f.status !== 'uploading')) s.batches.delete(batchId);
      release();this.notifyCapacity(s);
    }
  }
  fileFor(actor,fileId) {
    const s=this.checkActor(actor);
    const file=s.files.get(fileId);
    if (!file || file.deleted) throw failure('NOT_FOUND','Archivo no encontrado.',404);
    return file;
  }
  async delete(actor,fileId) {
    const file=this.fileFor(actor,fileId);
    if (actor.role !== 'teacher' && !(file.role === actor.role && file.ownerId === actor.id)) throw failure('FORBIDDEN','Solo puedes eliminar tus propios archivos.',403);
    const s=this.getState();
    file.deleted=true;s.files.delete(file.id);s.used-=file.size;
    this.onChange();this.notifyCapacity(s);
    if (!file.readers) await fsp.rm(file.path,{force:true});
    return {ok:true};
  }
  ticket(actor, ids) {
    const s=this.checkActor(actor);
    if (!Array.isArray(ids)||!ids.length || ids.length>500 || new Set(ids).size!==ids.length) throw failure('BAD_SELECTION','Selección de archivos inválida.');
    for (const id of ids) this.fileFor(actor,id);
    const id=crypto.randomBytes(24).toString('hex');
    s.tickets.set(id,{ids:[...ids],owner:this.actorKey(actor),sessionId:s.id,expiresAt:Date.now()+TICKET_TTL});
    return {url:`/api/files/download/${id}`};
  }
  redeem(ticketId) {
    const s=this.getState();
    const ticket=s.tickets.get(ticketId);
    s.tickets.delete(ticketId);
    if (!ticket || ticket.expiresAt<Date.now() || ticket.sessionId!==s.id || !this.isOwnerConnected(ticket.owner,s.id)) throw failure('BAD_TICKET','El enlace de descarga caducó.',404);
    // El ID es aleatorio y de un solo uso; el GET no expone las credenciales HTTP.
    const entries=ticket.ids.map(id=>s.files.get(id));
    if (entries.some(f=>!f||f.deleted)) throw failure('NOT_FOUND','Alguno de los archivos ya no está disponible.',404);
    if ([...s.active].filter(item=>item.owner===ticket.owner).length>=LIMITS.concurrency) throw failure('CONCURRENCY','Máximo dos transferencias simultáneas.',429);
    return {ticket,entries};
  }
  async download(ticketId,req,res) {
    const {ticket,entries}=this.redeem(ticketId);
    const s=this.getState();
    const slot={owner:ticket.owner,req,res};s.active.add(slot);
    for(const f of entries) f.readers++;
    try {
      res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
      if(entries.length===1){
        const f=entries[0];
        res.setHeader('Content-Type','application/octet-stream');res.setHeader('Content-Length',f.size);
        res.setHeader('Content-Disposition',disposition(f.name));
        await this.writeFile(f,res,s);
      }else{
        res.setHeader('Content-Type','application/zip');
        res.setHeader('Content-Disposition',disposition('InterLAB-archivos.zip'));
        await this.writeZip(entries,res,s);
      }
      if (!res.destroyed) res.end();
    }finally{
      s.active.delete(slot);
      for (const f of entries) {f.readers--;if(f.deleted&&!f.readers) await fsp.rm(f.path,{force:true}).catch(()=>{});}
    }
  }
  async writeFile(file,res,s,writer=chunk=>writeResponse(res,chunk)) {
    for await(const chunk of fs.createReadStream(file.path,{highWaterMark:64*1024})){
      if(s.closing)throw failure('SESSION_ENDED','La sesión terminó.',409);
      await this.bandwidth.wait(chunk.length);await writer(chunk);
    }
  }
  async writeZip(entries,res,s) {
    // ZIP sin compresión, streaming y soporte ZIP64 para directorio situado >4 GiB.
    let offset=0;
    const central=[];
    const usedNames=new Set();
    async function write(chunk){ await writeResponse(res,chunk);offset+=chunk.length; }
    for (const file of entries){
      if(s.closing)throw failure('SESSION_ENDED','Sesión terminada.',409);
      const name=Buffer.from(zipName(file.name,usedNames),'utf8');
      const date=dosTime(file.createdAt);const position=offset;
      const header=Buffer.alloc(30);
      header.writeUInt32LE(0x04034b50,0);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);
      header.writeUInt16LE(0,8);header.writeUInt16LE(date.time,10);header.writeUInt16LE(date.date,12);
      header.writeUInt32LE(file.crc,14);header.writeUInt32LE(file.size,18);header.writeUInt32LE(file.size,22);
      header.writeUInt16LE(name.length,26);
      await write(header);await write(name);
      await this.writeFile(file,res,s,write);
      // El contenedor ZIP no necesita reanalizar los binarios; CRC registrado al cargar.
      central.push({file,name,date,position});
    }
    const centralOffset=offset;
    for(const {file,name,date,position} of central){
      const zip64=position>=0xffffffff;
      const extra=zip64?Buffer.alloc(12):Buffer.alloc(0);
      if(zip64){extra.writeUInt16LE(0x0001,0);extra.writeUInt16LE(8,2);extra.writeBigUInt64LE(BigInt(position),4);}
      const h=Buffer.alloc(46);
      h.writeUInt32LE(0x02014b50,0);h.writeUInt16LE(45,4);h.writeUInt16LE(zip64?45:20,6);
      h.writeUInt16LE(0x800,8);h.writeUInt16LE(0,10);h.writeUInt16LE(date.time,12);h.writeUInt16LE(date.date,14);
      h.writeUInt32LE(file.crc,16);h.writeUInt32LE(file.size,20);h.writeUInt32LE(file.size,24);
      h.writeUInt16LE(name.length,28);h.writeUInt16LE(extra.length,30);
      h.writeUInt32LE(zip64?0xffffffff:position,42);
      await write(h);await write(name);if(extra.length)await write(extra);
    }
    const centralSize=offset-centralOffset;
    if(centralOffset>=0xffffffff || centralSize>=0xffffffff || central.length>=0xffff){
      const zip64Offset=offset;
      const e=Buffer.alloc(56);e.writeUInt32LE(0x06064b50,0);e.writeBigUInt64LE(44n,4);
      e.writeUInt16LE(45,12);e.writeUInt16LE(45,14);
      e.writeBigUInt64LE(BigInt(central.length),24);e.writeBigUInt64LE(BigInt(central.length),32);
      e.writeBigUInt64LE(BigInt(centralSize),40);e.writeBigUInt64LE(BigInt(centralOffset),48);
      await write(e);
      const locator=Buffer.alloc(20);locator.writeUInt32LE(0x07064b50,0);locator.writeBigUInt64LE(BigInt(zip64Offset),8);locator.writeUInt32LE(1,16);await write(locator);
    }
    const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);
    end.writeUInt16LE(Math.min(central.length,0xffff),8);end.writeUInt16LE(Math.min(central.length,0xffff),10);
    end.writeUInt32LE(Math.min(centralSize,0xffffffff),12);end.writeUInt32LE(Math.min(centralOffset,0xffffffff),16);await write(end);
  }
  disconnectOwner(ownerId) {
    const s=this.state;
    if(!s || s.closing) return;
    for(const slot of s.active){
      if(slot.owner.endsWith(`:${ownerId}`)){
        if(slot.req && !slot.req.destroyed)slot.req.destroy();
        if(slot.res && !slot.res.destroyed)slot.res.destroy();
      }
    }
    for(const [id,batch] of s.batches){
      if(batch.owner.endsWith(`:${ownerId}`)){
        for(const entry of batch.files.values())if(entry.status==='reserved')s.reserved-=entry.size;
        s.batches.delete(id);
      }
    }
    for(const [id,ticket] of s.tickets) if(ticket.owner.endsWith(`:${ownerId}`))s.tickets.delete(id);
    this.notifyCapacity(s);
  }
  async endSession(){
    const s=this.state;if(!s)return;
    s.closing=true;this.state=null;
    for(const {req,res} of s.active){ if(req && !req.destroyed)req.destroy();if(res && !res.destroyed)res.destroy(); }
    s.batches.clear();s.tickets.clear();s.files.clear();
    // Cierre posterior a los manejadores en curso: no se publican cargas tardías.
    await Promise.allSettled([...s.pending]);
    await fsp.rm(s.directory,{recursive:true,force:true,maxRetries:5,retryDelay:100});
    await fsp.rmdir(this.rootDir).catch(()=>{}); // Solo si quedó vacío.
  }
  track(promise){const s=this.state;if(!s)return promise;s.pending.add(promise);promise.finally(()=>s.pending.delete(promise)).catch(()=>{});return promise;}
}
module.exports={FileStore,LIMITS,cleanName,disposition,updateCrc,finalCrc,ProjectionBandwidth};
