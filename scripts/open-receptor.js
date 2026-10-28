'use strict';
// Abre la vista /proyeccion en modo quiosco en la computadora fija.
// La sesión la mantiene server.js; cerrar el navegador receptor no la finaliza.
const {spawn,spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const net=require('node:net');

function browserKind(command){
  return /^(firefox|firefox-esr|firefox-developer-edition|firefox-beta)(\.exe)?$/i.test(path.win32.basename(command)) ? 'firefox' : 'chromium';
}
function commandExists(command){
  return spawnSync('which',[command],{stdio:'ignore'}).status===0;
}
function findBrowser({platform=process.platform,env=process.env,exists=fs.existsSync,available=commandExists}={}){
  if(env.INTERLAB_BROWSER?.trim()){
    const command=env.INTERLAB_BROWSER.trim();
    return {command,kind:browserKind(command)};
  }
  if(platform==='win32'){
    const programFiles=env.PROGRAMFILES||'C:\\Program Files';
    const programFilesX86=env['PROGRAMFILES(X86)']||'C:\\Program Files (x86)';
    const candidates=[
      path.win32.join(programFiles,'Mozilla Firefox','firefox.exe'),
      path.win32.join(programFilesX86,'Mozilla Firefox','firefox.exe'),
      path.win32.join(programFilesX86,'Microsoft','Edge','Application','msedge.exe'),
      path.win32.join(programFiles,'Google','Chrome','Application','chrome.exe')
    ];
    const command=candidates.find(exists);
    return command?{command,kind:browserKind(command)}:null;
  }
  if(platform==='darwin'){
    const firefox='/Applications/Firefox.app/Contents/MacOS/firefox';
    const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const command=[firefox,chrome].find(exists);
    return command?{command,kind:browserKind(command)}:null;
  }
  // Preferimos Firefox si ya está instalado en el equipo del laboratorio.
  for(const command of ['firefox','firefox-esr','firefox-developer-edition','chromium','chromium-browser','google-chrome','google-chrome-stable','microsoft-edge']){
    if(available(command))return {command,kind:browserKind(command)};
  }
  return null;
}
function profileFor(browser,{home=os.homedir(),env=process.env,exists=fs.existsSync}={}){
  if(browser.kind==='firefox'){
    if(env.INTERLAB_FIREFOX_PROFILE?.trim())return path.resolve(env.INTERLAB_FIREFOX_PROFILE.trim());
    // Firefox en Ubuntu suele venir como Snap: un perfil fuera de ~/snap/firefox
    // puede resultar inaccesible debido al confinamiento de Snap.
    const snapBrowser=browser.command==='firefox'||browser.command==='/snap/bin/firefox';
    if(snapBrowser && exists('/snap/bin/firefox')){
      return path.join(home,'snap','firefox','common','.mozilla','firefox','interlab-receptor');
    }
    return path.join(home,'.interlab','receptor-firefox');
  }
  return path.join(home,'.interlab','receptor-browser');
}

// Firefox utiliza un perfil dedicado exclusivamente a la pantalla receptora.
// En ese perfil permitimos video automático para que el modo quiosco funcione
// sin intervención; se puede desactivar con INTERLAB_FIREFOX_AUTOPLAY=0.
function configureFirefoxAutoplay(profile,{env=process.env,exists=fs.existsSync,read=fs.readFileSync,write=fs.writeFileSync}={}){
  if(env.INTERLAB_FIREFOX_AUTOPLAY==='0')return false;
  const configPath=path.join(profile,'user.js');
  const setting='user_pref("media.autoplay.default", 0);';
  let content=exists(configPath)?read(configPath,'utf8'):'';
  const regexp=/^\s*user_pref\(["']media\.autoplay\.default["'],\s*[^)]*\);[^\S\r\n]*$/gm;
  if(regexp.test(content))content=content.replace(regexp,setting);
  else content+=`${content&&!content.endsWith('\n')?'\n':''}// InterLAB: reproducción automática en el perfil dedicado del receptor.\n${setting}\n`;
  write(configPath,content,{mode:0o600});
  return true;
}

function launchArgs(browser,profile,url,{setup=false}={}){
  if(browser.kind==='firefox'){
    // Firefox NO acepta las opciones de Chromium (--user-data-dir, etc.).
    // --no-remote permite abrir un perfil independiente de Firefox personal.
    return ['--no-remote','--profile',profile,...(setup?[]:['--kiosk']),url];
  }
  return [...(setup?[]:['--kiosk']),'--no-first-run','--disable-session-crashed-bubble',`--user-data-dir=${profile}`,url];
}
function waitForPort(port,timeout=20_000){return new Promise((resolve,reject)=>{
  const started=Date.now();
  function check(){
    const sock=net.connect({port,host:'127.0.0.1'});
    sock.once('connect',()=>{sock.destroy();resolve();});
    sock.once('error',()=>{
      sock.destroy();
      if(Date.now()-started>timeout)reject(Error('El servicio InterLAB no está escuchando.'));
      else setTimeout(check,400);
    });
  }
  check();
});}
async function main(){
  const port=Number(process.env.PORT||3000);
  const protocol=process.env.HTTPS_ENABLED==='false'?'http':'https';
  const url=`${protocol}://localhost:${port}/proyeccion`;
  const browser=findBrowser();
  if(!browser)throw Error('No se encontró Firefox/Chromium/Chrome/Edge. Instala Firefox o configura INTERLAB_BROWSER.');
  await waitForPort(port);
  const profile=profileFor(browser);
  fs.mkdirSync(profile,{recursive:true,mode:0o700});
  if(browser.kind==='firefox')configureFirefoxAutoplay(profile);
  const setup=process.env.INTERLAB_RECEPTOR_SETUP==='1';
  const args=launchArgs(browser,profile,url,{setup});
  const child=spawn(browser.command,args,{stdio:'ignore',detached:true});
  child.on('error',error=>{console.error('No se pudo abrir el receptor:',error.message);process.exitCode=1;});
  child.unref();
  console.log(`${setup?'Modo preparación (ventana normal)':'Receptor iniciado'} con ${browser.kind==='firefox'?'Firefox':'Chromium/Chrome/Edge'}: ${url}`);
  if(setup)console.log('Si Firefox solicita confiar en el certificado local de InterLAB, verifica su origen e instálalo como confiable en este perfil antes de iniciar el modo quiosco.');
}
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={browserKind,findBrowser,profileFor,launchArgs,configureFirefoxAutoplay};
