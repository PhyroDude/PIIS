"use strict";
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const html=read('public/index.html');
const app=read('public/app.js');
const css=read('public/styles.css');
const server=read('server.js');
function extract(from,to){const a=app.indexOf(from),b=app.indexOf(to,a);assert.ok(a>=0&&b>a);return app.slice(a,b);}
function nodes(){const table=new Map();return id=>{
  if(!table.has(id)){
    const classes=new Set(),attrs={};
    table.set(id,{textContent:'',disabled:false,dataset:{},attrs,classes,
      classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name);}},
      setAttribute(name,value){attrs[name]=value;}});
  }
  return table.get(id);
};}
test('las vistas alumno usan los componentes e IDs existentes sin duplicación',()=>{
  for(const id of ['studentView','joinedAlias','studentClock','startShare','withdrawShare','stopShare',
    'projectionNotice','studentAlertDetails','projectionNoticeAction','projectionNoticeReject',
    'studentNotes','refreshNotes','studentFiles','studentFileTabs','studentFileList','studentZip',
    'studentUpload','studentUploadButton','studentFileStatus']) {
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);
  }
  assert.match(html,/Archivos de la clase/);
  assert.match(html,/Observaciones del profesor/);
  assert.match(html,/¡BIENVENIDO/);
});
test('botón único refleja solicitud, cancelación, permiso y proyección efectiva',()=>{
  const $=nodes();
  const code=extract('function setStudentProjectionState(state){','function setStudentRequestMode(mode){');
  const env={$,studentOnPhone:false,studentProjectionState:'idle'};
  vm.createContext(env);
  vm.runInContext(code+'\nsetStudentProjectionState("idle")',env);
  assert.equal($('studentProjectionLabel').textContent,'Solicitar permiso para proyectar');
  vm.runInContext('setStudentProjectionState("pending")',env);
  assert.equal($('studentProjectionLabel').textContent,'Cancelar solicitud');
  assert.equal($('withdrawShare').disabled,false);
  vm.runInContext('setStudentProjectionState("granted")',env);
  assert.equal($('studentProjectionLabel').textContent,'Iniciar proyección');
  vm.runInContext('setStudentProjectionState("starting")',env);
  assert.equal($('startShare').disabled,false); // permite detener una captura mientras negocia WebRTC
  vm.runInContext('setStudentProjectionState("active")',env);
  assert.equal($('studentProjectionLabel').textContent,'Proyectando');
  assert.equal($('stopShare').disabled,false);
  assert.equal($('startShare').attrs['aria-pressed'],'true');
});
test('la alerta es inactiva al inicio, se expande en petición directa y se repliega al responder',()=>{
  const $=nodes();
  const env={$,studentRequestMode:'idle'};
  vm.createContext(env);
  vm.runInContext(extract('function setStudentRequestMode(mode){','function startStudentClock(){')+'\nsetStudentRequestMode("idle")',env);
  assert.equal($('projectionNotice').classes.has('is-open'),false);
  assert.equal($('projectionNoticeAction').disabled,true);
  vm.runInContext('setStudentRequestMode("direct")',env);
  assert.equal($('projectionNotice').classes.has('is-open'),true);
  assert.equal($('projectionNotice').dataset.mode,'direct');
  assert.equal($('projectionNoticeAction').disabled,false);
  vm.runInContext('setStudentRequestMode("idle")',env);
  assert.equal($('projectionNotice').classes.has('is-open'),false);
});
test('cola aprobada y solicitud directa se distinguen; solo la directa produce alarma roja',()=>{
  assert.match(server,/const fromQueue=store\.session\.presentationQueue\.includes\(studentId\)/);
  assert.match(server,/emit\('screen:requested',\{fromQueue,/);
  assert.match(app,/if\(fromQueue\)\{[\s\S]*setStudentProjectionState\('granted'\)/);
  assert.match(app,/setStudentRequestMode\('direct'\)/);
  assert.match(app,/if\(peer\.connectionState==='connected'\)\{\s*setStudentProjectionState\('active'\)/);
  assert.match(css,/@keyframes studentAlertBreath/);
  assert.match(css,/prefers-reduced-motion:reduce/);
});
test('los teléfonos muestran archivos y observaciones, nunca controles de proyección',()=>{
  assert.match(app,/classList\.toggle\('student-is-phone',studentOnPhone\)/);
  assert.match(css,/body\.student-is-phone \.student-activity-grid\{display:none\}/);
  assert.match(css,/body\.student-is-phone \.student-content-grid\{grid-template-columns:1fr\}/);
  assert.match(css,/@media\(max-width:720px\)/);
});
