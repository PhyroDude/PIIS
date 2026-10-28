'use strict';
const diagnostic=document.getElementById('diagnostic');
const socket=typeof io==='function'?io({timeout:8000}):null;
let registrationError='',registered=false,connectionError='';
function diagnosticText(message){if(diagnostic)diagnostic.textContent=message;}
const diagnosticPanel=document.getElementById('rtc-diagnostic-panel');
const diagnosticError=document.getElementById('rtc-diagnostic-error');
const diagnosticDetails=document.getElementById('rtc-diagnostic-details');
const diagnosticOpen=document.getElementById('rtc-diagnostic-open');
const diagnosticCopy=document.getElementById('rtc-diagnostic-copy');
const diagnosticHide=document.getElementById('rtc-diagnostic-hide');
const diagnosticToggle=document.getElementById('rtc-diagnostic-details-toggle');
const diagnosticHistory=[];
let latestFault=null;
function diagnosticEvent(stage,detail='',isError=false){
  const stamp=new Date().toLocaleTimeString('es-MX',{hour12:false});
  const entry=`[${stamp}] ${stage}${detail?': '+String(detail):''}`;
  diagnosticHistory.push(entry);if(diagnosticHistory.length>60)diagnosticHistory.shift();
  if(diagnosticDetails)diagnosticDetails.textContent=diagnosticHistory.join('\n');
  if(isError){
    latestFault=entry;
    if(diagnosticError)diagnosticError.textContent=entry;
    if(diagnosticPanel)diagnosticPanel.classList.remove('hidden');
    if(diagnosticOpen)diagnosticOpen.hidden=true;
    console.error('[InterLAB receptor]',entry);
  }
}
function errorDetail(error){
  return `${error?.name||'Error'}: ${error?.message||String(error)}`;
}
if(diagnosticCopy) diagnosticCopy.onclick=async()=>{
  const info=[`InterLAB receptor | ${new Date().toISOString()}`,
    `Navegador: ${navigator.userAgent}`,`Socket conectado: ${Boolean(socket?.connected)}`,
    `Receptor registrado: ${registered}`,`Último error: ${latestFault||'ninguno'}`,
    'Eventos:',...diagnosticHistory].join('\n');
  try{await navigator.clipboard.writeText(info);diagnosticCopy.textContent='Diagnóstico copiado';}
  catch{
    // Alternativa visible para entornos kiosco donde Clipboard API no funciona.
    if(diagnosticDetails){diagnosticDetails.textContent=info;diagnosticDetails.hidden=false;}
    diagnosticCopy.textContent='Selecciona el texto de eventos y cópialo';
  }
};
if(diagnosticHide) diagnosticHide.onclick=()=>{diagnosticPanel.classList.add('hidden');diagnosticOpen.hidden=false;};
if(diagnosticOpen) diagnosticOpen.onclick=()=>{diagnosticPanel.classList.remove('hidden');diagnosticOpen.hidden=true;};
if(diagnosticToggle) diagnosticToggle.onclick=()=>{
  const willShow=diagnosticDetails.hidden;diagnosticDetails.hidden=!willShow;
  diagnosticToggle.textContent=willShow?'Ocultar eventos':'Ver eventos';
  diagnosticToggle.setAttribute('aria-expanded',String(willShow));
};
window.addEventListener('error',event=>diagnosticEvent('Error de JavaScript',event.message,true));
window.addEventListener('unhandledrejection',event=>diagnosticEvent('Promesa rechazada',errorDetail(event.reason),true));
const video=document.getElementById('screen');const waiting=document.getElementById('waiting');
const resumeVideoButton=document.getElementById('resume-video');
// La vista receptora solo muestra video: nunca necesita reproducir audio.
video.defaultMuted=true;video.muted=true;video.autoplay=true;video.playsInline=true;
const title=document.getElementById('title'),subtitle=document.getElementById('subtitle'),timer=document.getElementById('timer');
let peer=null,remoteId=null,epoch=null,pending=[],status=null,syncServerOffset=0,sdpAnswerTimer=null;
function closePeer(){
  if(sdpAnswerTimer){clearTimeout(sdpAnswerTimer);sdpAnswerTimer=null;}
  if(peer){peer.onicecandidate=null;peer.ontrack=null;peer.close();}
  peer=null;remoteId=null;epoch=null;pending=[];
  if(typeof video.pause==='function')video.pause();
  video.srcObject=null;video.style.display='none';waiting.classList.remove('hidden');
  if(resumeVideoButton)resumeVideoButton.hidden=true;
}
async function playReceivedVideo(){
  if(!peer||!video.srcObject)return;
  const activePeer=peer,activeStream=video.srcObject;
  // Reafirmar el silencio antes de play(): Firefox puede bloquear el inicio
  // incluso si el elemento llevaba 'muted' en su HTML.
  video.defaultMuted=true;video.muted=true;video.autoplay=true;video.playsInline=true;
  try{
    await video.play();
    if(peer!==activePeer||video.srcObject!==activeStream)return;
    if(resumeVideoButton)resumeVideoButton.hidden=true;
    video.style.display='block';waiting.classList.add('hidden');
    diagnosticEvent('Reproducción','Video iniciado');
  }catch(error){
    if(peer!==activePeer||video.srcObject!==activeStream)return;
    diagnosticEvent('Reproducción de video',errorDetail(error),true);
    if(error?.name==='NotAllowedError'){
      // No cerrar la negociación: la captura y WebRTC pueden estar bien.
      // Permitir que un gesto del usuario reactive SOLO la reproducción.
      video.style.display='none';waiting.classList.remove('hidden');
      title.textContent='Reproducción automática bloqueada';
      subtitle.textContent='Firefox bloqueó el video. Habilita la reproducción para esta página o pulsa «Reproducir video».';
      if(resumeVideoButton)resumeVideoButton.hidden=false;
    }else{
      closePeer();title.textContent='No se pudo reproducir el video';
      subtitle.textContent=errorDetail(error);
    }
  }
}
if(resumeVideoButton)resumeVideoButton.onclick=()=>{void playReceivedVideo();};
function fmt(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
function drawWaiting(){
  if(peer&&video.srcObject)return; // No se dibuja encima de video autorizado.
  waiting.classList.remove('hidden');video.style.display='none';
  timer.hidden=true;
  if(!socket){title.textContent='Error de conexión';subtitle.textContent='No se pudo cargar Socket.IO. Comprueba HTTPS y que el servicio InterLAB esté iniciado.';diagnosticText('Socket.IO no disponible');return;}
  if(!socket.connected){title.textContent='Esperando conexión';subtitle.textContent=connectionError||'Reconectando el receptor al servicio InterLAB';diagnosticText('Sin conexión Socket.IO');return;}
  if(registrationError){title.textContent='Receptor no autorizado';subtitle.textContent=registrationError;diagnosticText('Error de registro');return;}
  if(!registered){title.textContent='Conectando receptor';subtitle.textContent='Registrando el receptor local en InterLAB';diagnosticText('Servidor conectado · registro pendiente');return;}
  diagnosticText('Servidor conectado · receptor autorizado');
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
setInterval(drawWaiting,250);
if(socket){
socket.on('connect',()=>{
  diagnosticEvent('Socket.IO','Conectado');
  registered=false;registrationError='';connectionError='';
  socket.timeout(5000).emit('projection:register',{},(error,result)=>{
    if(error){registrationError='El servidor no confirmó el registro del receptor.';diagnosticEvent('Registro del receptor',errorDetail(error),true);}
    else if(!result?.ok){registrationError=result?.error||'Sin autorización para recibir la proyección.';diagnosticEvent('Registro denegado',registrationError,true);}
    else{registered=true;registrationError='';diagnosticEvent('Receptor','Autorizado');}
    drawWaiting();
  });
});
socket.on('connect_error',error=>{diagnosticEvent('Conexión Socket.IO',errorDetail(error),true);registered=false;connectionError=`No se pudo conectar al servidor (${error.message}). Comprueba el certificado HTTPS de este perfil.`;drawWaiting();});
socket.on('disconnect',reason=>{diagnosticEvent('Socket.IO desconectado',reason,true);registered=false;connectionError=`Conexión perdida: ${reason}`;closePeer();drawWaiting();});
socket.on('projection:replaced',()=>{diagnosticEvent('Receptor sustituido','Se registró otra instancia del receptor',true);closePeer();title.textContent='Receptor sustituido';});
socket.on('projection:source',async state=>{
  status=state;
  diagnosticEvent('Fuente autorizada',`${state.kind||'waiting'}; epoch=${state.epoch}; socket=${state.id?'presente':'ninguno'}`);
  diagnosticText(`Fuente recibida: ${state.kind||'sin fuente'}`);syncServerOffset=state.serverNow-Date.now();
  const id=state.id;
  if(state.kind==='waiting'||!id){closePeer();drawWaiting();return;}
  if(peer&&remoteId===id&&epoch===state.epoch)return;
  closePeer();remoteId=id;epoch=state.epoch;
  title.textContent=state.kind==='student'?'Conectando con el alumno':'Conectando con el docente';
  subtitle.textContent='Negociando transmisión WebRTC';
  try{
    const pc=new RTCPeerConnection({iceServers:[]});peer=pc;
    diagnosticEvent('WebRTC','Se creó RTCPeerConnection');
    pc.oniceconnectionstatechange=()=>{if(peer===pc){diagnosticEvent('ICE',pc.iceConnectionState);if(pc.iceConnectionState==='failed')diagnosticEvent('ICE falló','No se pudo establecer ruta de video entre emisor y receptor',true);}};
    pc.onsignalingstatechange=()=>{if(peer===pc)diagnosticEvent('Señalización',pc.signalingState);};
    pc.addTransceiver('video',{direction:'recvonly'});
    pc.onicecandidate=event=>{if(event.candidate && peer===pc)socket.emit('screen:signal',{to:id,epoch:state.epoch,candidate:event.candidate});};
    pc.ontrack=event=>{
      if(peer!==pc)return;
      diagnosticEvent('Pista recibida',`${event.track.kind}; estado=${event.track.readyState}`);
      video.srcObject=event.streams[0]||new MediaStream([event.track]);
      void playReceivedVideo();
    };
    pc.onconnectionstatechange=()=>{
      if(peer!==pc)return;
      diagnosticEvent('Conexión WebRTC',pc.connectionState);
      if(['failed','closed'].includes(pc.connectionState)){
        diagnosticEvent('Transmisión interrumpida',`estado=${pc.connectionState}`,true);
        closePeer();title.textContent='Se interrumpió el video';subtitle.textContent='Reconectando receptor';
        if(socket.connected)setTimeout(()=>socket.emit('projection:register',{}),1000);
      }else if(pc.connectionState==='disconnected'){
        setTimeout(()=>{if(peer===pc&&pc.connectionState==='disconnected'){
          closePeer();if(socket.connected)socket.emit('projection:register',{});
        }},3000);
      }
    };
    const offer=await pc.createOffer();diagnosticEvent('Oferta SDP','Generada');await pc.setLocalDescription(offer);diagnosticEvent('Oferta SDP','Descripción local aplicada');
    if(peer===pc){
      diagnosticEvent('Oferta SDP','Enviada al docente/alumno');
      socket.emit('screen:signal',{to:id,epoch:state.epoch,description:pc.localDescription});
      sdpAnswerTimer=setTimeout(()=>{
        if(peer===pc && !pc.remoteDescription){
          diagnosticEvent('Sin respuesta SDP',`No llegó una respuesta WebRTC en 12 s desde el ${state.kind==='teacher'?'docente':'alumno'}. Comprueba los mensajes de captura en su navegador y la señalización del servidor.`,true);
        }
      },12_000);
    }
  }catch(e){diagnosticEvent('Error al crear oferta WebRTC',errorDetail(e),true);closePeer();title.textContent='Error de proyección';subtitle.textContent=e.message;diagnosticText(`Error WebRTC: ${e.message}`);}
});
socket.on('screen:signal',async({from,epoch:signalEpoch,description,candidate})=>{
  if(!peer||from!==remoteId||signalEpoch!==epoch)return;
  const pc=peer;
  try{
    if(description?.type==='answer'){
      diagnosticEvent('Respuesta SDP','Recibida');await pc.setRemoteDescription(description);diagnosticEvent('Respuesta SDP','Aplicada');
      if(sdpAnswerTimer){clearTimeout(sdpAnswerTimer);sdpAnswerTimer=null;}
      for(const item of pending)await pc.addIceCandidate(item);pending=[];
    }else if(candidate){if(pc.remoteDescription)await pc.addIceCandidate(candidate);else pending.push(candidate);}
  }catch(error){diagnosticEvent('Error de señalización SDP/ICE',errorDetail(error),true);console.warn('WebRTC receptor:',error.message);diagnosticText(`Error de señalización: ${error.message}`);}
});
} else {drawWaiting();}
