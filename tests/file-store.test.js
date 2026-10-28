'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { Readable, PassThrough } = require('node:stream');
const {FileStore, LIMITS} = require('../src/file-store');
const {SessionStore}=require('../src/session-store');
function fixture(t){
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'interlab-test-'));
  const store=new FileStore({rootDir:path.join(base,'temp')});store.startSession('s1');
  t.after(async()=>{await store.endSession();await fsp.rm(base,{recursive:true,force:true});});
  const teacher={role:'teacher',id:'teacher',alias:'Docente',sessionId:'s1'};
  const student={role:'student',id:'a',alias:'Ana',sessionId:'s1'};
  const other={role:'student',id:'b',alias:'Beto',sessionId:'s1'};
  return {store,teacher,student,other};
}
async function upload(store,actor,name,contents){
  const buffer=Buffer.from(contents);
  const batch=store.reserve(actor,[{name,size:buffer.length}]);
  const req=Readable.from([buffer]);req.headers={'content-length':String(buffer.length)};req.complete=true;
  const result=await store.upload(actor,batch.batchId,batch.files[0].id,req,{});
  return result.id;
}
async function download(store,actor,ids){
  const ticket=store.ticket(actor,ids).url.split('/').pop();
  const stream=new PassThrough();const headers={};stream.setHeader=(key,value)=>{headers[key.toLowerCase()]=value;};
  const chunks=[];stream.on('data',chunk=>chunks.push(chunk));
  await store.download(ticket,{},stream);
  await new Promise(resolve=>stream.once('end',resolve));
  return {contents:Buffer.concat(chunks),headers};
}
test('valida límites y reservas concurrentes sin sobrepasar la cuota',t=>{
  const {store,student}=fixture(t);
  assert.throws(()=>store.reserve(student,[{name:'x',size:LIMITS.file+1}]),/50 MB/);
  assert.throws(()=>store.reserve(student,Array.from({length:5},(_,i)=>({name:`${i}.bin`,size:LIMITS.file}))),/200 MB/);
  const batch=store.reserve(student,[{name:'uno.dat',size:LIMITS.file},{name:'dos.dat',size:LIMITS.file}]);
  assert.equal(store.state.reserved,100_000_000);
  assert.equal(batch.files.length,2);
});
test('subir, listar, descargar, permitir nombres repetidos y restringir eliminación',async t=>{
  const {store,student,other,teacher}=fixture(t);
  const first=await upload(store,student,'reporte.txt','Hola InterLAB');
  const second=await upload(store,student,'reporte.txt','Versión nueva');
  assert.equal(store.list(teacher).length,2);
  assert.equal(store.list(other)[0].own,false);
  assert.equal(store.list(student)[0].own,true);
  const received=await download(store,other,[first]);
  assert.equal(received.contents.toString(),'Hola InterLAB');
  assert.match(received.headers['content-disposition'],/reporte.txt/);
  await assert.rejects(store.delete(other,first),/propios archivos/);
  await store.delete(teacher,first);
  assert.throws(()=>store.ticket(student,[first]),/no encontrado/);
  assert.equal(store.list(student).length,1);
  assert.equal(store.list(teacher)[0].id,second);
});
test('ZIP de múltiples archivos: firmas, dos nombres distintos y contenido binario',async t=>{
  const {store,student}=fixture(t);
  const first=await upload(store,student,'archivo.txt','uno');
  const second=await upload(store,student,'archivo.txt','dos');
  const zip=await download(store,student,[first,second]);
  assert.equal(zip.headers['content-type'],'application/zip');
  assert.equal(zip.contents.readUInt32LE(0),0x04034b50);
  assert.equal(zip.contents.readUInt32LE(zip.contents.length-22),0x06054b50);
  assert.ok(zip.contents.includes(Buffer.from('archivo.txt')));
  assert.ok(zip.contents.includes(Buffer.from('archivo (2).txt')));
  assert.ok(zip.contents.includes(Buffer.from('uno')));
  assert.ok(zip.contents.includes(Buffer.from('dos')));
});
test('un ticket solo se usa una vez',async t=>{
  const {store,student}=fixture(t);
  const id=await upload(store,student,'a','a');
  const ticket=store.ticket(student,[id]).url.split('/').pop();
  assert.equal(store.redeem(ticket).entries.length,1);
  assert.throws(()=>store.redeem(ticket),/caducó/);
});
test('dos transferencias activas por usuario; tercera rechazada',t=>{
  const {store,student,other}=fixture(t);
  const a=store.begin(student,{},{}),b=store.begin(student,{},{});
  assert.throws(()=>store.begin(student,{},{}),/Máximo dos/);
  const c=store.begin(other,{},{});
  c.release();a.release();b.release();
});
test('limpia archivos y reserva al cerrar la sesión, incluso con una carga reservada',async t=>{
  const {store,student}=fixture(t);
  const file=await upload(store,student,'test.bin','contenido');
  const dir=store.state.directory;
  store.reserve(student,[{name:'pendiente.txt',size:300}]);
  await store.endSession();
  assert.equal(fs.existsSync(dir),false);
  assert.throws(()=>store.list(student),/sesión activa/);
});
test('identidad HTTP temporal: token docente o estudiante, inválido tras desconexión',()=>{
  const sessions=new SessionStore();const created=sessions.createSession('teacher');
  const joined=sessions.joinStudent('student1',created.code,'Ana');
  assert.equal(sessions.fileActor(created.token).role,'teacher');
  assert.equal(sessions.fileActor(joined.fileToken).role,'student');
  assert.equal(sessions.fileActor('wrong'),null);
  sessions.removeSocket('student1');
  assert.equal(sessions.fileActor(joined.fileToken),null);
});
