'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {SessionStore}=require('../src/session-store');
const base=path.resolve(__dirname,'..');
const server=fs.readFileSync(path.join(base,'server.js'),'utf8');
const app=fs.readFileSync(path.join(base,'public/app.js'),'utf8');
const html=fs.readFileSync(path.join(base,'public/index.html'),'utf8');

test('la conexión docente autorizada inicia o recupera una sesión sin formulario manual',()=>{
  assert.match(server,/socket\.on\('teacher:attach'[\s\S]*?const session=ensureTeacherSession\(\)/);
  assert.match(server,/if\(store\.session\)return \{ok:true,code:store\.session\.code,token:store\.session\.token,existing:true\}/);
  assert.match(server,/if\(created\.ok\)fileStore\.startSession\(store\.session\.id\)/);
  assert.match(app,/if\(result\.session\)teacherSessionReady\(result\.session\)/);
  assert.doesNotMatch(html,/id="teacherForm"/);
  assert.doesNotMatch(app,/teacher:create-session/);
  assert.match(html,/id="teacherShareActive"/);
  assert.match(html,/id="reenterTeacher"/);
});

test('la sesión conserva código, alumnos y token después de recargar/reconectar docente',()=>{
  const store=new SessionStore();
  const claim=store.claimTeacher(null,1000);assert.equal(claim.ok,true);
  assert.equal(store.attachTeacher('docente1',claim.credential,1000).ok,true);
  const first=store.createSession('docente1');assert.equal(first.ok,true);
  const id=store.session.id;
  store.joinStudent('alumno1',first.code,'Ana');
  assert.equal(store.disconnectTeacher('docente1',2000),true);
  const recovered=store.attachTeacher('docente2',claim.credential,2001);
  assert.equal(recovered.ok,true);
  assert.equal(store.session.id,id);
  assert.equal(recovered.session.code,first.code);
  assert.equal(recovered.session.token,first.token);
  assert.equal(recovered.session.participants.length,1);
  assert.equal(store.createSession('docente2').ok,false,'el almacén evita duplicar sesiones');
});

test('tras vencimiento docente, el siguiente propietario recupera la sesión existente; tras cierre, se crea otra',()=>{
  const store=new SessionStore();const claimed=store.claimTeacher(null,1000);
  store.attachTeacher('primero',claimed.credential,1000);
  const first=store.createSession('primero');
  store.disconnectTeacher('primero',2000);
  assert.equal(store.expireTeacher(92_000),true);
  const next=store.claimTeacher(null,92_001);
  const recovered=store.attachTeacher('segundo',next.credential,92_002);
  assert.equal(recovered.session.code,first.code);
  assert.notEqual(recovered.session.token,first.token);
  assert.equal(store.endSession(),true);
  const third=store.claimTeacher(null,93_000);
  store.attachTeacher('tercero',third.credential,93_000);
  const replacement=store.createSession('tercero');
  assert.equal(replacement.ok,true);
  assert.notEqual(store.session.id,null);
  assert.notEqual(replacement.token,first.token);
});
