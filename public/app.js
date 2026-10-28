'use strict';
const socket=io();
const $=id=>document.getElementById(id);
let teacherToken=null,activeRole=null,teacherAttached=false,studentId=null,selectedStudentId=null;
let teacherStream=null,studentStream=null,mediaPeer=null,mediaEpoch=null,mediaReceiverId=null;
let candidateBuffer=[],studentNotes=[],presentationQueue=[];
const earlySignals=new Map();
const peerConfig={iceServers:[]};
const accessPath=location.pathname.replace(/\/$/,'')||'/';
// Restricción de interfaz: los teléfonos no ofrecen captura de pantalla
// compatible con el flujo web de InterLAB. No afecta a los alumnos de PC.
function isPhoneDevice(){
  const ua=navigator.userAgent||'';
  return navigator.userAgentData?.mobile===true || /iPhone|iPod|Windows Phone|Android.*Mobile|Mobile.*Android/i.test(ua);
}
const studentOnPhone=isPhoneDevice();
const PHONE_PROJECTION_MESSAGE='La proyección de pantalla no está disponible desde teléfonos. Puedes seguir participando y compartiendo archivos.';
function applyPhoneProjectionRestriction(){
  if(!studentOnPhone)return false;
  $('startShare').disabled=true;
  $('startShare').title=PHONE_PROJECTION_MESSAGE;
  setMessage('studentScreenStatus',PHONE_PROJECTION_MESSAGE);
  return true;
}
const show=id=>$(id)?.classList.remove('hidden');
const hide=id=>$(id)?.classList.add('hidden');
function setMessage(id,text,error=false){if(!$(id))return;$(id).textContent=text;$(id).classList.toggle('error',error);}
function closePeer(){
  if(mediaPeer){mediaPeer.onicecandidate=null;mediaPeer.ontrack=null;mediaPeer.close();}
  mediaPeer=null;mediaEpoch=null;mediaReceiverId=null;candidateBuffer=[];
}
function theme(role){document.body.classList.remove('theme-teacher','theme-student');if(role)document.body.classList.add(`theme-${role}`);}
function entry(){
  hide('roles');hide('teacherEntry');hide('studentEntry');hide('teacherView');hide('studentView');
  if(accessPath==='/docente'){show('teacherEntry');theme('teacher');hide('backFromTeacher');}
  else if(accessPath==='/alumno'){show('studentEntry');theme('student');hide('backFromStudent');}
  else{show('roles');theme();}
}
entry();
$('teacherChoice').onclick=()=>{hide('roles');show('teacherEntry');theme('teacher');};
$('studentChoice').onclick=()=>{hide('roles');show('studentEntry');theme('student');};
$('backFromTeacher').onclick=entry;$('backFromStudent').onclick=entry;
function teacherSessionReady(session){
  activeRole='teacher';teacherToken=session.token;fileToken=session.token;
  $('displayCode').textContent=session.code;hide('teacherEntry');hide('roles');show('teacherView');
  initializeFileModule('teacher');renderParticipants(session.participants||[]);renderPresentationQueue(session.queue||[]);
  if(teacherStream)announceTeacherCapture();
  setMessage('teacherScreenStatus',teacherStream?'Captura local autorizada. Transmisión disponible para el receptor.':'Pulsa «Compartir mi pantalla» para iniciar el video en el proyector.');
}
function attachTeacher(){
  socket.emit('teacher:attach',{},result=>{
    if(!result?.ok){
      teacherAttached=false;teacherToken=null;activeRole=null;closePeer();clearFileModule();
      if(teacherStream){teacherStream.getTracks().forEach(t=>t.stop());teacherStream=null;}
      entry();
      setMessage('teacherEntryMessage',`${result?.error||'No se pudo recuperar el control docente.'} Recarga /docente cuando el control esté disponible.`,true);
      return;
    }
    teacherAttached=true;
    if(result.session)teacherSessionReady(result.session);
    else if(activeRole==='teacher'){clearFileModule();activeRole=null;teacherToken=null;entry();}
    else setMessage('teacherEntryMessage','Control docente adquirido. Puedes compartir tu pantalla y crear la sesión.');
  });
}
socket.on('connect',()=>{
  $('connection').textContent='Conectado';$('connection').classList.add('online');$('connection').classList.remove('offline');
  if(accessPath==='/docente')attachTeacher();
  if(accessPath==='/alumno'&&activeRole==='student'){
    // Un alumno desconectado pierde su identidad de socket y deberá incorporarse otra vez.
    clearStudentLocal();clearFileModule();activeRole=null;entry();
    setMessage('studentEntryMessage','La conexión se restableció. Ingresa nuevamente con tu alias y código.');
  }
});
socket.on('disconnect',()=>{
  $('connection').textContent='Conexión interrumpida';$('connection').classList.remove('online');$('connection').classList.add('offline');
  closePeer();if(activeRole==='teacher')setMessage('teacherScreenStatus','Sin conexión al servidor. La sesión continúa en InterLAB.');
});
socket.on('teacher:revoked',()=>{
  closePeer();if(teacherStream){teacherStream.getTracks().forEach(t=>t.stop());teacherStream=null;}
  clearFileModule();teacherToken=null;teacherAttached=false;activeRole=null;entry();
  setMessage('teacherEntryMessage','Se liberó o sustituyó el control docente. Vuelve a abrir /docente cuando esté disponible.',true);
});
$('teacherForm').onsubmit=event=>{
  event.preventDefault();
  if(!teacherAttached)return setMessage('teacherEntryMessage','Esperando autorización del servidor.',true);
  socket.emit('teacher:create-session',result=>{
    if(!result?.ok)return setMessage('teacherEntryMessage',result?.error||'No se pudo crear la sesión.',true);
    teacherSessionReady({...result,participants:[],queue:[]});
  });
};
$('studentForm').onsubmit=event=>{
  event.preventDefault();
  socket.emit('student:join',{code:$('code').value,alias:$('alias').value},result=>{
    if(!result?.ok)return setMessage('studentEntryMessage',result?.error||'No se pudo ingresar.',true);
    activeRole='student';studentId=result.studentId;fileToken=result.fileToken;
    initializeFileModule('student');$('joinedAlias').textContent=result.alias;
    hide('roles');hide('studentEntry');show('studentView');refreshStudentNotes();
    applyPhoneProjectionRestriction();
    if(!window.APP_CONFIG?.allowNoteExport)$('exportStatus').textContent='Copiar y descargar están deshabilitados hasta validar formalmente su compatibilidad con RNF-002.';
  });
};

async function captureTeacher(){
  if(!teacherAttached)return setMessage('teacherEntryMessage','Aún no se ha adquirido el rol docente.',true);
  if(!navigator.mediaDevices?.getDisplayMedia)return setMessage('teacherEntryMessage','Para compartir pantalla se requiere HTTPS confiable.',true);
  try{
    if(teacherStream)teacherStream.getTracks().forEach(t=>t.stop());
    teacherStream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:12,max:20}},audio:false});
    teacherStream.getVideoTracks()[0].addEventListener('ended',()=>{
      teacherStream=null;closePeer();
      if(teacherToken)socket.emit('teacher:screen-ended',{token:teacherToken});
      setMessage('teacherScreenStatus','Captura finalizada. Puedes autorizarla nuevamente.');
    },{once:true});
    setMessage('teacherScreenStatus','Captura autorizada. El servidor la utilizará como presentación predeterminada.');
    setMessage('teacherEntryMessage','Captura autorizada. Ahora puedes crear la sesión.');
    announceTeacherCapture();
  }catch(error){setMessage('teacherEntryMessage',error.name==='NotAllowedError'?'No autorizaste la captura.':error.message,true);}
}
function announceTeacherCapture(){if(teacherToken&&socket.connected)socket.emit('teacher:screen-ready',{token:teacherToken},result=>{if(!result?.ok)setMessage('teacherScreenStatus',result?.error||'Error de captura.',true);});}
$('teacherShareEntry').onclick=captureTeacher;
$('teacherShareActive').onclick=captureTeacher;

function renderParticipants(people){
  $('count').textContent=`${people.length} / 30`;const list=$('participants');list.replaceChildren();
  if(!people.length){const li=document.createElement('li');li.className='muted';li.textContent='Esperando estudiantes…';list.append(li);return;}
  people.forEach((person,i)=>{
    const li=document.createElement('li');li.className='participant';
    const label=document.createElement('span');label.textContent=`${String(i+1).padStart(2,'0')} · ${person.alias}`;
    const actions=document.createElement('div');actions.className='actions';
    const select=document.createElement('button');select.type='button';select.className='secondary';select.textContent='Solicitar presentación';select.onclick=()=>selectStudent(person);
    const note=document.createElement('button');note.type='button';note.className='secondary';note.textContent='Dar nota';note.onclick=()=>selectStudent(person,{focusNote:true});
    actions.append(select,note);li.append(label,actions);list.append(li);
  });
}
socket.on('participants:update',renderParticipants);
function renderPresentationQueue(queue){
  presentationQueue=Array.isArray(queue)?queue:[];
  $('queueCount').textContent=`${presentationQueue.length} solicitud${presentationQueue.length===1?'':'es'}`;
  const list=$('presentationQueue');list.replaceChildren();
  if(!presentationQueue.length){const li=document.createElement('li');li.className='muted';li.textContent='No hay solicitudes pendientes.';list.append(li);return;}
  for(const person of presentationQueue){
    const li=document.createElement('li');li.className='participant';const text=document.createElement('span');text.textContent=`${person.position}. ${person.alias}`;
    const actions=document.createElement('div');actions.className='actions';
    const button=document.createElement('button');button.className='primary';button.type='button';button.textContent='Conceder acceso';button.onclick=()=>selectStudent(person);
    const reject=document.createElement('button');reject.className='secondary';reject.type='button';reject.textContent='Rechazar';
    reject.onclick=()=>socket.emit('teacher:reject-request',{token:teacherToken,studentId:person.id},result=>{
      if(!result?.ok)setMessage('teacherMessage',result?.error||'No se pudo rechazar.',true);
    });
    actions.append(button,reject);li.append(text,actions);list.append(li);
  }
}
socket.on('presentation:queue-update',renderPresentationQueue);
function selectStudent(person,options={}){
  selectedStudentId=person.id;$('selectedAlias').textContent=person.alias;show('teacherFeedback');
  $('observationText').value='';$('charCount').textContent='0 / 1000';
  socket.emit('teacher:select-student',{token:teacherToken,studentId:person.id},result=>{
    if(!result?.ok)setMessage('teacherMessage',result?.error||'No se pudo seleccionar.',true);
    else if(options.focusNote)$('observationText').focus();
    else setMessage('teacherMessage',`Solicitud enviada a ${person.alias}. Esperando su autorización de captura.`);
  });
}
$('copyCode').onclick=async()=>{
  try{await navigator.clipboard.writeText($('displayCode').textContent);$('copyCode').textContent='Copiado';}
  catch{setMessage('teacherMessage',`Código: ${$('displayCode').textContent}`);}
};
$('observationText').addEventListener('input',()=>{$('charCount').textContent=`${$('observationText').value.length} / 1000`;});
$('observationForm').onsubmit=event=>{
  event.preventDefault();if(!selectedStudentId)return setMessage('teacherMessage','Selecciona un estudiante.',true);
  socket.emit('teacher:add-observation',{token:teacherToken,studentId:selectedStudentId,text:$('observationText').value},result=>{
    if(!result?.ok)return setMessage('teacherMessage',result?.error||'No se pudo guardar.',true);
    $('observationText').value='';$('charCount').textContent='0 / 1000';setMessage('teacherMessage','Nota guardada temporalmente.');
  });
};
function refreshStudentNotes(){
  socket.emit('student:get-observations',result=>{
    if(!result?.ok)return setMessage('exportStatus',result?.error||'No se pudieron consultar notas.',true);
    studentNotes=result.observations;const list=$('studentNotes');list.replaceChildren();
    if(!studentNotes.length){const li=document.createElement('li');li.textContent='Aún no hay observaciones escritas.';li.className='muted';list.append(li);}
    studentNotes.forEach(note=>{const li=document.createElement('li');li.className='note';const body=document.createElement('p');body.textContent=note.text;
      const meta=document.createElement('small');meta.textContent=new Date(note.createdAt).toLocaleString();li.append(body,meta);list.append(li);});
    const canExport=Boolean(window.APP_CONFIG?.allowNoteExport)&&studentNotes.length>0;
    $('copyNotes').disabled=!canExport;$('downloadNotes').disabled=!canExport;
  });
}
socket.on('student:observations-updated',()=>{if(activeRole==='student')refreshStudentNotes();});
$('refreshNotes').onclick=refreshStudentNotes;
function notesAsText(){return studentNotes.map((n,i)=>`${i+1}. ${new Date(n.createdAt).toLocaleString()}\n${n.text}`).join('\n\n');}
$('copyNotes').onclick=async()=>{
  if(!window.APP_CONFIG?.allowNoteExport||!studentNotes.length)return;
  try{await navigator.clipboard.writeText(notesAsText());setMessage('exportStatus','Notas copiadas al portapapeles.');}
  catch{setMessage('exportStatus','El navegador no permitió copiar.',true);}
};
$('downloadNotes').onclick=()=>{
  if(!window.APP_CONFIG?.allowNoteExport||!studentNotes.length)return;
  const url=URL.createObjectURL(new Blob([notesAsText()],{type:'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='mis-observaciones.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),30_000);
};

// Una solicitud NO inicia captura ni transmisión de vídeo.
$('startShare').onclick=()=>{
  if(applyPhoneProjectionRestriction())return;
  socket.emit('student:request-presentation',{},result=>{
    if(!result?.ok)return setMessage('studentScreenStatus',result?.error||'Error al solicitar.',true);
    if(result.selected)return setMessage('studentScreenStatus','Tu docente ya te seleccionó. Revisa la notificación.');
    const position=result.queue.findIndex(item=>item.id===studentId)+1;
    setMessage('studentScreenStatus',`Solicitud registrada (posición ${position}). Todavía no transmites video.`);
    $('startShare').disabled=true;$('withdrawShare').disabled=false;
  });
};
socket.on('presentation:request-rejected',()=>{
  if(activeRole==='student'){
    $('startShare').disabled=false;$('withdrawShare').disabled=true;
    setMessage('studentScreenStatus','El docente rechazó tu solicitud. Puedes solicitar turno nuevamente.');
  }
});
$('withdrawShare').onclick=()=>socket.emit('student:withdraw-presentation',{},result=>{
  if(result?.ok){$('startShare').disabled=false;$('withdrawShare').disabled=true;setMessage('studentScreenStatus','Solicitud retirada de la cola.');}
  else setMessage('studentScreenStatus',result?.error||'No se pudo retirar.',true);
});
function closeStudentNotice(){hide('projectionNotice');}
$('projectionNoticeClose').onclick=closeStudentNotice;
$('projectionNoticeReject').onclick=()=>{
  closeStudentNotice();
  socket.emit('student:stop-sharing',{},result=>{
    if(!result?.ok)setMessage('studentScreenStatus',result?.error||'No se pudo rechazar.',true);
    else{clearStudentLocal();setMessage('studentScreenStatus','Has rechazado la solicitud de proyección.');}
  });
};
function clearStudentLocal(){
  closeStudentNotice();closePeer();
  if(studentStream)studentStream.getTracks().forEach(t=>t.stop());studentStream=null;
  $('startShare').disabled=false;$('withdrawShare').disabled=true;$('stopShare').disabled=true;
  if(activeRole==='student')applyPhoneProjectionRestriction();
}
$('stopShare').onclick=()=>{
  clearStudentLocal();socket.emit('student:stop-sharing',{},result=>{
    if(!result?.ok)setMessage('studentScreenStatus',result?.error||'Error al finalizar.',true);
  });
  setMessage('studentScreenStatus','Proyección finalizada.');
};
$('projectionNoticeAction').onclick=async()=>{
  closeStudentNotice();
  if(applyPhoneProjectionRestriction())return;
  if(!navigator.mediaDevices?.getDisplayMedia)return setMessage('studentScreenStatus','No es posible capturar pantalla sin HTTPS confiable.',true);
  try{
    studentStream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:12,max:20}},audio:false});
    studentStream.getVideoTracks()[0].addEventListener('ended',()=>{$('stopShare').click();},{once:true});
    socket.emit('student:screen-ready',{},result=>{
      if(!result?.ok){clearStudentLocal();return setMessage('studentScreenStatus',result?.error||'Autorización revocada.',true);}
      $('startShare').disabled=true;$('withdrawShare').disabled=true;$('stopShare').disabled=false;
      setMessage('studentScreenStatus','Presentación autorizada. El servidor está mostrando tu pantalla.');
    });
  }catch(error){setMessage('studentScreenStatus',error.name==='NotAllowedError'?'No autorizaste la captura.':error.message,true);}
};
socket.on('screen:requested',()=>{
  if(activeRole!=='student')return;
  if(studentOnPhone){
    // El docente puede seleccionar a un alumno desde la lista. Si usa un
    // teléfono, liberamos ese turno sin pedir una captura imposible.
    socket.emit('student:stop-sharing',{});
    applyPhoneProjectionRestriction();
    return;
  }
  $('projectionNoticeText').textContent='Tu docente solicita que presentes tu pantalla. Pulsa «Autorizar pantalla» para elegir qué compartir.';
  show('projectionNotice');$('withdrawShare').disabled=true;
  setMessage('studentScreenStatus','El docente te seleccionó. Debes autorizar la captura para proyectar.');
});
socket.on('screen:stop',()=>{
  if(activeRole==='student'){clearStudentLocal();setMessage('studentScreenStatus','El docente detuvo tu turno. Ya no se transmite video.');}
});
$('stopPresentation').onclick=()=>socket.emit('teacher:stop-presentation',{token:teacherToken},result=>{
  if(!result?.ok)setMessage('teacherMessage',result?.error||'No se pudo detener.',true);
});
socket.on('projection:status',state=>{
  if(activeRole!=='teacher')return;
  const text=state.kind==='student'?`Se proyecta la pantalla de ${state.alias}.`:
    state.kind==='teacher'?'El servidor está proyectando tu pantalla.':
    'El receptor está esperando una fuente de video.';
  setMessage('screenStatus',text);
});

// El receptor /proyeccion inicia las ofertas; el emisor responde solo si el
// servidor valida el turno/epoch. Nunca se crea conexión estudiante-servidor
// hasta que el docente concede acceso y el estudiante acepta la captura.
socket.on('presentation:source-stop',()=>closePeer());
socket.on('screen:signal',async({from,epoch,description,candidate})=>{
  const stream=activeRole==='teacher'?teacherStream:activeRole==='student'?studentStream:null;
  if(!stream)return;
  try{
    if(description?.type==='offer'){
      const key=`${from}:${epoch}`;const early=earlySignals.get(key)||[];earlySignals.clear();
      closePeer();mediaEpoch=epoch;mediaReceiverId=from;
      const peer=new RTCPeerConnection(peerConfig);mediaPeer=peer;
      stream.getTracks().forEach(track=>peer.addTrack(track,stream));
      peer.onicecandidate=event=>{if(event.candidate&&mediaPeer===peer)socket.emit('screen:signal',{to:from,epoch,candidate:event.candidate});};
      await peer.setRemoteDescription(description);
      if(mediaPeer!==peer)return;
      for(const item of early)await peer.addIceCandidate(item);
      const answer=await peer.createAnswer();await peer.setLocalDescription(answer);
      if(mediaPeer===peer)socket.emit('screen:signal',{to:from,epoch,description:peer.localDescription});
    }else if(candidate){
      if(mediaPeer && epoch===mediaEpoch && from===mediaReceiverId && mediaPeer.remoteDescription)await mediaPeer.addIceCandidate(candidate);
      else if(!mediaPeer){const key=`${from}:${epoch}`;const items=earlySignals.get(key)||[];if(items.length<64)items.push(candidate);earlySignals.set(key,items);}
    }
  }catch(error){setMessage(activeRole==='student'?'studentScreenStatus':'teacherScreenStatus',`Error WebRTC: ${error.message}`,true);}
});
$('fullscreen').onclick=()=>setMessage('teacherMessage','La vista de proyección se muestra en pantalla completa en la computadora fija.');
$('end').onclick=()=>{
  if(!confirm('¿Finalizar la sesión? Se eliminarán todos los archivos y datos temporales.'))return;
  socket.emit('teacher:end-session',{token:teacherToken},result=>{if(!result?.ok)setMessage('teacherMessage',result?.error||'No se pudo cerrar.',true);});
};
socket.on('session:ended',result=>{
  clearFileModule();clearStudentLocal();closePeer();
  if(teacherStream){teacherStream.getTracks().forEach(t=>t.stop());teacherStream=null;}
  activeRole=null;teacherToken=null;teacherAttached=false;studentId=null;selectedStudentId=null;
  entry();
  setMessage(accessPath==='/alumno'?'studentEntryMessage':'teacherEntryMessage',`${result.message} Vuelve a abrir /docente si necesitas iniciar otra sesión.`);
});
