'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const script=fs.readFileSync(path.join(__dirname,'../public/proyeccion.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../public/proyeccion.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../public/proyeccion.css'),'utf8');
function elt(){
 const classes=new Set();
 return {textContent:'',hidden:false,style:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},
  setAttribute(){},srcObject:null,play:async()=>{},};
}
function harness(offerFails=true){
 const elements={};const ids=['diagnostic','screen','waiting','title','subtitle','timer','rtc-diagnostic-panel','rtc-diagnostic-error','rtc-diagnostic-details','rtc-diagnostic-open','rtc-diagnostic-copy','rtc-diagnostic-hide','rtc-diagnostic-details-toggle'];
 for(const id of ids)elements[id]=elt();
 const handlers={};let interval=()=>{};const timers=[];
 const socket={connected:true,on:(name,cb)=>{handlers[name]=cb;},emit(){},timeout(){return {emit(_type,_payload,cb){cb(null,{ok:true});}};}};
 const context={document:{getElementById:id=>elements[id]},window:{addEventListener(){}},navigator:{userAgent:'Firefox test',clipboard:{writeText:async()=>{}}},io:()=>socket,
  setInterval:fn=>{interval=fn;},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout:()=>{},Date,Math,String,console:{warn(){},error(){}},MediaStream:class{},
  RTCPeerConnection:class{constructor(){this.connectionState='new';this.iceConnectionState='new';this.signalingState='stable';}
   addTransceiver(){} async createOffer(){if(offerFails)throw new Error('TEST: Oferta SDP rechazada');return {type:'offer',sdp:'test'};} async setLocalDescription(d){this.localDescription=d;} close(){this.connectionState='closed';}
  }};
 vm.runInNewContext(script,context);
 return {elements,handlers,tick:()=>interval(),timers,socket};
}
test('La interfaz del receptor incluye un diagnóstico persistente y botón para copiar',()=>{
 for(const id of ['rtc-diagnostic-panel','rtc-diagnostic-error','rtc-diagnostic-copy','rtc-diagnostic-details'])assert.ok(html.includes(`id="${id}"`));
 assert.match(css,/\.rtc-diagnostic-panel/);
});
test('El error de oferta permanece visible aunque se redibuje la pantalla de espera',async()=>{
 const h=harness();
 await h.handlers['projection:source']({kind:'teacher',id:'teacher-socket',epoch:3,serverNow:Date.now(),hasSession:false,teacher:{state:'connected'}});
 assert.match(h.elements['rtc-diagnostic-error'].textContent,/TEST: Oferta SDP rechazada/);
 assert.equal(h.elements['rtc-diagnostic-panel'].classList.contains('hidden'),false);
 h.tick();h.tick();h.tick();
 assert.equal(h.elements['rtc-diagnostic-panel'].classList.contains('hidden'),false);
 assert.match(h.elements['rtc-diagnostic-error'].textContent,/TEST: Oferta SDP rechazada/);
});
test('El panel puede ocultarse y abrirse manualmente sin perder el error',async()=>{
 const h=harness();
 await h.handlers['projection:source']({kind:'teacher',id:'teacher-socket',epoch:3,serverNow:Date.now(),hasSession:false,teacher:{state:'connected'}});
 h.elements['rtc-diagnostic-hide'].onclick();
 assert.equal(h.elements['rtc-diagnostic-open'].hidden,false);
 h.elements['rtc-diagnostic-open'].onclick();
 assert.equal(h.elements['rtc-diagnostic-panel'].classList.contains('hidden'),false);
 assert.match(h.elements['rtc-diagnostic-error'].textContent,/TEST: Oferta SDP rechazada/);
});

test('Si el emisor docente nunca responde, se conserva la alerta de 12 segundos',async()=>{
 const h=harness(false);
 await h.handlers['projection:source']({kind:'teacher',id:'teacher-socket',epoch:2,serverNow:Date.now(),hasSession:false,teacher:{state:'connected'}});
 assert.equal(h.timers.length,1);
 h.timers[0]();
 h.tick();
 assert.match(h.elements['rtc-diagnostic-error'].textContent,/Sin respuesta SDP/);
 assert.equal(h.elements['rtc-diagnostic-panel'].classList.contains('hidden'),false);
});
