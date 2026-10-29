'use strict';
const socket=io();const video=document.getElementById('screen');const waiting=document.getElementById('waiting');
const title=document.getElementById('title'),subtitle=document.getElementById('subtitle'),timer=document.getElementById('timer');
const accessInfo=document.getElementById('accessInfo'),accessCards=document.getElementById('accessCards');
let peer=null,remoteId=null,epoch=null,pending=[],status=null,syncServerOffset=0;
function closePeer(){if(peer){peer.onicecandidate=null;peer.ontrack=null;peer.close();}peer=null;remoteId=null;epoch=null;pending=[];video.srcObject=null;video.style.display='none';waiting.classList.remove('hidden');}
function fmt(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
function drawWaiting(){
  if(peer&&video.srcObject)return; // No se dibuja encima de video autorizado.
  waiting.classList.remove('hidden');video.style.display='none';
  timer.hidden=true;
  if(!socket.connected){title.textContent='Esperando conexión';subtitle.textContent='Reconectando el receptor al servicio InterLAB';return;}
  if(!status?.hasSession){title.textContent='Esperando al docente';subtitle.textContent='Servidor listo para iniciar una sesión';return;}
  if(status.teacher.state==='waiting'){
    title.textContent='Esperando conexión';subtitle.textContent='Se perdió la conexión del docente';
    const remaining=Math.max(0,Math.ceil((status.teacher.expiresAt-(Date.now()+syncServerOffset))/1000));
    if(remaining<=60){timer.hidden=false;timer.textContent=fmt(remaining);}
  }else if(status.teacher.state==='expired'||status.teacher.state==='unassigned'){
    title.textContent='Tiempo de espera concluido';subtitle.textContent='Esperando nuevo docente';
  }else if(status.kind==='student'){
    title.textContent='Conectando con el alumno';subtitle.textContent='Preparando la presentación autorizada';
  }else if(status.teacher.state==='connected'){
    title.textContent='Esperando pantalla';subtitle.textContent='El docente debe autorizar o restablecer la captura';
  }else{title.textContent='Esperando al docente';subtitle.textContent='Servidor preparado';}
}
// Consulta local: la IP puede cambiar sin reiniciar la aplicación. Los QR
// contienen solo la URL /alumno; no utilizan servicios externos.
let lastAccessJson='';
function makeAccessCard(kind,entry){
  const card=document.createElement('article');card.className='access-card '+kind;
  const heading=document.createElement('div');heading.className='access-heading';
  const symbol=document.createElement('span');symbol.className='access-symbol';
  symbol.textContent=kind==='wifi'?'◉':'▤';symbol.setAttribute('aria-hidden','true');
  const text=document.createElement('strong');text.textContent=kind==='wifi'?'Teléfonos · Wi-Fi':kind==='ethernet'?'Computadoras · Ethernet':'Red local';
  heading.append(symbol,text);card.append(heading);
  const url=document.createElement('p');url.className='access-url';url.textContent=entry.url;card.append(url);
  const hint=document.createElement('p');hint.className='access-hint';
  hint.textContent=kind==='wifi'?'Escanea el código o escribe la dirección en tu teléfono.':'Escribe la dirección completa en el navegador.';
  card.append(hint);
  if(kind==='wifi'&&entry.qrSvg){
    const container=document.createElement('div');container.className='access-qr';
    const img=document.createElement('img');img.alt='QR para acceder a '+entry.url;
    img.width=190;img.height=190;
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(entry.qrSvg);
    container.append(img);card.append(container);
  }
  return card;
}
async function refreshStudentAccess(){
  try{
    const result=await fetch('/api/projection/student-access',{cache:'no-store'});
    if(!result.ok)throw Error('No se pudieron consultar las direcciones.');
    const access=await result.json();
    const serialized=JSON.stringify(access);
    if(serialized===lastAccessJson)return;
    lastAccessJson=serialized;
    const entries=[...(access.ethernet||[]).map(x=>['ethernet',x]),...(access.wifi||[]).map(x=>['wifi',x]),...(access.lan||[]).map(x=>['lan',x])];
    accessCards.replaceChildren(...entries.map(([kind,entry])=>makeAccessCard(kind,entry)));
    accessInfo.textContent=entries.length?'Ingresa tu alias y el código de sesión que te proporcione el docente.':'No se detectaron direcciones IPv4 de acceso en la red local.';
  }catch(error){
    if(!lastAccessJson)accessInfo.textContent='Esperando las direcciones de acceso del servidor.';
    console.warn('Direcciones de alumnos:',error.message);
  }
}
refreshStudentAccess();
setInterval(refreshStudentAccess,20_000);
setInterval(drawWaiting,250);
socket.on('connect',()=>{refreshStudentAccess();socket.emit('projection:register',{},result=>{if(!result?.ok){title.textContent='Error de receptor';subtitle.textContent=result?.error||'Sin autorización.';}});});
socket.on('disconnect',()=>{closePeer();drawWaiting();});
socket.on('projection:replaced',()=>{closePeer();title.textContent='Receptor sustituido';});
socket.on('projection:source',async state=>{
  status=state;syncServerOffset=state.serverNow-Date.now();
  const id=state.id;
  if(state.kind==='waiting'||!id){closePeer();drawWaiting();return;}
  if(peer&&remoteId===id&&epoch===state.epoch)return;
  closePeer();remoteId=id;epoch=state.epoch;
  title.textContent=state.kind==='student'?'Conectando con el alumno':'Conectando con el docente';
  subtitle.textContent='Negociando transmisión WebRTC';
  try{
    const pc=new RTCPeerConnection({iceServers:[]});peer=pc;
    pc.addTransceiver('video',{direction:'recvonly'});
    pc.onicecandidate=event=>{if(event.candidate && peer===pc)socket.emit('screen:signal',{to:id,epoch:state.epoch,candidate:event.candidate});};
    pc.ontrack=event=>{
      if(peer!==pc)return;
      video.srcObject=event.streams[0]||new MediaStream([event.track]);
      video.style.display='block';waiting.classList.add('hidden');
      video.play().catch(()=>{closePeer();title.textContent='No se pudo reproducir el video';});
    };
    pc.onconnectionstatechange=()=>{
      if(peer!==pc)return;
      if(['failed','closed'].includes(pc.connectionState)){
        closePeer();title.textContent='Se interrumpió el video';subtitle.textContent='Reconectando receptor';
        if(socket.connected)setTimeout(()=>socket.emit('projection:register',{}),1000);
      }else if(pc.connectionState==='disconnected'){
        setTimeout(()=>{if(peer===pc&&pc.connectionState==='disconnected'){
          closePeer();if(socket.connected)socket.emit('projection:register',{});
        }},3000);
      }
    };
    const offer=await pc.createOffer();await pc.setLocalDescription(offer);
    if(peer===pc)socket.emit('screen:signal',{to:id,epoch:state.epoch,description:pc.localDescription});
  }catch(e){closePeer();title.textContent='Error de proyección';subtitle.textContent=e.message;}
});
socket.on('screen:signal',async({from,epoch:signalEpoch,description,candidate})=>{
  if(!peer||from!==remoteId||signalEpoch!==epoch)return;
  const pc=peer;
  try{
    if(description?.type==='answer'){
      await pc.setRemoteDescription(description);
      for(const item of pending)await pc.addIceCandidate(item);pending=[];
    }else if(candidate){if(pc.remoteDescription)await pc.addIceCandidate(candidate);else pending.push(candidate);}
  }catch(error){console.warn('WebRTC receptor:',error.message);}
});
