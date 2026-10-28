'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process');const net=require('node:net');
async function freePort(){return new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});}
test('nuevo arranque limpia temporales UUID de sesiones anteriores sin borrar datos ajenos',async t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'interlab-restart-'));
  const stale=path.join(root,'4c2ce9b4-e647-4f30-bf2a-d3718077946b');
  fs.mkdirSync(stale);fs.writeFileSync(path.join(stale,'incompleto.part'),'carga incompleta');
  fs.writeFileSync(path.join(root,'archivo-de-otro-programa.txt'),'conservar');
  const port=await freePort();
  const child=spawn(process.execPath,[path.join(__dirname,'..','server.js')],{env:{...process.env,HTTPS_ENABLED:'false',PORT:String(port),HOST:'127.0.0.1',INTERLAB_FILES_DIR:root},stdio:'ignore'});
  t.after(async()=>{child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve));fs.rmSync(root,{recursive:true,force:true});});
  let ready=false;
  for(let i=0;i<80;i++)try{if((await fetch(`http://127.0.0.1:${port}/proyeccion`)).status===200){ready=true;break;}}catch{await new Promise(resolve=>setTimeout(resolve,60));}
  assert.equal(ready,true);
  assert.equal(fs.existsSync(stale),false);
  assert.equal(fs.readFileSync(path.join(root,'archivo-de-otro-programa.txt'),'utf8'),'conservar');
});
