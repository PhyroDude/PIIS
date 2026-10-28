'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {SessionStore,MAX_NOTE_LENGTH,TEACHER_RECONNECT_MS}=require('../src/session-store');
function setup(){
  const store=new SessionStore();const claimed=store.claimTeacher(null,1000);
  assert.equal(claimed.ok,true);
  assert.equal(store.attachTeacher('teacher',claimed.credential,1000).ok,true);
  const session=store.createSession('teacher');assert.equal(session.ok,true);
  return {store,session,credential:claimed.credential};
}
test('un primer acceso adquiere credencial privada; un segundo navegador no la suplanta',()=>{
  const s=new SessionStore(),first=s.claimTeacher(null);
  assert.match(first.credential,/^[0-9a-f]{64}$/);
  assert.equal(s.claimTeacher(null).ok,false);
  assert.equal(s.claimTeacher(first.credential).ok,true);
  assert.equal(s.attachTeacher('a','invalida').ok,false);
  assert.equal(s.attachTeacher('a',first.credential).ok,true);
});
test('sesión solo puede ser creada por docente autorizado; código visible separado de credencial',()=>{
  const s=new SessionStore();assert.equal(s.createSession('fake').ok,false);
  const {store,session,credential}=setup();
  assert.match(session.code,/^[1-9]{4}$/);
  assert.notEqual(session.token,credential);
  assert.equal(store.createSession('teacher').ok,false);
});
test('al desconectar al docente, sesión y archivos lógicos permanecen y se esperan 90s',()=>{
  const {store,session,credential}=setup();
  store.joinStudent('a',session.code,'Ana');store.requestStudent('a');
  assert.equal(store.disconnectTeacher('teacher',5000),true);
  assert.equal(store.session.code,session.code);
  assert.equal(store.presentationQueueRoster().length,1);
  assert.equal(store.teacherStatus(5001).state,'waiting');
  assert.equal(store.teacherStatus(5001).expiresAt,5000+TEACHER_RECONNECT_MS);
  assert.equal(store.expireTeacher(5000+TEACHER_RECONNECT_MS-1),false);
  assert.equal(store.attachTeacher('teacher-return',credential,5100).ok,true);
  assert.equal(store.teacherStatus().state,'connected');
  assert.equal(store.authorizeTeacher('teacher-return',session.token),true);
});
test('al cumplirse 90s se libera solamente el control, sin borrar la sesión ni la cola',()=>{
  const {store,session,credential}=setup();
  store.joinStudent('a',session.code,'Ana');store.requestStudent('a');
  store.disconnectTeacher('teacher',10_000);
  assert.equal(store.expireTeacher(100_000),true);
  assert.equal(store.session.code,session.code);
  assert.equal(store.presentationQueueRoster().length,1);
  assert.equal(store.attachTeacher('old',credential).ok,false);
  const fresh=store.claimTeacher(null,100_001);
  assert.equal(fresh.ok,true);
  const attached=store.attachTeacher('replacement',fresh.credential,100_002);
  assert.equal(attached.session.code,session.code);
});
test('solicitudes se registran sin capturar ni iniciar WebRTC',()=>{
  const {store,session}=setup();
  store.joinStudent('a',session.code,'Ana');store.joinStudent('b',session.code,'Beto');
  assert.equal(store.requestStudent('a').ok,true);
  assert.equal(store.requestStudent('b').ok,true);
  assert.deepEqual(store.presentationQueueRoster().map(x=>x.alias),['Ana','Beto']);
  assert.equal(store.activeSource().kind,'waiting');
  assert.equal(store.markScreenReady('a').ok,false);
});
test('solo selección docente más autorización del alumno activan transmisión; el turno vuelve al docente',()=>{
  const {store,session}=setup();
  store.joinStudent('a',session.code,'Ana');store.joinStudent('b',session.code,'Beto');
  store.markTeacherReady('teacher');
  assert.equal(store.activeSource().kind,'teacher');
  store.requestStudent('a');store.requestStudent('b');
  const selected=store.selectStudent('b');assert.equal(selected.ok,true);
  assert.equal(store.activeSource().kind,'teacher'); // esperando aceptación del alumno
  assert.equal(store.markScreenReady('b').ok,true);
  assert.deepEqual(store.activeSource().kind,'student');
  assert.deepEqual(store.presentationQueueRoster().map(x=>x.alias),['Ana']);
  const stopped=store.stopStudentPresentation('b');assert.equal(stopped.wasSelected,true);
  assert.equal(store.activeSource().kind,'teacher');
});
test('el alumno continúa proyectando aunque la credencial del docente expire',()=>{
  const {store,session}=setup();store.joinStudent('a',session.code,'Ana');
  store.markTeacherReady('teacher');store.selectStudent('a');store.markScreenReady('a');
  store.disconnectTeacher('teacher',200);store.expireTeacher(90_200);
  assert.equal(store.activeSource().kind,'student');
  assert.equal(store.requestStudent('a').selected,true);
  assert.equal(store.stopStudentPresentation('a').wasSelected,true);
  assert.equal(store.activeSource().kind,'waiting');
});
test('desconexión del alumno seleccionado termina turno; desconexión pendiente quita de la cola',()=>{
  const {store,session}=setup();store.joinStudent('a',session.code,'Ana');store.joinStudent('b',session.code,'Beto');
  store.requestStudent('a');store.requestStudent('b');
  store.selectStudent('a');store.markScreenReady('a');
  assert.equal(store.removeSocket('b').wasSelected,false);
  assert.equal(store.presentationQueueRoster().length,0);
  assert.equal(store.removeSocket('a').wasSelected,true);
  assert.equal(store.activeSource().kind,'waiting');
});
test('observaciones privadas y tamaño limitado',()=>{
  const {store,session}=setup();store.joinStudent('a',session.code,'Ana');store.joinStudent('b',session.code,'Luis');
  assert.equal(store.addObservation('hacker',session.token,'a','mal').ok,false);
  assert.equal(store.addObservation('teacher',session.token,'a','x'.repeat(MAX_NOTE_LENGTH+1)).ok,false);
  assert.equal(store.addObservation('teacher',session.token,'a','Bien').ok,true);
  assert.equal(store.observationsForStudent('a').observations.length,1);
  assert.equal(store.observationsForStudent('b').observations.length,0);
});
test('finalizar sesión elimina participantes, permisos y credencial',()=>{
  const {store,session}=setup();store.joinStudent('a',session.code,'Ana');
  assert.equal(store.endSession(),true);assert.equal(store.session,null);
  assert.equal(store.roles.size,0);
  assert.equal(store.teacherLease,null);
});
test('rotación invalida el token administrativo viejo al expirar o liberar el control',()=>{
  const {store,session}=setup();const old=session.token;
  store.disconnectTeacher('teacher',1000);assert.equal(store.fileActor(old),null);
  store.expireTeacher(91_000);assert.notEqual(store.session.token,old);
  const replacement=store.claimTeacher(null,91_001);
  store.attachTeacher('new',replacement.credential,91_002);
  assert.equal(store.fileActor(old),null);
  assert.equal(store.fileActor(store.session.token).role,'teacher');
  const beforeRelease=store.session.token;
  store.releaseTeacher();assert.notEqual(store.session.token,beforeRelease);
});
test('si la selección no fue aceptada, la expiración la devuelve a la cola sin iniciar video',()=>{
  const {store,session}=setup();store.joinStudent('a',session.code,'Ana');
  store.selectStudent('a');assert.equal(store.session.selectedStudent,'a');
  store.disconnectTeacher('teacher',500);
  assert.equal(store.markScreenReady('a').ok,false);
  store.expireTeacher(90_500);
  assert.equal(store.session.selectedStudent,null);
  assert.deepEqual(store.presentationQueueRoster().map(s=>s.alias),['Ana']);
});

test('docente rechaza solicitud de cola sin autorizar transmisión',()=>{
  const {store,session}=setup();store.joinStudent('a',session.code,'Ana');store.requestStudent('a');
  assert.equal(store.rejectStudentRequest('a').ok,true);
  assert.equal(store.presentationQueueRoster().length,0);
  assert.equal(store.activeSource().kind,'waiting');
});
