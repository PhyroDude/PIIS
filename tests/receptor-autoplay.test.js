'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const vm=require('node:vm');
const script=fs.readFileSync(path.join(__dirname,'../public/proyeccion.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../public/proyeccion.html'),'utf8');
const {configureFirefoxAutoplay}=require('../scripts/open-receptor');
function elem(){const active=new Set();return {style:{},hidden:false,textContent:'',srcObject:null,
 classList:{add:x=>active.add(x),remove:x=>active.delete(x),contains:x=>active.has(x)},
 setAttribute(){},play:async()=>{},pause(){}};}
function harness(){
 const ids=['diagnostic','screen','waiting','title','subtitle','timer','resume-video','rtc-diagnostic-panel','rtc-diagnostic-error','rtc-diagnostic-details','rtc-diagnostic-open','rtc-diagnostic-copy','rtc-diagnostic-hide','rtc-diagnostic-details-toggle'];
 const el=Object.fromEntries(ids.map(id=>[id,elem()]));el['resume-video'].hidden=true;
 let blocked=true,attempts=0;
 el.screen.play=async()=>{attempts++;if(blocked)throw Object.assign(new Error('Autoplay bloqueado'),{name:'NotAllowedError'});};
 const handlers={};const peers=[];
 const socket={connected:true,on(name,cb){handlers[name]=cb;},emit(){},timeout(){return{emit(_event,_payload,cb){cb(null,{ok:true});}};}};
 const context={document:{getElementById:id=>el[id]},window:{addEventListener(){}},navigator:{clipboard:{writeText:async()=>{}},userAgent:'Firefox'},io:()=>socket,console:{error(){},warn(){}},Date,Math,String,
 setTimeout:()=>1,clearTimeout(){},setInterval(){},MediaStream:class{},
 RTCPeerConnection:class{
 constructor(){this.closed=false;this.remoteDescription=null;peers.push(this);}
 addTransceiver(){}
 async createOffer(){return {type:'offer',sdp:'test'};}
 async setLocalDescription(description){this.localDescription=description;}
 close(){this.closed=true;}
 }};
 vm.runInNewContext(script,context);
 return {el,handlers,peers,unblock(){blocked=false;},getAttempts(){return attempts;}};
}
test('HTML contiene video silenciado y control de reproducción manual',()=>{
 assert.match(html,/<video[^>]+autoplay\s+muted\s+playsinline/);
 assert.match(html,/id="resume-video"/);
});
test('Firefox bloquea autoplay: se conserva WebRTC y se habilita la reproducción al pulsar botón',async()=>{
 const h=harness();
 await h.handlers['projection:source']({kind:'teacher',id:'teacher',epoch:2,serverNow:Date.now(),hasSession:true,teacher:{state:'connected'}});
 const peer=h.peers[0];assert.ok(peer);
 peer.ontrack({streams:[{id:'teacher-stream'}],track:{kind:'video',readyState:'live'}});
 await new Promise(setImmediate);
 assert.equal(peer.closed,false,'No se debe cerrar la negociación ante NotAllowedError');
 assert.equal(h.el['resume-video'].hidden,false,'Se debe mostrar un botón para recuperar la reproducción');
 assert.equal(h.el.screen.muted,true,'Se debe silenciar el video de forma explícita');
 assert.match(h.el['rtc-diagnostic-error'].textContent,/NotAllowedError/);
 h.unblock();h.el['resume-video'].onclick();await new Promise(setImmediate);
 assert.equal(h.el['resume-video'].hidden,true);
 assert.equal(h.el.waiting.classList.contains('hidden'),true);
 assert.equal(peer.closed,false);
 assert.equal(h.getAttempts(),2);
});
test('Cambiar a pantalla de espera elimina el control de reproducción',async()=>{
 const h=harness();
 await h.handlers['projection:source']({kind:'teacher',id:'teacher',epoch:3,serverNow:Date.now(),hasSession:true,teacher:{state:'connected'}});
 h.peers[0].ontrack({streams:[{id:'teacher-stream'}],track:{kind:'video',readyState:'live'}});
 await new Promise(setImmediate);
 h.handlers['projection:source']({kind:'waiting',id:null,epoch:4,serverNow:Date.now(),hasSession:true,teacher:{state:'waiting',expiresAt:Date.now()+90000}});
 assert.equal(h.el['resume-video'].hidden,true);
 assert.equal(h.el.screen.srcObject,null);
});
test('Firefox: la preferencia de reproducción solo se escribe en el perfil receptor',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'interlab-ff-'));
 try{
   fs.writeFileSync(path.join(dir,'user.js'),'user_pref("browser.startup.page", 1);\nuser_pref("media.autoplay.default", 5);\n');
   assert.equal(configureFirefoxAutoplay(dir,{env:{}}),true);
   const content=fs.readFileSync(path.join(dir,'user.js'),'utf8');
   assert.match(content,/user_pref\("browser.startup.page", 1\)/);
   assert.match(content,/user_pref\("media.autoplay.default", 0\)/);
   assert.equal((content.match(/media\.autoplay\.default/g)||[]).length,1);
   assert.equal(configureFirefoxAutoplay(dir,{env:{}}),true);
   assert.equal((fs.readFileSync(path.join(dir,'user.js'),'utf8').match(/media\.autoplay\.default/g)||[]).length,1);
   assert.equal(configureFirefoxAutoplay(dir,{env:{INTERLAB_FIREFOX_AUTOPLAY:'0'}}),false);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
