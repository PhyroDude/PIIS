'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('public/index.html');
const app=read('public/app.js');
const css=read('public/styles.css');
function elements(){const found=new Map();return id=>{if(!found.has(id)){
 const classes=new Set(),attributes={};
 found.set(id,{textContent:'',disabled:false,classes,attrs:attributes,
  classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name);}},
  setAttribute(name,value){attributes[name]=value;},
  getAttribute(name){return attributes[name]??(name==='src'&&id==='studentProjectionIcon'?'/assets/megafono-marron.png':null);}});
 }return found.get(id);};}
function runner(){const from=app.indexOf('function setStudentProjectionState(state){');const to=app.indexOf('function setStudentRequestMode(mode){',from);assert.ok(from>=0&&to>from);
 const $=elements(),ctx={$,studentProjectionState:'idle',studentOnPhone:false};vm.createContext(ctx);vm.runInContext(app.slice(from,to),ctx);
 return {ctx,$,go:state=>vm.runInContext(`setStudentProjectionState('${state}')`,ctx)};
}
test('el botón utiliza los PNG previstos, sin icono de palomita',()=>{
 assert.match(html,/id="studentProjectionIcon"[^>]+src="\/assets\/megafono-marron\.png"/);
 for(const name of ['alumno-mano-alzada.png','alumno-proyector.png']){
  assert.ok(fs.existsSync(path.join(root,'public/assets',name)));
  assert.ok(fs.statSync(path.join(root,'public/assets',name)).size>1000);
 }
 assert.doesNotMatch(app,/alumno-palomita\.png/);
});
test('las cinco transiciones actualizan solo el icono y preservan estados y textos',()=>{
 const {go,$}=runner();
 const tests=[
  ['idle','megafono-marron.png',false,false,false],
  ['pending','alumno-mano-alzada.png',true,false,false],
  ['granted','alumno-mano-alzada.png',false,true,false],
  ['starting','alumno-mano-alzada.png',false,true,false],
  ['active','alumno-proyector.png',false,false,true],
  ['idle','megafono-marron.png',false,false,false]
 ];
 for(const [state,icon,pending,ready,active] of tests){
  go(state);assert.equal($('studentProjectionIcon').attrs.src,'/assets/'+icon,state);
  assert.equal($('startShare').classes.has('is-pending'),pending,state);
  assert.equal($('startShare').classes.has('is-ready'),ready,state);
  assert.equal($('startShare').classes.has('is-active'),active,state);
 }
});
test('el estado pendiente no recibe animación y los iconos activos contrastan con el fondo',()=>{
 assert.match(css,/\.student-main-action\.is-pending\{background:#e8a63e\}/);
 assert.match(css,/\.student-main-action\.is-ready\{[\s\S]*?animation:studentProjectionReadyBreath 2s ease-in-out infinite/);
 assert.match(css,/\.student-main-action\.is-ready \.student-megaphone,[\s\S]*?\.student-main-action\.is-active \.student-megaphone\{filter:brightness\(0\) invert\(1\)\}/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
