const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Server } = require('socket.io');
const { SessionStore, MAX_STUDENTS } = require('./src/session-store');
const { FileStore } = require('./src/file-store');
const { getLanIPv4Addresses, isLoopbackAddress } = require('./src/network-addresses');

const app = express();
const HTTPS_ENABLED = process.env.HTTPS_ENABLED !== 'false';
const certDir = path.join(__dirname, 'certs');
let server;
if (HTTPS_ENABLED) {
  const certFile = path.join(certDir, 'interlab.pem');
  const keyFile = path.join(certDir, 'interlab-key.pem');
  if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) {
    console.error('Faltan los certificados HTTPS. Ejecuta primero: npm run setup:https');
    process.exit(1);
  }
  server = https.createServer({ cert: fs.readFileSync(certFile), key: fs.readFileSync(keyFile) }, app);
} else {
  server = http.createServer(app);
}
const io = new Server(server);
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const ENABLE_NOTE_EXPORT = process.env.ENABLE_NOTE_EXPORT === 'true';
const store = new SessionStore();
const fileStore = new FileStore({
  rootDir: process.env.INTERLAB_FILES_DIR || path.join(os.tmpdir(), 'interlab-temp-files', String(process.pid)),
  onChange: () => io.emit('files:changed'),
  isOwnerConnected: (owner,sid) => { const [role,id]=owner.split(':'); return store.getRole(id)?.sid===sid && store.getRole(id)?.role===role; },
  onCapacity: warning => { if (store.session) io.to(store.session.teacher).emit('files:capacity-alert', { warning }); },
  isProjectionActive: () => Boolean(store.session?.selectedStudent && store.session?.screenReady.has(store.session.selectedStudent)),
  projectionBytesPerSecond: Number(process.env.INTERLAB_FILE_BPS_DURING_PROJECTION || 1024 * 1024)
});


const fileCleanupTimer = setInterval(() => fileStore.expireBatches(),60_000);
fileCleanupTimer.unref();

// La vista docente solo se sirve a conexiones locales del anfitrión. Los equipos
// cliente de la LAN deben entrar por /alumno. Esto limita la ruta, pero no sustituye
// una autenticación docente robusta ni la autorización de cada evento Socket.IO.
function sendApp(res) {
  return res.sendFile(path.join(__dirname, 'public', 'index.html'));
}
app.get('/docente', (req, res) => {
  if (!isLoopbackAddress(req.socket.remoteAddress)) {
    return res.status(403).type('text/plain').send('Acceso denegado. La vista docente solo está disponible en la computadora anfitriona.');
  }
  return sendApp(res);
});
app.get('/alumno', (_req, res) => sendApp(res));
app.get('/', (req, res) => res.redirect(302, isLoopbackAddress(req.socket.remoteAddress) ? '/docente' : '/alumno'));
// Evita que /index.html permita saltarse la selección de ruta por rol.
app.get('/index.html', (req, res) => res.redirect(302, isLoopbackAddress(req.socket.remoteAddress) ? '/docente' : '/alumno'));

app.get('/config.js', (_req, res) => {
  res.type('application/javascript').send(`window.APP_CONFIG = ${JSON.stringify({ allowNoteExport: ENABLE_NOTE_EXPORT })};`);
});
// API de archivos: credenciales efímeras en cabecera Authorization; los binarios
// se almacenan fuera de public/ y no se serializan mediante Socket.IO.
const filesApi = express.Router();
filesApi.use(express.json({ limit: '64kb' }));
filesApi.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const token = /^Bearer (.{1,200})$/i.exec(req.get('Authorization') || '')?.[1];
  const actor = store.fileActor(token);
  if (!actor) return res.status(401).json({ ok: false, error: 'Acceso a archivos no autorizado.' });
  req.fileActor = actor;
  next();
});
function apiError(res, error) {
  if (res.destroyed || res.headersSent) { if (!res.destroyed) res.destroy(); return; }
  const status = error?.status && Number.isInteger(error.status) ? error.status : 500;
  if (status === 500) console.error('Error del módulo de archivos:', error);
  res.status(status).json({ ok:false, code:error?.code || 'ERROR', error:status===500?'No se pudo completar la operación.':error.message });
}
function runApi(handler) { return (req,res) => {
  try {
    const work = Promise.resolve(handler(req,res));
    fileStore.track(work).catch(error => apiError(res,error));
  } catch(error) { apiError(res,error); }
}; }
filesApi.get('/', runApi((req,res) => res.json({ok:true,files:fileStore.list(req.fileActor)})));
filesApi.post('/batches', runApi((req,res) => res.json({ok:true,...fileStore.reserve(req.fileActor,req.body?.files)})));
filesApi.put('/batches/:batch/:file', runApi(async(req,res) => {
  const result = await fileStore.upload(req.fileActor,req.params.batch,req.params.file,req,res);
  if(!res.destroyed)res.json(result);
}));
filesApi.delete('/:id', runApi(async(req,res) => res.json(await fileStore.delete(req.fileActor,req.params.id))));
filesApi.post('/tickets', runApi((req,res) => res.json({ok:true,...fileStore.ticket(req.fileActor,req.body?.ids)})));
// El ticket de descarga es aleatorio, caduca en 60 s y se consume una sola vez.
app.get('/api/files/download/:ticket', runApi(async(req,res) => fileStore.download(req.params.ticket,req,res)));
app.use('/api/files', filesApi);
app.use(express.static(path.join(__dirname, 'public')));

function reply(callback, result) { if (typeof callback === 'function') callback(result); }
function updateRoster() {
  if (!store.session) return;
  io.to(store.session.teacher).emit('participants:update', store.roster());
  io.to(store.session.teacher).emit('presentation:queue-update', store.presentationQueueRoster());
}
function endActiveSession(message) {
  const current = store.session;
  if (!current) return;
  io.emit('session:ended', { message });
  io.emit('screen:stop');
  fileStore.endSession().catch(error => console.error('Error al limpiar los archivos temporales:', error));
  store.endSession();
}

io.on('connection', socket => {
  socket.on('teacher:create-session', callback => {
    // Solo un navegador ejecutado en el propio host puede crear la sesión docente.
    if (!isLoopbackAddress(socket.handshake.address)) return reply(callback, { ok: false, error: 'La sesión docente solo puede iniciarse desde la computadora anfitriona.' });
    if (store.getRole(socket.id)) return reply(callback, { ok: false, error: 'Este navegador ya tiene un rol asignado en la sesión.' });
    const result = store.createSession(socket.id);
    if (result.ok) fileStore.startSession(store.session.id);
    reply(callback, result);
  });

  socket.on('student:join', (payload = {}, callback) => {
    if (store.getRole(socket.id)) return reply(callback, { ok: false, error: 'Este navegador ya tiene un rol asignado en la sesión.' });
    const result = store.joinStudent(socket.id, payload.code, payload.alias);
    reply(callback, result);
    if (result.ok) updateRoster();
  });

  socket.on('teacher:get-participants', ({ token } = {}, callback) => {
    if (!store.authorizeTeacher(socket.id, token)) return reply(callback, { ok: false, error: 'Permiso denegado.' });
    reply(callback, { ok: true, participants: store.roster() });
  });

  socket.on('teacher:add-observation', (payload = {}, callback) => {
    const result = store.addObservation(socket.id, payload.token, payload.studentId, payload.text);
    reply(callback, result);
    if (result.ok) io.to(payload.studentId).emit('student:observations-updated');
  });

  socket.on('student:get-observations', callback => reply(callback, store.observationsForStudent(socket.id)));

  function selectForTeacher(studentId) {
    const result = store.selectStudent(studentId);
    if (!result.ok) return result;
    const { previousStudent, student, ready, queue } = result;
    // Incluso si el docente vuelve a elegir al mismo alumno, reiniciar ambos peers evita
    // reutilizar una negociación vieja o candidatos ICE pendientes.
    if (previousStudent) io.to(previousStudent).emit('screen:stop');
    io.to(store.session.teacher).emit('screen:queue-update', queue);
    if (ready) {
      // Notificar primero al estudiante es útil, pero el cliente no depende del orden entre sockets.
      io.to(studentId).emit('screen:requested', { message: 'El docente te ha concedido el acceso para presentar.' });
      io.to(store.session.teacher).emit('screen:selected', { studentId, alias: student.alias });
    } else {
      io.to(store.session.teacher).emit('screen:selected', { studentId: null, alias: student.alias, waitingForAuthorization: true });
      io.to(studentId).emit('screen:requested', { message: 'El docente te ha elegido. Autoriza la captura de pantalla para comenzar.' });
    }
    return { ok: true, ready };
  }

  // Selección directa del docente: tiene prioridad sobre la cola.
  socket.on('teacher:select-student', ({ token, studentId } = {}, callback) => {
    if (!store.authorizeTeacher(socket.id, token)) return reply(callback, { ok: false, error: 'Permiso denegado.' });
    const result = selectForTeacher(studentId);
    reply(callback, result);
  });

  // El alumno llega aquí solo después de autorizar getDisplayMedia. Aún no transmite:
  // únicamente queda disponible y entra en la cola si el docente no lo eligió directamente.
  socket.on('student:screen-ready', (_payload, callback) => {
    const result = store.markScreenReady(socket.id);
    if (!result.ok) return reply(callback, result);
    reply(callback, { ok: true, selected: result.selected, queue: result.queue });
    if (result.selected && store.session?.selectedStudent === socket.id) {
      const student = store.session.students.get(socket.id);
      io.to(store.session.teacher).emit('screen:selected', { studentId: socket.id, alias: student.alias });
    }
    updateRoster();
  });

  socket.on('teacher:stop-presentation', ({ token } = {}, callback) => {
    if (!store.authorizeTeacher(socket.id, token)) return reply(callback, { ok: false, error: 'Permiso denegado.' });
    const session = store.session;
    const previous = session.selectedStudent;
    session.selectedStudent = null;
    if (previous) io.to(previous).emit('screen:stop');
    io.to(session.teacher).emit('screen:cleared');
    reply(callback, { ok: true });
  });

  socket.on('teacher:end-session', ({ token } = {}, callback) => {
    if (!store.authorizeTeacher(socket.id, token)) return reply(callback, { ok: false, error: 'Permiso denegado.' });
    endActiveSession('El docente finalizó la sesión. Se eliminó el estado temporal.');
    reply(callback, { ok: true });
  });

  socket.on('student:stop-sharing', () => {
    const session = store.session;
    const role = store.getRole(socket.id);
    if (!session || role?.role !== 'student' || role.sid !== session.id) return;
    const result = store.stopStudentPresentation(socket.id);
    if (result.wasSelected) {
      io.to(socket.id).emit('screen:stop');
      io.to(session.teacher).emit('screen:student-stopped');
    }
    updateRoster();
  });

  // Señalización WebRTC: solo el docente y el estudiante seleccionado pueden intercambiar mensajes.
  socket.on('screen:signal', ({ to, description, candidate } = {}) => {
    const session = store.session;
    if (!session || !to) return;
    const fromRole = store.getRole(socket.id);
    const toRole = store.getRole(to);
    if (!fromRole || !toRole || fromRole.sid !== session.id || toRole.sid !== session.id) return;
    const allowedPair = (fromRole.role === 'teacher' && toRole.role === 'student' && session.selectedStudent === to && session.screenReady.has(to))
      || (fromRole.role === 'student' && toRole.role === 'teacher' && session.selectedStudent === socket.id && session.screenReady.has(socket.id));
    if (!allowedPair) return;
    io.to(to).emit('screen:signal', { from: socket.id, description, candidate });
  });

  socket.on('disconnect', () => {
    if (store.session?.selectedStudent === socket.id) io.to(store.session.teacher).emit('screen:student-stopped');
    fileStore.disconnectOwner(socket.id);
    const result = store.removeSocket(socket.id);
    if (!result.changed) return;
    if (result.ended) endActiveSession('Se perdió la conexión del docente; la sesión se cerró.');
    else updateRoster();
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Sistema local de retroalimentación listo en ${HOST}:${PORT}.`);
  const protocol = HTTPS_ENABLED ? 'https' : 'http';
  console.log(`Vista docente (solo en el anfitrión): ${protocol}://localhost:${PORT}/docente`);
  const addresses = getLanIPv4Addresses();
  if (addresses.length) {
    console.log('Direcciones para los equipos cliente (elige la que pertenezca a la LAN del laboratorio):');
    for (const item of addresses) console.log(`  ${item.interfaceName}: ${protocol}://${item.address}:${PORT}/alumno`);
  } else {
    console.log('No se detectó una dirección IPv4 LAN. Comprueba la conexión de red del anfitrión.');
  }
});
// Liberar temporales al detener normalmente el proceso (Ctrl+C, cierre del servicio).
let shuttingDown = false;
async function gracefulShutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  try { await fileStore.endSession(); }
  catch (error) { console.error('No se pudo limpiar el almacenamiento temporal:', error); }
  io.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}
for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, gracefulShutdown);

module.exports = { app, server, io, store, fileStore };
