const test = require('node:test');
const assert = require('node:assert/strict');
const { SessionStore, MAX_NOTE_LENGTH } = require('../src/session-store');

test('crea una sesión con código temporal y no permite una segunda sesión', () => {
  const store = new SessionStore();
  const created = store.createSession('teacher-1');
  assert.equal(created.ok, true);
  assert.match(created.code, /^[1-9]{4}$/);
  assert.equal(store.createSession('teacher-2').ok, false);
});

test('rechaza código inválido, alias vacío y alias duplicado', () => {
  const store = new SessionStore();
  const session = store.createSession('teacher');
  assert.equal(store.joinStudent('student-1', 'INVALID', 'Ana').ok, false);
  assert.equal(store.joinStudent('student-1', session.code, '   ').ok, false);
  assert.equal(store.joinStudent('student-1', session.code, 'Ana').ok, true);
  assert.equal(store.joinStudent('student-2', session.code, 'ana').ok, false);
});

test('docente puede registrar nota opcional de un participante activo', () => {
  const store = new SessionStore();
  const session = store.createSession('teacher');
  store.joinStudent('student-1', session.code, 'Estudiante 01');
  const result = store.addObservation('teacher', session.token, 'student-1', 'Revisa el caso límite.');
  assert.equal(result.ok, true);
  assert.equal(result.observation.studentAlias, 'Estudiante 01');
  assert.equal(result.observation.visibility, 'individual');
  assert.equal(store.session.observations.length, 1);
});

test('protege observaciones por destinatario y rechaza rol o token incorrectos', () => {
  const store = new SessionStore();
  const session = store.createSession('teacher');
  store.joinStudent('student-1', session.code, 'Ana');
  store.joinStudent('student-2', session.code, 'Luis');
  assert.equal(store.addObservation('intruder', session.token, 'student-1', 'No').ok, false);
  assert.equal(store.addObservation('teacher', 'wrong-token', 'student-1', 'No').ok, false);
  store.addObservation('teacher', session.token, 'student-1', 'Nota de Ana');
  assert.equal(store.observationsForStudent('student-1').observations.length, 1);
  assert.equal(store.observationsForStudent('student-2').observations.length, 0);
  assert.equal(store.observationsForStudent('intruder').ok, false);
});

test('limita el texto de una observación a 1,000 caracteres', () => {
  const store = new SessionStore();
  const session = store.createSession('teacher');
  store.joinStudent('student-1', session.code, 'Ana');
  assert.equal(store.addObservation('teacher', session.token, 'student-1', 'x'.repeat(MAX_NOTE_LENGTH)).ok, true);
  assert.equal(store.addObservation('teacher', session.token, 'student-1', 'x'.repeat(MAX_NOTE_LENGTH + 1)).ok, false);
});

test('el cierre elimina la sesión, participantes y observaciones', () => {
  const store = new SessionStore();
  const session = store.createSession('teacher');
  store.joinStudent('student-1', session.code, 'Ana');
  store.addObservation('teacher', session.token, 'student-1', 'Nota temporal');
  assert.equal(store.endSession(), true);
  assert.equal(store.session, null);
  assert.equal(store.roles.size, 0);
  assert.equal(store.createSession('teacher-2').ok, true);
});

test('al desconectarse el estudiante se eliminan sus notas', () => {
  const store = new SessionStore();
  const session = store.createSession('teacher');
  store.joinStudent('student-1', session.code, 'Ana');
  store.addObservation('teacher', session.token, 'student-1', 'Nota temporal');
  const result = store.removeSocket('student-1');
  assert.equal(result.ended, false);
  assert.equal(store.session.observations.length, 0);
  assert.equal(store.roster().length, 0);
});

test('las solicitudes de presentación entran en cola sin iniciar una selección', () => {
  const store = new SessionStore();
  const session = store.createSession('teacher');
  store.joinStudent('student-a', session.code, 'Ana');
  store.joinStudent('student-b', session.code, 'Beto');
  const a = store.markScreenReady('student-a');
  const b = store.markScreenReady('student-b');
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  assert.equal(store.session.selectedStudent, null);
  assert.deepEqual(store.presentationQueueRoster().map(item => item.alias), ['Ana', 'Beto']);
});

test('el docente puede dar prioridad directa a un alumno y retirarlo de la cola', () => {
  const store = new SessionStore();
  const session = store.createSession('teacher');
  store.joinStudent('student-a', session.code, 'Ana');
  store.joinStudent('student-b', session.code, 'Beto');
  store.markScreenReady('student-a');
  store.markScreenReady('student-b');
  const selected = store.selectStudent('student-b');
  assert.equal(selected.ok, true);
  assert.equal(selected.ready, true);
  assert.equal(store.session.selectedStudent, 'student-b');
  assert.deepEqual(store.presentationQueueRoster().map(item => item.alias), ['Ana']);
});

test('la selección directa puede esperar autorización sin iniciar la transmisión', () => {
  const store = new SessionStore();
  const session = store.createSession('teacher');
  store.joinStudent('student-a', session.code, 'Ana');
  const selected = store.selectStudent('student-a');
  assert.equal(selected.ok, true);
  assert.equal(selected.ready, false);
  assert.equal(store.session.selectedStudent, 'student-a');
  const ready = store.markScreenReady('student-a');
  assert.equal(ready.selected, true);
  assert.equal(store.presentationQueueRoster().length, 0);
});

test('detener la captura quita al alumno de la cola o libera el turno activo', () => {
  const store = new SessionStore();
  const session = store.createSession('teacher');
  store.joinStudent('student-a', session.code, 'Ana');
  store.markScreenReady('student-a');
  assert.equal(store.presentationQueueRoster().length, 1);
  const stopped = store.stopStudentPresentation('student-a');
  assert.equal(stopped.wasSelected, false);
  assert.equal(store.presentationQueueRoster().length, 0);
  store.markScreenReady('student-a');
  store.selectStudent('student-a');
  const stoppedSelected = store.stopStudentPresentation('student-a');
  assert.equal(stoppedSelected.wasSelected, true);
  assert.equal(store.session.selectedStudent, null);
});
