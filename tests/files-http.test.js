'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');
const net=require('node:net');

async function freePort(){return new Promise((resolve,reject)=>{const s=net.createServer();s.on('error',reject);s.listen(0,'127.0.0.1',()=>{const {port}=s.address();s.close(error=>error?reject(error):resolve(port));});});}
class SocketClient {
  constructor(ws){this.ws=ws;this.seq=0;this.events=[];this.waits=new Map();this.pending=new Map();
    ws.addEventListener('message',event=>{
      const message=String(event.data);
      if(message.startsWith('0'))ws.send('40');
      if(message.startsWith('40')){this.connected=true;this.ready?.();}
      if(message==='2')ws.send('3');
      if(message.startsWith('43')){
        const m=/^43(\d+)(\[.*\])$/.exec(message);if(!m)return;
        const result=JSON.parse(m[2])[0];const entry=this.pending.get(Number(m[1]));this.pending.delete(Number(m[1]));entry?.(result);
      }
    });
  }
  static connect(base){return new Promise((resolve,reject)=>{
    const ws=new WebSocket(`${base.replace(/^http/,'ws')}/socket.io/?EIO=4&transport=websocket`);
    const client=new SocketClient(ws);client.ready=()=>resolve(client);
    ws.onerror=()=>reject(Error('No se pudo conectar socket.io'));
  });}
  emit(event,...args){return new Promise((resolve,reject)=>{
    const id=++this.seq;const timer=setTimeout(()=>{this.pending.delete(id);reject(Error(`Timeout ${event}`));},5000);
    this.pending.set(id,result=>{clearTimeout(timer);resolve(result);});
    this.ws.send(`42${id}${JSON.stringify([event,...args])}`);
  });}
  close(){this.ws.close();}
}
async function api(base,token,route,opts={}){
  const response=await fetch(base+'/api/files'+route,{method:opts.method||'GET',headers:{Authorization:`Bearer ${token}`,...(opts.body&&!(opts.body instanceof Uint8Array)?{'Content-Type':'application/json'}:{}),...(opts.headers||{})},body:opts.body&&!(opts.body instanceof Uint8Array)?JSON.stringify(opts.body):opts.body});
  const type=response.headers.get('content-type')||'';
  const data=type.includes('application/json')?await response.json():Buffer.from(await response.arrayBuffer());
  return {status:response.status,data};
}
test('API HTTP autenticada: roles, límites, descargas, ZIP, limpieza y revocación',async t=>{
  const port=await freePort();const root=fs.mkdtempSync(path.join(os.tmpdir(),'interlab-server-test-'));
  const child=spawn(process.execPath,[path.join(__dirname,'..','server.js')],{env:{...process.env,PORT:String(port),HOST:'127.0.0.1',HTTPS_ENABLED:'false',INTERLAB_FILES_DIR:path.join(root,'files')},stdio:'pipe'});
  let output='';child.stderr.on('data',chunk=>output+=String(chunk));
  const base=`http://127.0.0.1:${port}`;
  const sockets=[];
  t.after(async()=>{for(const s of sockets)s.close();child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve));await fs.promises.rm(root,{recursive:true,force:true});});
  let available=false;
  for(let i=0;i<70;i++)try{const response=await fetch(base+'/docente');if(response.ok){available=true;break;}}catch{await new Promise(resolve=>setTimeout(resolve,60));}
  assert.equal(available,true,output);
  const unauthorized=await fetch(base+'/api/files');assert.equal(unauthorized.status,401);
  const teacher=await SocketClient.connect(base);sockets.push(teacher);
  const created=await teacher.emit('teacher:create-session');assert.equal(created.ok,true);
  const studentA=await SocketClient.connect(base);sockets.push(studentA);
  const joinedA=await studentA.emit('student:join',{code:created.code,alias:'Ana'});assert.equal(joinedA.ok,true);
  const studentB=await SocketClient.connect(base);sockets.push(studentB);
  const joinedB=await studentB.emit('student:join',{code:created.code,alias:'Beto'});assert.equal(joinedB.ok,true);
  const selection=await api(base,joinedA.fileToken,'/batches',{method:'POST',body:{files:[{name:'nota.txt',size:4},{name:'archivo.zip',size:3}]}});
  assert.equal(selection.status,200,JSON.stringify(selection.data));
  const b=selection.data;const i=b.files[0].id;const j=b.files[1].id;
  let sent=await api(base,joinedA.fileToken,`/batches/${b.batchId}/${i}`,{method:'PUT',body:Buffer.from('hola')});
  assert.equal(sent.status,200,JSON.stringify(sent.data));
  sent=await api(base,joinedA.fileToken,`/batches/${b.batchId}/${j}`,{method:'PUT',body:Buffer.from('zip')});
  assert.equal(sent.status,200,JSON.stringify(sent.data));
  const files=await api(base,joinedB.fileToken,'/');assert.equal(files.status,200);assert.equal(files.data.files.length,2);
  const forbidden=await api(base,joinedB.fileToken,`/${i}`,{method:'DELETE'});assert.equal(forbidden.status,403);
  const ticket=await api(base,joinedB.fileToken,'/tickets',{method:'POST',body:{ids:[i]}});assert.equal(ticket.status,200);
  const single=await fetch(base+ticket.data.url);assert.equal(single.status,200);assert.equal(await single.text(),'hola');
  assert.equal((await fetch(base+ticket.data.url)).status,404);
  const zipticket=await api(base,joinedB.fileToken,'/tickets',{method:'POST',body:{ids:[i,j]}});assert.equal(zipticket.status,200);
  const zip=Buffer.from(await (await fetch(base+zipticket.data.url)).arrayBuffer());assert.equal(zip.readUInt32LE(0),0x04034b50);
  assert.equal(zip.readUInt32LE(zip.length-22),0x06054b50);
  const teacherDeletes=await api(base,created.token,`/${i}`,{method:'DELETE'});assert.equal(teacherDeletes.status,200);
  const stale=await api(base,joinedA.fileToken,'/tickets',{method:'POST',body:{ids:[i]}});assert.equal(stale.status,404);
  const tooLarge=await api(base,joinedA.fileToken,'/batches',{method:'POST',body:{files:[{name:'huge',size:50_000_001}]}});assert.equal(tooLarge.status,413);
  const close=await teacher.emit('teacher:end-session',{token:created.token});assert.equal(close.ok,true);
  const old=await api(base,joinedB.fileToken,'/');assert.equal(old.status,401);
  await new Promise(resolve=>setTimeout(resolve,100));
  const rootDirs=fs.existsSync(path.join(root,'files'))?fs.readdirSync(path.join(root,'files')):[];
  assert.deepEqual(rootDirs,[]);
});
