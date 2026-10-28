'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {mkdtempSync,rmSync}=require('node:fs');
const os=require('node:os');const path=require('node:path');const net=require('node:net');
const WS=require('ws');
async function port(){return new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});}
function delay(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
class SocketClient {
  constructor(ws){
    this.ws=ws;this.seq=0;this.pending=new Map();this.events=[];this.subscribers=[];
    ws.on('message',data=>{
      const msg=String(data);
      if(msg.startsWith('0'))ws.send('40');
      if(msg.startsWith('40'))this.ready?.();
      if(msg==='2')ws.send('3');
      if(msg.startsWith('43')){
        const m=/^43(\d+)(\[.*\])$/.exec(msg);if(!m)return;
        const callback=this.pending.get(Number(m[1]));this.pending.delete(Number(m[1]));callback?.(JSON.parse(m[2])[0]);
      }
      if(msg.startsWith('42[')){
        const [event,payload]=JSON.parse(msg.slice(2));
        const item={event,payload};this.events.push(item);
        for(const sub of [...this.subscribers])if(sub.event===event&&sub.predicate(payload)){
          clearTimeout(sub.timer);this.subscribers=this.subscribers.filter(s=>s!==sub);sub.resolve(payload);
        }
      }
    });
  }
  static connect(base,cookie){return new Promise((resolve,reject)=>{
    const ws=new WS(base.replace(/^http/,'ws')+'/socket.io/?EIO=4&transport=websocket',{headers:cookie?{Cookie:cookie}:{}});
    const client=new SocketClient(ws);client.ready=()=>resolve(client);ws.on('error',reject);
  });}
  emit(name,payload){return new Promise((resolve,reject)=>{
    const id=++this.seq;const timer=setTimeout(()=>reject(Error('ack timeout: '+name)),4000);
    this.pending.set(id,result=>{clearTimeout(timer);resolve(result);});
    this.ws.send(`42${id}${JSON.stringify(payload===undefined?[name]:[name,payload])}`);
  });}
  send(name,payload){this.ws.send('42'+JSON.stringify([name,payload]));}
  waitFor(event,predicate=()=>true,timeout=3000){
    const found=this.events.findIndex(e=>e.event===event&&predicate(e.payload));
    if(found>=0){const [item]=this.events.splice(found,1);return Promise.resolve(item.payload);}
    return new Promise((resolve,reject)=>{
      const s={event,predicate,resolve,reject};s.timer=setTimeout(()=>{
        this.subscribers=this.subscribers.filter(x=>x!==s);reject(Error('event timeout: '+event));
      },timeout);this.subscribers.push(s);
    });
  }
  close(){this.ws.close();}
}
test('receptor fijo, sesión persistente, cola sin captura, señalización por turno y reconexión docente',async t=>{
  const p=await port(),root=mkdtempSync(path.join(os.tmpdir(),'interlab050-integration-'));
  const child=spawn(process.execPath,[path.join(__dirname,'..','server.js')],{
    env:{...process.env,HOST:'127.0.0.1',PORT:String(p),HTTPS_ENABLED:'false',INTERLAB_FILES_DIR:path.join(root,'files')},stdio:'pipe'
  });
  let output='';child.stderr.on('data',chunk=>output+=String(chunk));
  const clients=[];
  t.after(async()=>{
    clients.forEach(c=>c.close());child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve));
    rmSync(root,{recursive:true,force:true});
  });
  const base=`http://127.0.0.1:${p}`;
  let doc;
  for(let i=0;i<75;i++){
    try{doc=await fetch(base+'/docente');if(doc.status===200)break;}catch{}
    await delay(60);
  }
  assert.equal(doc?.status,200,output);
  const cookie=doc.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(base+'/docente')).status,423,'segundo navegador no puede apropiarse del rol');
  const teacher=await SocketClient.connect(base,cookie);clients.push(teacher);
  const attached=await teacher.emit('teacher:attach',{});assert.equal(attached.ok,true);
  const created=await teacher.emit('teacher:create-session');assert.equal(created.ok,true);
  const receiver=await SocketClient.connect(base);clients.push(receiver);
  assert.equal((await receiver.emit('projection:register',{})).ok,true);
  assert.equal((await teacher.emit('teacher:screen-ready',{token:created.token})).ok,true);
  const defaultSource=await receiver.waitFor('projection:source',s=>s.kind==='teacher');
  const a=await SocketClient.connect(base);clients.push(a);
  const joined=await a.emit('student:join',{code:created.code,alias:'Ana'});assert.equal(joined.ok,true);
  const b=await SocketClient.connect(base);clients.push(b);
  const joinedB=await b.emit('student:join',{code:created.code,alias:'Beto'});assert.equal(joinedB.ok,true);
  assert.equal((await a.emit('student:request-presentation',{})).ok,true);
  const requests=await teacher.waitFor('presentation:queue-update',q=>q.some(x=>x.alias==='Ana'));
  assert.equal(requests.length,1);
  const grant=await teacher.emit('teacher:select-student',{token:created.token,studentId:joined.studentId});
  assert.equal(grant.ok,true);
  await a.waitFor('screen:requested');
  assert.equal((await a.emit('student:screen-ready',{})).ok,true);
  const source=await receiver.waitFor('projection:source',s=>s.kind==='student'&&s.id===joined.studentId);
  assert.ok(source.epoch>defaultSource.epoch);
  // Otra persona no puede dirigirse al receptor mediante la señalización.
  b.send('screen:signal',{to:receiver.ws._socket?.id??'inventado',epoch:source.epoch,description:{type:'offer',sdp:'bad'}});
  assert.equal((await a.emit('student:stop-sharing',{})).ok,true);
  await receiver.waitFor('projection:source',s=>s.kind==='teacher'&&s.epoch>source.epoch);
  // Una nueva concesión no debe perderse si docente se desconecta durante la presentación.
  await teacher.emit('teacher:select-student',{token:created.token,studentId:joined.studentId});
  await a.waitFor('screen:requested');
  await a.emit('student:screen-ready',{});
  await receiver.waitFor('projection:source',s=>s.kind==='student');
  teacher.close();
  const keepStudent=await receiver.waitFor('projection:source',s=>s.kind==='student'&&s.teacher.state==='waiting');
  assert.equal(keepStudent.kind,'student');
  assert.equal((await b.emit('student:request-presentation',{})).ok,true,'se permite entrar a cola sin docente');
  assert.equal((await fetch(base+'/docente',{headers:{Cookie:cookie}})).status,200);
  const returned=await SocketClient.connect(base,cookie);clients.push(returned);
  const resumed=await returned.emit('teacher:attach',{});assert.equal(resumed.ok,true);
  assert.equal(resumed.session.code,created.code);
  assert.equal(resumed.session.queue.some(x=>x.alias==='Beto'),true);
  const list=await fetch(base+'/api/files',{headers:{Authorization:`Bearer ${created.token}`}});
  assert.equal(list.status,200,'los archivos siguen accesibles al volver docente');
});
