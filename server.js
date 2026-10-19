const express = require("express");
const http = require("http");
const crypto = require("crypto");
const path = require("path");
const { Server } = require("socket.io");
//asd
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";
const MAX_STUDENTS = 30;

let session = null;
const roles = new Map();

app.use(express.static(path.join(__dirname, "public")));

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let value;
  do {
    value = Array.from({ length: 6 }, () => chars[crypto.randomInt(chars.length)]).join("");
  } while (session && value === session.code);
  return value;
}

function makeToken() {
  return crypto.randomBytes(24).toString("hex");
}

function participantList() {
  if (!session) return [];
  return [...session.students.entries()].map(([socketId, student]) => ({
    id: student.id,
    alias: student.alias,
    screenReady: student.screenReady,
    selected: session.selectedStudent === socketId
  }));
}

function updateParticipants() {
  if (session) io.to(session.teacher).emit("participants:update", participantList());
}

function teacherSession(socket, suppliedToken) {
  const role = roles.get(socket.id);
  return Boolean(session && role && role.role === "teacher" && role.sessionId === session.id && suppliedToken === session.token);
}

function studentForId(id) {
  if (!session) return null;
  for (const [socketId, student] of session.students) {
    if (student.id === id) return { socketId, student };
  }
  return null;
}

function closeSession(message) {
  if (!session) return;
  const sessionId = session.id;
  io.emit("session:ended", { message });
  for (const [socketId, role] of roles) {
    if (role.sessionId === sessionId) roles.delete(socketId);
  }
  session = null;
}

io.on("connection", socket => {
  socket.on("teacher:create-session", reply => {
    if (session) return reply({ ok: false, error: "Ya existe una sesión activa." });
    session = {
      id: crypto.randomUUID(),
      code: makeCode(),
      token: makeToken(),
      teacher: socket.id,
      students: new Map(),
      selectedStudent: null
    };
    roles.set(socket.id, { role: "teacher", sessionId: session.id });
    reply({ ok: true, code: session.code, token: session.token });
  });

  socket.on("student:join", ({ code, alias } = {}, reply) => {
    const normalizedCode = String(code || "").trim().toUpperCase();
    const normalizedAlias = String(alias || "").trim().slice(0, 32);
    if (!session || normalizedCode !== session.code) return reply({ ok: false, error: "Código incorrecto o sesión inactiva." });
    if (!normalizedAlias) return reply({ ok: false, error: "Escribe un alias." });
    if (session.students.size >= MAX_STUDENTS) return reply({ ok: false, error: "La sesión está llena (30 estudiantes)." });
    if ([...session.students.values()].some(p => p.alias.toLowerCase() === normalizedAlias.toLowerCase())) {
      return reply({ ok: false, error: "Ese alias ya está en uso." });
    }

    const student = { id: crypto.randomUUID(), alias: normalizedAlias, screenReady: false };
    session.students.set(socket.id, student);
    roles.set(socket.id, { role: "student", sessionId: session.id });
    reply({ ok: true, alias: normalizedAlias, studentId: student.id });
    updateParticipants();
  });

  socket.on("student:screen-ready", ({ ready } = {}, reply) => {
    const role = roles.get(socket.id);
    if (!session || !role || role.role !== "student" || role.sessionId !== session.id || !session.students.has(socket.id)) {
      if (reply) reply({ ok: false, error: "No perteneces a una sesión activa." });
      return;
    }
    session.students.get(socket.id).screenReady = Boolean(ready);
    if (!ready && session.selectedStudent === socket.id) {
      session.selectedStudent = null;
      io.to(session.teacher).emit("screen:stopped", { studentId: session.students.get(socket.id).id });
    }
    if (reply) reply({ ok: true });
    updateParticipants();
  });

  socket.on("teacher:select-student", ({ token, studentId } = {}, reply) => {
    if (!teacherSession(socket, token)) return reply({ ok: false, error: "Permiso denegado o sesión inactiva." });
    const target = studentForId(studentId);
    if (!target) return reply({ ok: false, error: "El estudiante ya no está en la sesión." });
    if (!target.student.screenReady) return reply({ ok: false, error: "El estudiante aún no ha autorizado la captura de pantalla." });
    if (session.selectedStudent && session.selectedStudent !== target.socketId) {
      io.to(session.selectedStudent).emit("screen:deselected");
    }
    session.selectedStudent = target.socketId;
    io.to(target.socketId).emit("screen:selected", { teacherSocketId: socket.id });
    updateParticipants();
    reply({ ok: true, alias: target.student.alias });
  });

  socket.on("teacher:stop-screen", ({ token } = {}, reply) => {
    if (!teacherSession(socket, token)) return reply({ ok: false, error: "Permiso denegado o sesión inactiva." });
    if (session.selectedStudent) io.to(session.selectedStudent).emit("screen:deselected");
    session.selectedStudent = null;
    updateParticipants();
    reply({ ok: true });
  });

  // Relay WebRTC signaling only between the teacher and the currently selected student.
  socket.on("rtc:offer", ({ token, studentId, offer } = {}, reply) => {
    if (!teacherSession(socket, token) || !session || session.selectedStudent !== studentForId(studentId)?.socketId) {
      if (reply) reply({ ok: false, error: "La transmisión no está autorizada." });
      return;
    }
    io.to(session.selectedStudent).emit("rtc:offer", { teacherSocketId: socket.id, offer });
    if (reply) reply({ ok: true });
  });

  socket.on("rtc:answer", ({ teacherSocketId, answer } = {}) => {
    const role = roles.get(socket.id);
    if (!session || !role || role.role !== "student" || role.sessionId !== session.id || session.selectedStudent !== socket.id || teacherSocketId !== session.teacher) return;
    io.to(session.teacher).emit("rtc:answer", { studentSocketId: socket.id, answer });
  });

  socket.on("rtc:ice", ({ targetRole, candidate } = {}) => {
    const role = roles.get(socket.id);
    if (!session || !role || role.sessionId !== session.id) return;
    if (role.role === "teacher" && socket.id === session.teacher && session.selectedStudent && targetRole === "student") {
      io.to(session.selectedStudent).emit("rtc:ice", { candidate });
    } else if (role.role === "student" && session.selectedStudent === socket.id && targetRole === "teacher") {
      io.to(session.teacher).emit("rtc:ice", { candidate });
    }
  });

  socket.on("teacher:end-session", ({ token } = {}, reply) => {
    if (!teacherSession(socket, token)) return reply({ ok: false, error: "Permiso denegado." });
    closeSession("El docente finalizó la sesión.");
    reply({ ok: true });
  });

  socket.on("disconnect", () => {
    const role = roles.get(socket.id);
    roles.delete(socket.id);
    if (!session || !role || role.sessionId !== session.id) return;
    if (role.role === "teacher") {
      closeSession("Se perdió la conexión del docente; la sesión se cerró.");
      return;
    }
    const removed = session.students.get(socket.id);
    session.students.delete(socket.id);
    if (session.selectedStudent === socket.id) {
      session.selectedStudent = null;
      io.to(session.teacher).emit("screen:stopped", { studentId: removed?.id });
    }
    updateParticipants();
  });
});

server.listen(PORT, HOST, () => console.log(`Servidor listo: http://localhost:${PORT}`));
