'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {SessionStore}=require('../src/session-store');

function teacherStore(){
  const store=new SessionStore();
  const owner=store.claimTeacher(null).credential;
  assert.equal(store.attachTeacher('docente',owner).ok,true);
  const session=store.createSession('docente');
  assert.equal(session.ok,true);
  return {store,session};
}

test('volver a autorizar pantalla docente fuerza nueva negociación WebRTC',()=>{
  const {store}=teacherStore();
  assert.equal(store.activeSource().kind,'waiting');
  const first=store.markTeacherReady('docente');
  assert.equal(first.ok,true);
  assert.equal(store.activeSource().kind,'teacher');
  const firstEpoch=store.activeSource().epoch;
  const again=store.markTeacherReady('docente');
  assert.equal(again.ok,true);
  assert.ok(store.activeSource().epoch>firstEpoch,'debe emitir un nuevo epoch para crear oferta nueva');
});

test('renovar la captura docente no interrumpe una presentación estudiantil autorizada',()=>{
  const {store,session}=teacherStore();
  store.markTeacherReady('docente');
  store.joinStudent('alumno',session.code,'Ana');
  store.selectStudent('alumno');store.markScreenReady('alumno');
  const during=store.activeSource();
  assert.equal(during.kind,'student');
  store.markTeacherReady('docente');
  assert.deepEqual(store.activeSource(),during,'la fuente y el epoch del alumno deben conservarse');
  store.stopStudentPresentation('alumno');
  assert.equal(store.activeSource().kind,'teacher');
  assert.ok(store.activeSource().epoch>during.epoch);
});

function mockCapture({createSession=true}={}){
  const el=new Map();
  const handlers=new Map();
  const calls=[];
  const classList=()=>({add(){},remove(){},toggle(){}});
  function element(id){
    if(!el.has(id))el.set(id,{id,textContent:'',value:'',disabled:false,classList:classList(),addEventListener(){},replaceChildren(){},append(){},focus(){}});
    return el.get(id);
  }
  const socket={connected:true,on:(name,callback)=>handlers.set(name,callback),emit:(name,payload,callback)=>{
    calls.push(name);
    if(name==='teacher:attach') callback?.({ok:true,session:null});
    else if(name==='teacher:create-session') payload?.({ok:true,code:'1234',token:'secreto'});
    else if(name==='teacher:screen-ready') callback?.({ok:true});
  }};
  let capture;
  const context={
    io:()=>socket,location:{pathname:'/docente'},
    document:{getElementById:element,body:{classList:classList()},createElement:()=>({className:'',textContent:'',append(){},click(){}})},
    navigator:{mediaDevices:{getDisplayMedia:()=>capture()}},
    window:{APP_CONFIG:{}},console,confirm:()=>true,setTimeout,clearTimeout,Date,Blob,URL,MediaStream:class{},RTCPeerConnection:class{},
    initializeFileModule:()=>{},clearFileModule:()=>{},fileToken:null
  };
  const source=fs.readFileSync(path.join(__dirname,'..','public','app.js'),'utf8');
  vm.runInNewContext(source,context,{filename:'app.js'});
  handlers.get('connect')();
  if(createSession)element('teacherForm').onsubmit({preventDefault(){}});
  return {el:element,calls,setCapture(fn){capture=fn;}};
}

function stream(){
  const video={stopped:false,stop(){this.stopped=true;},addEventListener(){}};
  return {video,getTracks:()=>[video],getVideoTracks:()=>[video]};
}

test('el error de captura en una sesión activa es visible en el panel docente',async()=>{
  const ui=mockCapture();
  ui.setCapture(async()=>{throw Object.assign(new Error('cancelada'),{name:'NotAllowedError'});});
  await ui.el('teacherShareActive').onclick();
  assert.match(ui.el('teacherScreenStatus').textContent,/No se autorizó la captura/);
  assert.equal(ui.el('teacherShareActive').disabled,false);
});

test('cancelar una nueva selección no apaga la captura docente que ya funcionaba',async()=>{
  const ui=mockCapture();const first=stream();
  ui.setCapture(async()=>first);
  await ui.el('teacherShareActive').onclick();
  assert.ok(ui.calls.includes('teacher:screen-ready'));
  ui.setCapture(async()=>{throw Object.assign(new Error('cancelada'),{name:'NotAllowedError'});});
  await ui.el('teacherShareActive').onclick();
  assert.equal(first.video.stopped,false,'la primera captura debe mantenerse mientras el docente cancela la nueva');
});

test('la pantalla docente se puede compartir antes de crear una sesión',()=>{
  const store=new SessionStore();
  const cookie=store.claimTeacher(null).credential;
  assert.equal(store.attachTeacher('docente',cookie).ok,true);
  assert.equal(store.activeSource().kind,'waiting');
  const ready=store.markTeacherReady('docente');
  assert.equal(ready.ok,true);
  const before=store.activeSource();
  assert.equal(before.kind,'teacher');
  assert.equal(before.id,'docente');
  const created=store.createSession('docente');
  assert.equal(created.ok,true);
  assert.deepEqual(store.activeSource(),before,'crear la clase no debe interrumpir la pantalla ya proyectada');
});

test('el docente sin sesión no puede transmitir si no obtuvo el control',()=>{
  const store=new SessionStore();
  assert.equal(store.markTeacherReady('intruso').ok,false);
  const cookie=store.claimTeacher(null).credential;
  store.attachTeacher('docente',cookie);
  assert.equal(store.markTeacherReady('intruso').ok,false);
  assert.equal(store.activeSource().kind,'waiting');
});

test('la interfaz docente activa la proyección antes de crear el código de clase',async()=>{
  const ui=mockCapture({createSession:false});
  ui.setCapture(async()=>stream());
  assert.equal(ui.calls.includes('teacher:create-session'),false);
  await ui.el('teacherShareEntry').onclick();
  assert.equal(ui.calls.filter(name=>name==='teacher:screen-ready').length,1);
  assert.equal(ui.calls.includes('teacher:create-session'),false);
  ui.el('teacherForm').onsubmit({preventDefault(){}});
  assert.equal(ui.calls.filter(name=>name==='teacher:screen-ready').length,1,'crear sesión no debe renegociar una captura existente');
});
