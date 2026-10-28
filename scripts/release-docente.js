'use strict';
// Operación excepcional de administración SOLO desde la computadora fija.
const fs=require('fs');const path=require('path');const os=require('os');
const http=require('http'),https=require('https');
const readline=require('node:readline/promises');
(async()=>{
  if(!process.stdin.isTTY)throw Error('Se requiere una terminal interactiva local.');
  const rl=readline.createInterface({input:process.stdin,output:process.stdout});
  try{
    const value=await rl.question('Escribe LIBERAR para revocar el control docente (la sesión continuará): ');
    if(value!=='LIBERAR'){console.log('Operación cancelada.');return;}
  }finally{rl.close();}
  const root=path.resolve(process.env.INTERLAB_FILES_DIR||path.join(os.tmpdir(),'interlab-temp-files'));
  const data=JSON.parse(fs.readFileSync(path.join(root,'.local-control','recovery.json'),'utf8'));
  const transport=data.protocol==='https'?https:http;
  await new Promise((resolve,reject)=>{
    const options={hostname:'localhost',port:data.port,path:'/api/local/release-teacher',method:'POST',headers:{'x-interlab-local-secret':data.secret}};
    if(data.protocol==='https')options.ca=fs.readFileSync(path.join(__dirname,'..','certs','interlab.pem'));
    const req=transport.request(options,res=>{
      let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>{
        if(res.statusCode!==200)return reject(Error(`HTTP ${res.statusCode}: ${body}`));
        console.log('Control docente liberado. La sesión se conserva.');resolve();
      });
    });req.on('error',reject);req.end();
  });
})().catch(error=>{console.error(error.message);process.exitCode=1;});
