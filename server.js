const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { SessionStore, MAX_STUDENTS } = require('./src/session-store');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const ENABLE_NOTE_EXPORT = process.env.ENABLE_NOTE_EXPORT === 'true';
const store = new SessionStore();

app.get('/config.js', (_req, res) => {
  res.type('application/javascript').send(`window.APP_CONFIG = ${JSON.stringify({ allowNoteExport: ENABLE_NOTE_EXPORT })};`);
});
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
  store.endSession();
}

io.on('connection', socket => {
  socket.on('teacher:create-session', callback => {
    if (store.getRole(socket.id)) return reply(callback, { ok: false, error: 'Este navegador ya tiene un rol asignado en la sesión.' });
    reply(callback, store.createSession(socket.id));
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
    const result = store.removeSocket(socket.id);
    if (!result.changed) return;
    if (result.ended) endActiveSession('Se perdió la conexión del docente; la sesión se cerró.');
    else updateRoster();
  });
});

server.listen(PORT, HOST, () => console.log(`Sistema local de retroalimentación listo en http://localhost:${PORT}`));
module.exports = { app, server, io, store };