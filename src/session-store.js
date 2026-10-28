const crypto = require('node:crypto');

const ALPHABET = '123456789';
const MAX_STUDENTS = 30;
const MAX_NOTE_LENGTH = 1000;

function makeCode() {
  return Array.from({ length: 4 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join('');
}
function makeToken() { return crypto.randomBytes(24).toString('hex'); }

class SessionStore {
  constructor() {
    this.session = null;
    this.roles = new Map();
  }

  createSession(teacherSocketId) {
    if (this.session) return { ok: false, error: 'Ya existe una sesión activa.' };
    this.session = {
      id: crypto.randomUUID(), code: makeCode(), teacher: teacherSocketId,
      token: makeToken(), students: new Map(), observations: [], selectedStudent: null, presentationQueue: [], screenReady: new Set()
    };
    this.roles.set(teacherSocketId, { role: 'teacher', sid: this.session.id });
    return { ok: true, code: this.session.code, token: this.session.token };
  }

  joinStudent(socketId, code, alias) {
    const normalizedCode = String(code || '').trim().toUpperCase();
    const normalizedAlias = String(alias || '').trim().slice(0, 32);
    if (!this.session || normalizedCode !== this.session.code) return { ok: false, error: 'Código incorrecto o sesión inactiva.' };
    if (!normalizedAlias) return { ok: false, error: 'Escribe un alias.' };
    if (this.session.students.size >= MAX_STUDENTS) return { ok: false, error: 'La sesión está llena (30 estudiantes).' };
    if ([...this.session.students.values()].some(p => p.alias.toLowerCase() === normalizedAlias.toLowerCase())) return { ok: false, error: 'Ese alias ya está en uso.' };
    const student = { id: socketId, alias: normalizedAlias };
    this.session.students.set(socketId, student);
    this.roles.set(socketId, { role: 'student', sid: this.session.id });
    return { ok: true, alias: normalizedAlias, studentId: socketId };
  }

  roster() {
    if (!this.session) return [];
    return [...this.session.students.values()].map(({ id, alias }) => ({ id, alias }));
  }

  markScreenReady(socketId) {
    if (!this.isStudentInSession(socketId)) return { ok: false, error: 'Permiso denegado.' };
    const session = this.session;
    session.screenReady.add(socketId);
    if (session.selectedStudent === socketId) {
      return { ok: true, selected: true, queue: this.presentationQueueRoster() };
    }
    if (!session.presentationQueue.includes(socketId)) session.presentationQueue.push(socketId);
    return { ok: true, selected: false, queue: this.presentationQueueRoster() };
  }

  presentationQueueRoster() {
    if (!this.session) return [];
    return this.session.presentationQueue
      .filter(id => this.session.students.has(id) && this.session.screenReady.has(id))
      .map((id, index) => ({ id, alias: this.session.students.get(id).alias, position: index + 1 }));
  }

  selectStudent(studentId) {
    if (!this.session?.students.has(studentId)) return { ok: false, error: 'El estudiante ya no está en la sesión.' };
    const session = this.session;
    const previousStudent = session.selectedStudent;
    session.presentationQueue = session.presentationQueue.filter(id => id !== studentId);
    session.selectedStudent = studentId;
    return {
      ok: true,
      previousStudent,
      student: { ...session.students.get(studentId) },
      ready: session.screenReady.has(studentId),
      queue: this.presentationQueueRoster()
    };
  }

  stopStudentPresentation(socketId) {
    if (!this.session) return { ok: false };
    const session = this.session;
    session.screenReady.delete(socketId);
    session.presentationQueue = session.presentationQueue.filter(id => id !== socketId);
    const wasSelected = session.selectedStudent === socketId;
    if (wasSelected) session.selectedStudent = null;
    return { ok: true, wasSelected, queue: this.presentationQueueRoster() };
  }

  authorizeTeacher(socketId, token) {
    const role = this.roles.get(socketId);
    return Boolean(this.session && role?.role === 'teacher' && role.sid === this.session.id && socketId === this.session.teacher && token === this.session.token);
  }

  getRole(socketId) { return this.roles.get(socketId) || null; }
  isStudentInSession(socketId) { return Boolean(this.session?.students.has(socketId) && this.roles.get(socketId)?.sid === this.session.id); }

  addObservation(teacherSocketId, token, studentId, text) {
    if (!this.authorizeTeacher(teacherSocketId, token)) return { ok: false, error: 'Permiso denegado.' };
    if (!this.session.students.has(studentId)) return { ok: false, error: 'El estudiante ya no pertenece a la sesión.' };
    const content = String(text || '').trim();
    if (!content) return { ok: false, error: 'Escribe una observación o deja la retroalimentación solo en forma oral.' };
    if (content.length > MAX_NOTE_LENGTH) return { ok: false, error: `La observación no puede superar ${MAX_NOTE_LENGTH} caracteres.` };
    const observation = {
      id: crypto.randomUUID(), studentId, studentAlias: this.session.students.get(studentId).alias,
      text: content, createdAt: new Date().toISOString(), visibility: 'individual'
    };
    this.session.observations.push(observation);
    return { ok: true, observation };
  }

  observationsForStudent(socketId) {
    if (!this.isStudentInSession(socketId)) return { ok: false, error: 'Permiso denegado.' };
    return { ok: true, observations: this.session.observations.filter(o => o.studentId === socketId).map(o => ({ ...o })) };
  }

  removeSocket(socketId) {
    const role = this.roles.get(socketId);
    this.roles.delete(socketId);
    if (!this.session || !role || role.sid !== this.session.id) return { changed: false };
    if (role.role === 'teacher') {
      return { changed: true, ended: true };
    }
    this.session.students.delete(socketId);
    this.session.presentationQueue = this.session.presentationQueue.filter(id => id !== socketId);
    this.session.screenReady.delete(socketId);
    this.session.observations = this.session.observations.filter(o => o.studentId !== socketId);
    if (this.session.selectedStudent === socketId) this.session.selectedStudent = null;
    return { changed: true, ended: false };
  }

  endSession() {
    if (!this.session) return false;
    const sid = this.session.id;
    for (const [socketId, role] of this.roles) if (role.sid === sid) this.roles.delete(socketId);
    this.session = null;
    return true;
  }
}

module.exports = { SessionStore, MAX_STUDENTS, MAX_NOTE_LENGTH };
