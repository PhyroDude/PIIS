'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const js=fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../public/styles.css'),'utf8');
const server=fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');
const start=js.indexOf('// El botón refleja el estado de la captura LOCAL del docente.');
const end=js.indexOf('// Diseño docente 16:9:',start);
assert.ok(start>=0&&end>start);
const impl=js.slice(start,end);
function harness(){
  const elements=new Map();
  function createEl(id){
    const attrs={};const classes=new Set();
    const el={id,attrs,classes,disabled:false,textContent:'',
      setAttribute(k,v){attrs[k]=v;},
      classList:{toggle(k,v){if(v)classes.add(k);else classes.delete(k);}},
      querySelector(selector){return el[selector]||(el[selector]={textContent:''});}}
    return el;
  }
  for(const id of ['teacherShareEntry','teacherShareActive'])elements.set(id,createEl(id));
  const sent=[],messages=[],stopped=[];
  const video={readyState:'live',stop(){this.readyState='ended';stopped.push('video');},addEventListener(name,handler){this[name]=handler;}};
  const stream={getVideoTracks(){return [video];},getTracks(){return [video];}};
  const ctx={
    $:id=>elements.get(id),setMessage:(...args)=>messages.push(args),
    teacherStream:null,teacherToken:'teacher-token',teacherAttached:true,activeRole:'teacher',
    socket:{connected:true,emit:(...args)=>sent.push(args)},closePeer(){ctx.peerCloses=(ctx.peerCloses||0)+1;},
    navigator:{mediaDevices:{getDisplayMedia:async()=>stream}}
  };
  vm.createContext(ctx);vm.runInContext(impl,ctx);
  return {ctx,sent,messages,stopped,video,stream,elements};
}

test('los dos botones reflejan si la captura docente esta activa',async()=>{
  const h=harness(),button=h.elements.get('teacherShareActive');
  assert.equal(button['strong'].textContent,'Compartir mi pantalla');
  assert.equal(button.attrs['aria-pressed'],'false');
  await h.ctx.captureTeacher();
  assert.equal(button['strong'].textContent,'Dejar de compartir mi pantalla');
  assert.equal(button.attrs['aria-pressed'],'true');
  assert.equal(h.elements.get('teacherShareEntry').textContent,'Dejar de compartir mi pantalla');
  assert.equal(button.classes.has('is-sharing'),true);
  await h.ctx.captureTeacher();
  assert.equal(button['strong'].textContent,'Compartir mi pantalla');
  assert.equal(button.attrs['aria-pressed'],'false');
  assert.equal(button.classes.has('is-sharing'),false);
  assert.deepEqual(h.stopped,['video']);
  assert.ok(h.sent.some(e=>e[0]==='teacher:screen-ended'));
});

test('al parar antes de crear sesion no se emite un token inexistente',async()=>{
  const h=harness();h.ctx.teacherToken=null;
  await h.ctx.captureTeacher();await h.ctx.captureTeacher();
  assert.equal(h.sent.filter(e=>e[0]==='teacher:screen-ended').length,0);
});

test('si el docente detiene compartir desde el permiso del navegador, el estado se actualiza',async()=>{
  const h=harness();await h.ctx.captureTeacher();
  h.video.readyState='ended';h.video.ended();
  assert.equal(h.elements.get('teacherShareActive')['strong'].textContent,'Compartir mi pantalla');
  assert.equal(h.sent.filter(e=>e[0]==='teacher:screen-ended').length,1);
});

test('el servidor no cambia el epoch si el docente deja de compartir mientras presenta el alumno',()=>{
  assert.match(server,/const wasTeacherSource=store\.activeSource\(\)\.kind==='teacher';/);
  assert.match(server,/store\.session\.teacherCaptureReady=false;\s*if\(wasTeacherSource\)store\.session\.epoch\+\+;/);
  assert.match(css,/\.action-share\.is-sharing/);
  assert.match(html,/id="teacherShareActive"[^>]*aria-pressed="false"/);
});
