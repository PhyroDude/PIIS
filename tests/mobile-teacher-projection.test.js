'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {SessionStore} = require('../src/session-store');
const client = fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8');

function prepare(){
  const store=new SessionStore();
  const claim=store.claimTeacher(null);
  assert.equal(claim.ok,true);
  assert.equal(store.attachTeacher('docente',claim.credential).ok,true);
  const session=store.createSession('docente');
  assert.equal(session.ok,true);
  return {store,session};
}

test('el servidor identifica los alumnos de teléfono en la lista docente',()=>{
  const {store,session}=prepare();
  assert.equal(store.joinStudent('telefono',session.code,'Ana',true).ok,true);
  assert.equal(store.joinStudent('escritorio',session.code,'Beto',false).ok,true);
  assert.deepEqual(store.roster().map(s=>[s.alias,s.isPhone]),[['Ana',true],['Beto',false]]);
});

test('el teléfono no puede pedir turno ni recibir autorización, aunque se invoque Socket.IO directamente',()=>{
  const {store,session}=prepare();
  store.joinStudent('telefono',session.code,'Ana',true);
  store.joinStudent('escritorio',session.code,'Beto');
  assert.match(store.requestStudent('telefono').error,/teléfonos/);
  assert.equal(store.presentationQueueRoster().length,0);
  assert.match(store.selectStudent('telefono').error,/teléfonos/);
  assert.equal(store.session.selectedStudent,null);
  assert.equal(store.requestStudent('escritorio').ok,true);
  assert.equal(store.selectStudent('escritorio').ok,true);
});

test('el alumno de teléfono conserva sus observaciones y la sesión',()=>{
  const {store,session}=prepare();
  store.joinStudent('telefono',session.code,'Ana',true);
  assert.equal(store.addObservation('docente',session.token,'telefono','Bien hecho').ok,true);
  assert.equal(store.observationsForStudent('telefono').observations.length,1);
});

function element(tag='div'){
  return {tag,children:[],disabled:false,textContent:'',className:'',title:'',
    append(...items){this.children.push(...items);},
    replaceChildren(...items){this.children=[...items];},
    focus(){this.focused=true;},
    value:''};
}

test('la vista docente nueva bloquea la proyección móvil pero permite notas personales',()=>{
  const elements=new Map();
  function node(tag='div'){
    return {tag,children:[],disabled:false,textContent:'',className:'',title:'',value:'',style:{},
      classList:{toggle(){},add(){},remove(){}},
      append(...items){this.children.push(...items);},
      replaceChildren(...items){this.children=[...items];},
      setAttribute(name,value){this[name]=value;},
      addEventListener(){},focus(){this.focused=true;}};
  }
  const get=id=>{if(!elements.has(id))elements.set(id,node());return elements.get(id);};
  const begin=client.indexOf('// Diseño docente 16:9:');
  const end=client.indexOf("$('copyCode').onclick",begin);
  assert.ok(begin>=0&&end>begin);
  let calls=0;
  const context={document:{createElement:node},$:get,hide(){},show(){},setMessage(){},
    socket:{on(){},emit(){calls++;}},teacherToken:'token',selectedStudentId:null,presentationQueue:[]};
  vm.createContext(context);
  vm.runInContext(client.slice(begin,end),context);
  vm.runInContext("renderParticipants([{id:'m',alias:'Móvil',isPhone:true},{id:'p',alias:'PC',isPhone:false}])",context);
  const [phone,desktop]=get('participants').children;
  const phoneActions=phone.children[4].children[0].children;
  const desktopActions=desktop.children[4].children[0].children;
  assert.equal(phoneActions[0].disabled,true,'el alumno móvil no puede proyectar');
  assert.equal(phoneActions[1].disabled,false,'el docente puede enviar nota al móvil');
  assert.equal(desktopActions[0].disabled,false,'la proyección de PC sigue disponible');
  phoneActions[1].onclick();
  assert.equal(get('selectedAlias').textContent,'Móvil');
  assert.equal(get('selectedProjectionRequest').disabled,true);
  assert.equal(get('selectedNoteButton').disabled,false);
  assert.equal(calls,0,'dar una nota no debe activar un evento de proyección');
});

test('el navegador estudiante informa al servidor si es un teléfono',()=>{
  assert.match(client,/socket\.emit\('student:join',\{code:\$\('code'\)\.value,alias:\$\('alias'\)\.value,isPhone:studentOnPhone\}/);
  const server=fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');
  assert.match(server,/store\.joinStudent\(socket\.id,payload\.code,payload\.alias,payload\.isPhone===true\|\|phoneUA\)/);
});
