'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {SessionStore,MAX_NOTE_LENGTH}=require('../src/session-store');
const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../public/styles.css'),'utf8');
function createSession(){
  const store=new SessionStore();const claim=store.claimTeacher(null,1000);
  assert.equal(store.attachTeacher('doc',claim.credential,1000).ok,true);
  const session=store.createSession('doc');
  assert.equal(session.ok,true);
  assert.equal(store.joinStudent('a',session.code,'Ana').ok,true);
  assert.equal(store.joinStudent('b',session.code,'Luis').ok,true);
  return {store,session};
}
test('el servidor permite 1000 caracteres y rechaza 1001, sin compartir la nota con otros alumnos',()=>{
  const {store,session}=createSession();
  assert.equal(MAX_NOTE_LENGTH,1000);
  const thousand='á'.repeat(1000);
  const thousandOne=thousand+'b';
  assert.equal(store.addObservation('doc',session.token,'a',thousand).ok,true);
  const tooMany=store.addObservation('doc',session.token,'a',thousandOne);
  assert.equal(tooMany.ok,false);
  assert.match(tooMany.error,/1000 caracteres/);
  assert.equal(store.addObservation('doc',session.token,'a','   ').ok,false);
  assert.equal(store.observationsForStudent('a').observations.length,1);
  assert.equal(store.observationsForStudent('b').observations.length,0);
  assert.equal(store.addObservation('otro',session.token,'a','Intento').ok,false);
});
test('el documento muestra un diálogo accesible con Cancelar, Enviar y contador de caracteres',()=>{
  assert.match(html,/<dialog id="teacherFeedback"[^>]*aria-labelledby="noteDialogTitle"/);
  for(const id of ['selectedAlias','observationForm','observationText','charCount','observationError','sendObservation','cancelTeacherFeedback','closeTeacherFeedback']){
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,`id único ${id}`);
  }
  assert.match(html,/id="cancelTeacherFeedback" type="button"[^>]*>Cancelar/);
  assert.match(html,/id="sendObservation" type="submit"[^>]*disabled>Enviar/);
  assert.match(html,/1000 caracteres/);
  assert.match(css,/\.note-dialog::backdrop/);
  assert.match(js,/noteDialog\.showModal\(\)/);
  assert.match(js,/socket\.emit\('teacher:add-observation'/);
  assert.equal((js.match(/\$\('observationForm'\)\.onsubmit=/g)||[]).length,1);
});
test('el modal abre, permite cancelar sin enviar y bloquea más de 1000 caracteres',()=>{
  const ids=new Map();let sendCount=0;let lastPayload=null;
  const get=id=>{
    if(!ids.has(id))ids.set(id,{
      textContent:'',value:'',disabled:false,open:false,handlers:{},
      classList:{toggle(){}},
      showModal(){this.open=true;},
      close(){this.open=false;this.handlers.close?.();},
      addEventListener(type,handler){this.handlers[type]=handler;},
      focus(){this.focused=true;}
    });
    return ids.get(id);
  };
  const begin=js.indexOf('const MAX_NOTE_LENGTH=1000;');
  const end=js.indexOf("$('copyCode').onclick",begin);
  assert.ok(begin>=0&&end>begin);
  const context={
    $:get,
    document:{activeElement:{isConnected:false}},
    pickStudent(person){context.selectedStudentId=person.id;get('selectedAlias').textContent=person.alias;},
    setMessage(){},teacherToken:'secret',
    socket:{emit(name,payload,callback){sendCount++;lastPayload=payload;callback({ok:true});}}
  };
  vm.createContext(context);
  vm.runInContext(js.slice(begin,end),context);
  vm.runInContext("chooseStudentForFeedback({id:'a',alias:'Ana'})",context);
  assert.equal(get('teacherFeedback').open,true);
  assert.equal(get('selectedAlias').textContent,'Ana');
  assert.equal(get('sendObservation').disabled,true);
  get('observationText').value='a'.repeat(1001);
  get('observationText').handlers.input();
  assert.equal(get('charCount').textContent,'1001 / 1000 caracteres');
  assert.equal(get('sendObservation').disabled,true);
  let prevented=false;
  get('observationForm').onsubmit({preventDefault(){prevented=true;}});
  assert.equal(prevented,true);
  assert.equal(sendCount,0);
  get('cancelTeacherFeedback').onclick();
  assert.equal(get('teacherFeedback').open,false);
  assert.equal(get('observationText').value,'');
  assert.equal(sendCount,0);
  vm.runInContext("chooseStudentForFeedback({id:'b',alias:'Luis'})",context);
  get('observationText').value='á'.repeat(1000);
  get('observationText').handlers.input();
  assert.equal(get('sendObservation').disabled,false);
  get('observationForm').onsubmit({preventDefault(){}});
  assert.equal(sendCount,1);
  assert.equal(lastPayload.studentId,'b');
  assert.equal(get('teacherFeedback').open,false);
});
