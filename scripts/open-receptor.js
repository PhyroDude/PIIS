'use strict';
// Abre un navegador local en modo quiosco. No ejecuta la sesión ni recibe
// credenciales docentes; la vista /proyeccion se autoriza solo por loopback.
const {spawn,spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const net=require('node:net');
const port=Number(process.env.PORT||3000);
const protocol=process.env.HTTPS_ENABLED==='false'?'http':'https';
const url=`${protocol}://localhost:${port}/proyeccion`;
function executable(){
  if(process.env.INTERLAB_BROWSER)return process.env.INTERLAB_BROWSER;
  if(process.platform==='win32'){
    const paths=[
      path.join(process.env['PROGRAMFILES(X86)']||'C:\\Program Files (x86)','Microsoft','Edge','Application','msedge.exe'),
      path.join(process.env.PROGRAMFILES||'C:\\Program Files','Google','Chrome','Application','chrome.exe')
    ];
    return paths.find(p=>fs.existsSync(p))||'msedge';
  }
  if(process.platform==='darwin')return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  for(const item of ['chromium','chromium-browser','google-chrome','google-chrome-stable','microsoft-edge']){
    if(spawnSync('which',[item],{stdio:'ignore'}).status===0)return item;
  }
  return null;
}
function waitForPort(timeout=20_000){return new Promise((resolve,reject)=>{
  const started=Date.now();function check(){
    const sock=net.connect({port,host:'127.0.0.1'});
    sock.once('connect',()=>{sock.destroy();resolve();});
    sock.once('error',()=>{sock.destroy();if(Date.now()-started>timeout)reject(Error('El servicio InterLAB no está escuchando.'));else setTimeout(check,400);});
  }check();
});}
(async()=>{
  await waitForPort();
  const browser=executable();
  if(!browser)throw Error('No se encontró Chromium/Chrome/Edge. Instala uno o configura INTERLAB_BROWSER.');
  const userData=path.join(os.homedir(),'.interlab','receptor-browser');
  fs.mkdirSync(userData,{recursive:true,mode:0o700});
  const args=['--kiosk','--no-first-run','--disable-session-crashed-bubble',`--user-data-dir=${userData}`,url];
  const child=spawn(browser,args,{stdio:'ignore',detached:true});
  child.on('error',error=>{console.error('No se pudo abrir el receptor:',error.message);process.exitCode=1;});
  child.unref();console.log('Receptor iniciado:',url);
})().catch(error=>{console.error(error.message);process.exitCode=1;});
