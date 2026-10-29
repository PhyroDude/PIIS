'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(base,'public/app.js'),'utf8');
const css=fs.readFileSync(path.join(base,'public/styles.css'),'utf8');
function slice(from,to){const a=app.indexOf(from),b=app.indexOf(to,a);assert.ok(a>=0&&b>a);return app.slice(a,b);}
function elements(){const nodes=new Map();return id=>{if(!nodes.has(id)){const classes=new Set();nodes.set(id,{classes,textContent:'',disabled:false,attrs:{},classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name);}},setAttribute(name,value){this.attrs[name]=value;}});}return nodes.get(id);};}
test('pulso solo en estados autorizado y preparando, nunca idle, cola ni transmisión',()=>{
 const $=elements();const ctx={$,studentOnPhone:false,studentProjectionState:'idle'};vm.createContext(ctx);
 vm.runInContext(slice('function setStudentProjectionState(state){','function setStudentRequestMode(mode){'),ctx);
 const states=[['idle',false,false],['pending',false,true],['granted',true,false],['starting',true,false],['active',false,false],['idle',false,false]];
 for(const [state,ready,pending] of states){vm.runInContext(`setStudentProjectionState(${JSON.stringify(state)})`,ctx);assert.equal($('startShare').classes.has('is-ready'),ready,state);assert.equal($('startShare').classes.has('is-pending'),pending,state);}
 assert.equal($('startShare').classes.has('is-active'),false);
});
test('autorización directa y de cola activan el pulso antes de iniciar captura',()=>{
 assert.match(app,/if\(fromQueue\)\{[\s\S]*?setStudentProjectionState\('granted'\)/);
 const fn=slice('async function beginStudentCapture(){',"$('projectionNoticeAction').onclick");
 assert.match(fn,/setStudentProjectionState\('granted'\);\s*try\{\s*const stream=await navigator\.mediaDevices\.getDisplayMedia/);
 assert.match(fn,/setStudentProjectionState\('starting'\)/);
 assert.match(app,/if\(peer\.connectionState==='connected'\)\{\s*setStudentProjectionState\('active'\)/);
});
test('estilo azul brilla cada 2 s y respeta movimiento reducido',()=>{
 assert.match(css,/\.student-main-action\.is-ready\s*\{[^}]*background:#315bd5[^}]*animation:studentProjectionReadyBreath 2s ease-in-out infinite/);
 assert.match(css,/@keyframes studentProjectionReadyBreath\s*\{[\s\S]*?50%\{background:#497dff/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{[\s\S]*?\.student-workspace \*[^}]*animation:none!important/);
});
