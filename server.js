'use strict';
const express=require('express');
const http=require('http');
const https=require('https');
const fs=require('fs');
const path=require('path');
const os=require('os');
const crypto=require('crypto');
const {Server}=require('socket.io');
const {SessionStore,TEACHER_RECONNECT_MS}=require('./src/session-store');
const {FileStore}=require('./src/file-store');
const {getLanIPv4Addresses,isLoopbackAddress}=require('./src/network-addresses');

const app=express();
app.disable('x-powered-by');
const HTTPS_ENABLED=process.env.HTTPS_ENABLED!=='false';
const certDir=path.join(__dirname,'certs');
let server;
if(HTTPS_ENABLED){
  const certFile=path.join(certDir,'interlab.pem'),keyFile=path.join(certDir,'interlab-key.pem');
  if(!fs.existsSync(certFile)||!fs.existsSync(keyFile)){
    console.error('Faltan los certificados HTTPS. Ejecuta: npm run setup:https');process.exit(1);
  }
  server=https.createServer({cert:fs.readFileSync(certFile),key:fs.readFileSync(keyFile)},app);
}else server=http.createServer(app);
const io=new Server(server);
const PORT=Number(process.env.PORT||3000),HOST=process.env.HOST||'0.0.0.0';
const ENABLE_NOTE_EXPORT=process.env.ENABLE_NOTE_EXPORT==='true';
const store=new SessionStore();
const cookieName='interlab_docente';
function cookies(header=''){
  return Object.fromEntries(String(header).split(';').map(entry=>{const p=entry.indexOf('=');return p<0?['','']:[entry.slice(0,p).trim(),entry.slice(p+1).trim()];}));
}
function cookieHeader(value,expired=false){return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict${HTTPS_ENABLED?'; Secure':''}${expired?'; Max-Age=0':''}`;}
const rootDir=path.resolve(process.env.INTERLAB_FILES_DIR||path.join(os.tmpdir(),'interlab-temp-files'));
const fileStore=new FileStore({
  rootDir,
  onChange:()=>io.emit('files:changed'),
  isOwnerConnected:(owner,sid)=>{const [role,id]=owner.split(':');return Boolean(store.session?.id===sid && (role==='teacher'?store.teacherConnected() && id==='teacher':store.isStudentInSession(id)));},
  onCapacity:warning=>{if(store.session?.teacher)io.to(store.session.teacher).emit('files:capacity-alert',{warning});},
  isProjectionActive:()=>store.activeSource().kind!=='waiting',
  projectionBytesPerSecond:Number(process.env.INTERLAB_FILE_BPS_DURING_PROJECTION||1024*1024)
});
// Antes de aceptar clientes se eliminan exclusivamente subdirectorios UUID gestionados
// por InterLAB. Nunca se borra el directorio raíz ni archivos ajenos al proyecto.
fileStore.cleanupStaleSessions();
const cleanupTimer=setInterval(()=>fileStore.expireBatches(),60_000);cleanupTimer.unref();

const sendApp=res=>res.sendFile(path.join(__dirname,'public','index.html'));
app.get('/docente',(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(store.expireTeacher()){updateRoster();broadcastProjection();}
  const result=store.claimTeacher(cookies(req.headers.cookie)[cookieName]);
  if(!result.ok)return res.status(423).type('html').send('<!doctype html><html lang="es"><meta charset="utf-8"><title>InterLAB — control ocupado</title><body><h1>Control docente ocupado</h1><p>Hay otro navegador docente autorizado. Cuando venza su periodo de reconexión, vuelve a cargar esta dirección.</p></body></html>');
  if(result.credential)res.setHeader('Set-Cookie',cookieHeader(result.credential));
  return sendApp(res);
});
app.get('/alumno',(_req,res)=>sendApp(res));
app.get('/proyeccion.html',(req,res)=>res.redirect(302,'/proyeccion'));
app.get('/proyeccion',(req,res)=>{
  if(!isLoopbackAddress(req.socket.remoteAddress))return res.status(403).send('La proyección solo está disponible en la computadora fija.');
  res.setHeader('Cache-Control','no-store');
  return res.sendFile(path.join(__dirname,'public','proyeccion.html'));
});
app.get('/',(_req,res)=>res.redirect(302,'/alumno'));
app.get('/index.html',(_req,res)=>res.redirect(302,'/alumno'));
app.get('/config.js',(_req,res)=>res.type('application/javascript').send(`window.APP_CONFIG=${JSON.stringify({allowNoteExport:ENABLE_NOTE_EXPORT})};`));

// Recuperación administrativa local extraordinaria: requiere un secreto aleatorio
// conservado en un fichero 0600, más una solicitud desde loopback.
const recoveryDir=path.join(rootDir,'.local-control');
fs.mkdirSync(recoveryDir,{recursive:true,mode:0o700});
const localSecret=crypto.randomBytes(32).toString('hex');
const recoveryFile=path.join(recoveryDir,'recovery.json');
fs.writeFileSync(recoveryFile,JSON.stringify({secret:localSecret,port:PORT,protocol:HTTPS_ENABLED?'https':'http'}),{mode:0o600});
try{fs.chmodSync(recoveryFile,0o600);}catch{}
app.post('/api/local/release-teacher',(req,res)=>{
  if(!isLoopbackAddress(req.socket.remoteAddress)||req.get('x-interlab-local-secret')!==localSecret)return res.sendStatus(403);
  const former=store.releaseTeacher();if(former)io.to(former).emit('teacher:revoked');
  fileStore.disconnectOwner('teacher');updateRoster();broadcastProjection();return res.json({ok:true,sessionPreserved:Boolean(store.session)});
});

const filesApi=express.Router();
filesApi.use(express.json({limit:'64kb'}));
filesApi.use((req,res,next)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
  const token=/^Bearer (.{1,200})$/i.exec(req.get('Authorization')||'')?.[1];
  const actor=store.fileActor(token);
  if(!actor)return res.status(401).json({ok:false,error:'Acceso a archivos no autorizado.'});
  req.fileActor=actor;next();
});
function apiError(res,error){
  if(res.destroyed||res.headersSent){if(!res.destroyed)res.destroy();return;}
  const status=Number.isInteger(error?.status)?error.status:500;
  if(status===500)console.error('Error de archivos:',error);
  res.status(status).json({ok:false,code:error?.code||'ERROR',error:status===500?'No se pudo completar la operación.':error.message});
}
function runApi(handler){return(req,res)=>{
  try{const work=Promise.resolve(handler(req,res));fileStore.track(work).catch(error=>apiError(res,error));}
  catch(error){apiError(res,error);}
};}
filesApi.get('/',runApi((req,res)=>res.json({ok:true,files:fileStore.list(req.fileActor)})));
filesApi.post('/batches',runApi((req,res)=>res.json({ok:true,...fileStore.reserve(req.fileActor,req.body?.files)})));
filesApi.put('/batches/:batch/:file',runApi(async(req,res)=>{
  const result=await fileStore.upload(req.fileActor,req.params.batch,req.params.file,req,res);
  if(!res.destroyed)res.json(result);
}));
filesApi.delete('/:id',runApi(async(req,res)=>res.json(await fileStore.delete(req.fileActor,req.params.id))));
filesApi.post('/tickets',runApi((req,res)=>res.json({ok:true,...fileStore.ticket(req.fileActor,req.body?.ids)})));
app.get('/api/files/download/:ticket',runApi(async(req,res)=>fileStore.download(req.params.ticket,req,res)));
app.use('/api/files',filesApi);
app.use(express.static(path.join(__dirname,'public')));

function reply(callback,result){if(typeof callback==='function')callback(result);}
function updateRoster(){
  if(!store.session)return;
  if(store.session.teacher){
    io.to(store.session.teacher).emit('participants:update',store.roster());
    io.to(store.session.teacher).emit('presentation:queue-update',store.presentationQueueRoster());
  }
}
let receiverSocket=null;
let lastSource={kind:'waiting',id:null,epoch:-1};
function projectionState(){
  const source=store.activeSource(),status=store.teacherStatus();
  return {...source,teacher:status,hasSession:Boolean(store.session),serverNow:Date.now(),alias:source.kind==='student'?store.session.students.get(source.id)?.alias:null};
}
function broadcastProjection(){
  const state=projectionState();
  if(lastSource.id && (lastSource.id!==state.id||lastSource.kind!==state.kind||lastSource.epoch!==state.epoch))io.to(lastSource.id).emit('presentation:source-stop');
  lastSource={kind:state.kind,id:state.id||null,epoch:state.epoch};
  if(receiverSocket)io.to(receiverSocket).emit('projection:source',state);
  if(store.session?.teacher)io.to(store.session.teacher).emit('projection:status',state);
}
async function endActiveSession(message){
  if(!store.session)return;
  io.emit('session:ended',{message});
  io.emit('presentation:source-stop');
  store.endSession();
  broadcastProjection();
  try{await fileStore.endSession();}catch(error){console.error('Error al limpiar archivos:',error);}
}
let reconnectTimer=null,warningTimer=null;
function clearReconnectTimers(){clearTimeout(reconnectTimer);clearTimeout(warningTimer);reconnectTimer=null;warningTimer=null;}
function scheduleTeacherExpiration(){
  clearReconnectTimers();const expiresAt=store.teacherLease?.expiresAt;
  if(!expiresAt)return;
  warningTimer=setTimeout(()=>broadcastProjection(),Math.max(0,expiresAt-Date.now()-60_000));warningTimer.unref?.();
  reconnectTimer=setTimeout(()=>{if(store.expireTeacher()){updateRoster();broadcastProjection();}clearReconnectTimers();},Math.max(0,expiresAt-Date.now()));reconnectTimer.unref?.();
}
// Evita que un sitio ajeno abra un socket en el navegador con permisos de docente.
io.use((socket,next)=>{
  const origin=socket.handshake.headers.origin,host=socket.handshake.headers.host;
  if(origin){try{if(new URL(origin).host!==host)return next(new Error('Origen no autorizado.'));}catch{return next(new Error('Origen inválido.'));}}
  next();
});
io.on('connection',socket=>{
  socket.on('projection:register',(_payload,callback)=>{
    if(!isLoopbackAddress(socket.handshake.address))return reply(callback,{ok:false,error:'Solo el servidor fijo puede recibir la proyección.'});
    if(receiverSocket && receiverSocket!==socket.id)io.to(receiverSocket).emit('projection:replaced');
    receiverSocket=socket.id;socket.data.projectionReceiver=true;
    reply(callback,{ok:true});broadcastProjection();
  });
  socket.on('teacher:attach',(_payload,callback)=>{
    const result=store.attachTeacher(socket.id,cookies(socket.handshake.headers.cookie)[cookieName]);
    if(result.ok){
      if(result.replacedSocketId)io.to(result.replacedSocketId).emit('teacher:revoked');
      clearReconnectTimers();updateRoster();broadcastProjection();
    }
    reply(callback,result);
  });
  socket.on('teacher:create-session',callback=>{
    const result=store.createSession(socket.id);
    if(result.ok){fileStore.startSession(store.session.id);broadcastProjection();}
    reply(callback,result);
  });
  socket.on('student:join',(payload={},callback)=>{
    if(store.getRole(socket.id))return reply(callback,{ok:false,error:'Ya tienes un rol en la sesión.'});
    const result=store.joinStudent(socket.id,payload.code,payload.alias);
    reply(callback,result);if(result.ok)updateRoster();
  });
  socket.on('teacher:get-participants',({token}={},callback)=>{
    if(!store.authorizeTeacher(socket.id,token))return reply(callback,{ok:false,error:'Permiso denegado.'});
    reply(callback,{ok:true,participants:store.roster(),queue:store.presentationQueueRoster()});
  });
  socket.on('teacher:add-observation',(payload={},callback)=>{
    const result=store.addObservation(socket.id,payload.token,payload.studentId,payload.text);
    reply(callback,result);if(result.ok)io.to(payload.studentId).emit('student:observations-updated');
  });
  socket.on('student:get-observations',callback=>reply(callback,store.observationsForStudent(socket.id)));
  socket.on('student:request-presentation',(_payload,callback)=>{
    const result=store.requestStudent(socket.id);reply(callback,result);if(result.ok)updateRoster();
  });
  socket.on('student:withdraw-presentation',(_payload,callback)=>{
    if(!store.isStudentInSession(socket.id))return reply(callback,{ok:false,error:'Sin sesión.'});
    if(store.session.selectedStudent===socket.id)return reply(callback,{ok:false,error:'Utiliza Detener proyección para finalizar tu turno.'});
    store.stopStudentPresentation(socket.id);updateRoster();reply(callback,{ok:true});
  });
  socket.on('teacher:select-student',({token,studentId}={},callback)=>{
    if(!store.authorizeTeacher(socket.id,token))return reply(callback,{ok:false,error:'Permiso denegado.'});
    const result=store.selectStudent(studentId);reply(callback,result);
    if(!result.ok)return;
    if(result.previousStudent)io.to(result.previousStudent).emit('screen:stop');
    io.to(studentId).emit('screen:requested',{message:'Tu docente solicita que proyectes. Autoriza la captura para comenzar.'});
    updateRoster();broadcastProjection();
  });
  socket.on('teacher:reject-request',({token,studentId}={},callback)=>{
    if(!store.authorizeTeacher(socket.id,token))return reply(callback,{ok:false,error:'Permiso denegado.'});
    const result=store.rejectStudentRequest(studentId);reply(callback,result);
    if(result.ok){io.to(studentId).emit('presentation:request-rejected');updateRoster();}
  });
  socket.on('student:screen-ready',(_payload,callback)=>{
    const result=store.markScreenReady(socket.id);reply(callback,result);
    if(result.ok){broadcastProjection();updateRoster();}
  });
  socket.on('teacher:screen-ready',({token}={},callback)=>{
    if(!store.authorizeTeacher(socket.id,token))return reply(callback,{ok:false,error:'Permiso denegado.'});
    reply(callback,store.markTeacherReady(socket.id));broadcastProjection();
  });
  socket.on('teacher:screen-ended',({token}={})=>{
    if(!store.authorizeTeacher(socket.id,token))return;
    store.session.teacherCaptureReady=false;store.session.epoch++;broadcastProjection();
  });
  socket.on('student:stop-sharing',(_payload,callback)=>{
    if(!store.isStudentInSession(socket.id))return reply(callback,{ok:false,error:'Permiso denegado.'});
    const result=store.stopStudentPresentation(socket.id);reply(callback,result);
    io.to(socket.id).emit('screen:stop');updateRoster();if(result.wasSelected)broadcastProjection();
  });
  socket.on('teacher:stop-presentation',({token}={},callback)=>{
    if(!store.authorizeTeacher(socket.id,token))return reply(callback,{ok:false,error:'Permiso denegado.'});
    const selected=store.session.selectedStudent;
    if(selected){store.stopStudentPresentation(selected);io.to(selected).emit('screen:stop');updateRoster();broadcastProjection();}
    reply(callback,{ok:true});
  });
  socket.on('teacher:end-session',({token}={},callback)=>{
    if(!store.authorizeTeacher(socket.id,token))return reply(callback,{ok:false,error:'Permiso denegado.'});
    endActiveSession('El docente finalizó la sesión. Se eliminó el estado temporal.').then(()=>reply(callback,{ok:true}));
  });
  // Solo el emisor titular del turno y el receptor local pueden intercambiar SDP/ICE.
  socket.on('screen:signal',({to,epoch,description,candidate}={})=>{
    const active=store.activeSource();
    if(active.kind==='waiting'||epoch!==active.epoch||!receiverSocket)return;
    if(socket.id===receiverSocket && socket.data.projectionReceiver && to===active.id){
      io.to(to).emit('screen:signal',{from:socket.id,epoch,description,candidate});
    }else if(socket.id===active.id && to===receiverSocket && (
      active.kind==='student'?store.isStudentInSession(socket.id):store.teacherConnected()&&store.session?.teacher===socket.id
    )){
      io.to(receiverSocket).emit('screen:signal',{from:socket.id,epoch,description,candidate});
    }
  });
  socket.on('disconnect',()=>{
    if(receiverSocket===socket.id){receiverSocket=null;socket.data.projectionReceiver=false;}
    if(store.disconnectTeacher(socket.id)){
      fileStore.disconnectOwner('teacher');scheduleTeacherExpiration();broadcastProjection();return;
    }
    if(store.isStudentInSession(socket.id))fileStore.disconnectOwner(socket.id);
    const result=store.removeSocket(socket.id);
    if(result.changed){updateRoster();if(result.wasSelected)broadcastProjection();}
  });
});
server.listen(PORT,HOST,()=>{
  const protocol=HTTPS_ENABLED?'https':'http';
  console.log(`InterLAB 0.5.0 activo en ${HOST}:${PORT}.`);
  console.log(`Receptor local: ${protocol}://localhost:${PORT}/proyeccion`);
  console.log(`Docente LAN: ${protocol}://<IP-de-servidor>:${PORT}/docente`);
  for(const entry of getLanIPv4Addresses())console.log(`LAN ${entry.interfaceName}: ${protocol}://${entry.address}:${PORT}/alumno`);
});
let shuttingDown=false;
async function gracefulShutdown(){
  if(shuttingDown)return;shuttingDown=true;clearReconnectTimers();
  try{await fileStore.endSession();}catch(error){console.error('Limpieza al cerrar:',error);}
  try{fs.rmSync(recoveryFile,{force:true});}catch{}
  io.close();server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),1500).unref();
}
for(const sig of ['SIGTERM','SIGINT'])process.once(sig,gracefulShutdown);
module.exports={app,server,io,store,fileStore};
