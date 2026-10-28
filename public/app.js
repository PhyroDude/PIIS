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
  document.body.classList.remove('dashboard-active');
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
  activeRole='teacher';teacherToken=session.token;fileToken=session.token;document.body.classList.add('dashboard-active');
  $('displayCode').textContent=session.code;hide('teacherEntry');hide('roles');show('teacherView');
  initializeFileModule('teacher');renderParticipants(session.participants||[]);renderPresentationQueue(session.queue||[]);
  if(teacherStream)announceTeacherCapture();
  updateTeacherShareButtons();
  setMessage('teacherScreenStatus',teacherStream?'Captura local autorizada. Transmisión disponible para el receptor.':'Pulsa «Compartir mi pantalla» para iniciar el video en el proyector.');
}
function attachTeacher(){
  socket.emit('teacher:attach',{},result=>{
    if(!result?.ok){
      teacherAttached=false;teacherToken=null;activeRole=null;closePeer();clearFileModule();
      if(teacherStream){teacherStream.getTracks().forEach(t=>t.stop());teacherStream=null;}
      updateTeacherShareButtons();
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
  closeTeacherFeedback();
  closePeer();if(teacherStream){teacherStream.getTracks().forEach(t=>t.stop());teacherStream=null;}
  updateTeacherShareButtons();
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
  socket.emit('student:join',{code:$('code').value,alias:$('alias').value,isPhone:studentOnPhone},result=>{
    if(!result?.ok)return setMessage('studentEntryMessage',result?.error||'No se pudo ingresar.',true);
    activeRole='student';studentId=result.studentId;fileToken=result.fileToken;
    initializeFileModule('student');$('joinedAlias').textContent=result.alias;
    hide('roles');hide('studentEntry');show('studentView');refreshStudentNotes();
    applyPhoneProjectionRestriction();
    if(!window.APP_CONFIG?.allowNoteExport)$('exportStatus').textContent='Copiar y descargar están deshabilitados hasta validar formalmente su compatibilidad con RNF-002.';
  });
};

// El botón refleja el estado de la captura LOCAL del docente. Si un alumno
// presenta, la captura puede permanecer autorizada aunque no se envíe video.
function updateTeacherShareButtons(){
  const sharing=Boolean(teacherStream?.getVideoTracks().some(track=>track.readyState==='live'));
  const entryButton=$('teacherShareEntry');
  const dashboardButton=$('teacherShareActive');
  entryButton.textContent=sharing?'Dejar de compartir mi pantalla':'Compartir pantalla de mi laptop';
  entryButton.setAttribute('aria-pressed',String(sharing));
  dashboardButton.querySelector('strong').textContent=sharing?'Dejar de compartir mi pantalla':'Compartir mi pantalla';
  dashboardButton.querySelector('small').textContent=sharing?'Detener la captura de mi laptop':'Proyectar mi equipo en el laboratorio';
  dashboardButton.setAttribute('aria-pressed',String(sharing));
  dashboardButton.classList.toggle('is-sharing',sharing);
}
function stopTeacherCapture(){
  const stream=teacherStream;
  if(!stream)return;
  teacherStream=null; // Evita que el evento ended de una captura antigua afecte a otra.
  for(const track of stream.getTracks())track.stop();
  closePeer();
  if(teacherToken&&socket.connected)socket.emit('teacher:screen-ended',{token:teacherToken});
  updateTeacherShareButtons();
  setMessage('teacherScreenStatus','Has dejado de compartir tu pantalla. Puedes volver a autorizarla cuando quieras.');
  setMessage('teacherEntryMessage','Captura detenida. Puedes iniciar una nueva captura.');
}
let teacherCapturePending=false;
async function captureTeacher(){
  if(teacherCapturePending)return;
  if(teacherStream){stopTeacherCapture();return;}
  if(!teacherAttached)return setMessage('teacherEntryMessage','Aún no se ha adquirido el rol docente.',true);
  if(!navigator.mediaDevices?.getDisplayMedia){
    setMessage(activeRole==='teacher'?'teacherScreenStatus':'teacherEntryMessage','Para compartir pantalla se requiere HTTPS confiable.',true);
    return;
  }
  teacherCapturePending=true;
  $('teacherShareEntry').disabled=true;
  $('teacherShareActive').disabled=true;
  try{
    const stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:12,max:20}},audio:false});
    teacherStream=stream;
    stream.getVideoTracks()[0].addEventListener('ended',()=>{
      if(teacherStream===stream)stopTeacherCapture();
    },{once:true});
    updateTeacherShareButtons();
    setMessage('teacherScreenStatus','Captura autorizada. El servidor la utilizará como presentación predeterminada.');
    setMessage('teacherEntryMessage','Captura autorizada. Ahora puedes crear la sesión.');
    announceTeacherCapture();
  }catch(error){
    setMessage(activeRole==='teacher'?'teacherScreenStatus':'teacherEntryMessage',error.name==='NotAllowedError'?'No autorizaste la captura.':error.message,true);
  }finally{
    teacherCapturePending=false;
    $('teacherShareEntry').disabled=false;
    $('teacherShareActive').disabled=false;
    updateTeacherShareButtons();
  }
}
function announceTeacherCapture(){if(teacherToken&&socket.connected)socket.emit('teacher:screen-ready',{token:teacherToken},result=>{if(!result?.ok)setMessage('teacherScreenStatus',result?.error||'Error de captura.',true);});}
$('teacherShareEntry').onclick=captureTeacher;
$('teacherShareActive').onclick=captureTeacher;
updateTeacherShareButtons();

// Diseño docente 16:9: listas accesibles, filtro local y selección sin iniciar una proyección.
let participantRoster=[];
let participantDescending=false;
let selectedPerson=null;
function dashboardCell(row,text,className=''){
  const cell=document.createElement('td');cell.textContent=text;
  if(className)cell.className=className;
  row.append(cell);return cell;
}
function dashboardAction(label,handler,{disabled=false,secondary=false,title=''}={}){
  const btn=document.createElement('button');btn.type='button';btn.textContent=label;
  if(secondary)btn.className='secondary';btn.disabled=disabled;btn.title=title;
  if(!disabled)btn.onclick=handler;
  return btn;
}
function updateSelectedStudent(){
  $('selectedStudentName').textContent=selectedPerson?.alias||'Ninguno';
  $('selectedDeviceBadge').classList.toggle('hidden',!selectedPerson?.isPhone);
  $('selectedProjectionRequest').disabled=!selectedPerson||selectedPerson.isPhone===true;
  $('selectedNoteButton').disabled=!selectedPerson;
  $('selectedStudentHint').textContent=!selectedPerson
    ?'Selecciona un participante para solicitar su proyección o darle una nota.'
    :selectedPerson.isPhone
      ?'La proyección de pantalla no está disponible desde teléfonos. Puedes enviarle una nota.'
      :'Estudiante disponible para solicitar proyección o recibir una nota individual.';
}
function pickStudent(person){
  selectedPerson=person;selectedStudentId=person.id;
  $('selectedAlias').textContent=person.alias;
  updateSelectedStudent();renderParticipants(participantRoster);
}
function renderParticipants(people){
  participantRoster=Array.isArray(people)?people:[];
  $('count').textContent=`${participantRoster.length} / 30`;
  if(selectedPerson){
    const current=participantRoster.find(person=>person.id===selectedPerson.id);
    selectedPerson=current||null;
    if(!current){selectedStudentId=null;closeTeacherFeedback();}
  }
  updateSelectedStudent();
  const query=$('teacherParticipantSearch').value.trim().toLocaleLowerCase();
  const filtered=participantRoster.filter(person=>person.alias.toLocaleLowerCase().includes(query));
  filtered.sort((a,b)=>(participantDescending?-1:1)*a.alias.localeCompare(b.alias,'es',{sensitivity:'base',numeric:true}));
  const list=$('participants');list.replaceChildren();
  if(!filtered.length){const tr=document.createElement('tr');dashboardCell(tr,participantRoster.length?'No hay coincidencias.':'Esperando estudiantes…','table-empty').colSpan=5;list.append(tr);return;}
  filtered.forEach((person,i)=>{
    const tr=document.createElement('tr');if(selectedPerson?.id===person.id)tr.className='is-selected';
    dashboardCell(tr,String(i+1));
    const aliasCell=document.createElement('td');const aliasButton=dashboardAction(person.alias,()=>pickStudent(person));aliasButton.className='participant-alias';aliasCell.append(aliasButton);tr.append(aliasCell);
    const device=dashboardCell(tr,person.isPhone?'▯  Teléfono':'▣  Equipo');device.className='device-type';
    dashboardCell(tr,'●  Conectado','participant-online');
    const actions=document.createElement('td');const group=document.createElement('div');group.className='dash-row-actions';
    const request=dashboardAction(person.isPhone?'No disponible':'Solicitar proyección',()=>selectStudent(person),{
      disabled:person.isPhone===true,title:person.isPhone?'No se puede compartir pantalla desde teléfonos.':''
    });
    const note=dashboardAction('▤',()=>chooseStudentForFeedback(person),{secondary:true,title:'Dar nota personal'});note.classList.add('note-action');note.setAttribute('aria-label',`Dar nota personal a ${person.alias}`);
    group.append(request,note);actions.append(group);tr.append(actions);list.append(tr);
  });
}
socket.on('participants:update',renderParticipants);
$('teacherParticipantSearch').addEventListener('input',()=>renderParticipants(participantRoster));
$('teacherParticipantSort').onclick=()=>{
  participantDescending=!participantDescending;
  $('teacherParticipantSort').textContent=participantDescending?'Z–A':'A–Z';
  renderParticipants(participantRoster);
};
function renderPresentationQueue(queue){
  presentationQueue=Array.isArray(queue)?queue:[];
  $('queueCount').textContent=String(presentationQueue.length);
  const query=$('teacherQueueSearch').value.trim().toLocaleLowerCase();
  const entries=presentationQueue.filter(person=>person.alias.toLocaleLowerCase().includes(query));
  const list=$('presentationQueue');list.replaceChildren();
  if(!entries.length){const tr=document.createElement('tr');dashboardCell(tr,presentationQueue.length?'No hay coincidencias.':'No hay solicitudes pendientes.','table-empty').colSpan=5;list.append(tr);return;}
  entries.forEach(person=>{
    const tr=document.createElement('tr');dashboardCell(tr,String(person.position));
    const alias=dashboardCell(tr,person.alias);alias.style.fontWeight='700';
    dashboardCell(tr,'—');const status=dashboardCell(tr,'En cola');status.className='queue-state-cell';
    const group=document.createElement('div');group.className='dash-row-actions';
    const grant=dashboardAction('Conceder',()=>selectStudent(person),{disabled:person.isPhone===true,title:person.isPhone?'Proyección no disponible desde teléfonos.':'Conceder ahora, saltando la cola'});
    const reject=dashboardAction('Rechazar',()=>socket.emit('teacher:reject-request',{token:teacherToken,studentId:person.id},result=>{
      if(!result?.ok)setMessage('teacherMessage',result?.error||'No se pudo rechazar.',true);
    }),{secondary:true});
    group.append(grant,reject);const actions=document.createElement('td');actions.append(group);tr.append(actions);list.append(tr);
  });
}
socket.on('presentation:queue-update',renderPresentationQueue);
$('teacherQueueSearch').addEventListener('input',()=>renderPresentationQueue(presentationQueue));
const MAX_NOTE_LENGTH=1000;
const noteDialog=$('teacherFeedback');
let noteRecipientId=null;
let noteReturnFocus=null;
let noteSending=false;
function updateNoteCount(){
  const count=$('observationText').value.length;
  $('charCount').textContent=`${count} / ${MAX_NOTE_LENGTH} caracteres`;
  $('charCount').classList.toggle('note-limit-exceeded',count>MAX_NOTE_LENGTH);
  $('sendObservation').disabled=noteSending||!$('observationText').value.trim()||count>MAX_NOTE_LENGTH;
  $('observationError').textContent=count>MAX_NOTE_LENGTH
    ?`La nota supera el límite de ${MAX_NOTE_LENGTH} caracteres. Reduce el texto antes de enviarla.`:'';
}
function closeTeacherFeedback(){
  if(noteDialog.open)noteDialog.close();
}
function chooseStudentForFeedback(person){
  if(!person)return;
  pickStudent(person);
  noteRecipientId=person.id;
  noteReturnFocus=$('selectedNoteButton');
  $('observationText').value='';
  $('observationError').textContent='';
  updateNoteCount();
  if(!noteDialog.open)noteDialog.showModal();
  $('observationText').focus();
}
function selectStudent(person){
  pickStudent(person);
  if(person.isPhone===true)return setMessage('teacherMessage','La proyección de pantalla no está disponible desde teléfonos.',true);
  socket.emit('teacher:select-student',{token:teacherToken,studentId:person.id},result=>{
    if(!result?.ok)setMessage('teacherMessage',result?.error||'No se pudo seleccionar.',true);
    else setMessage('teacherMessage',`Solicitud enviada a ${person.alias}. Esperando su autorización de captura.`);
  });
}
$('selectedProjectionRequest').onclick=()=>{if(selectedPerson)selectStudent(selectedPerson);};
$('selectedNoteButton').onclick=()=>{if(selectedPerson)chooseStudentForFeedback(selectedPerson);};
$('closeTeacherFeedback').onclick=closeTeacherFeedback;
$('cancelTeacherFeedback').onclick=closeTeacherFeedback;
noteDialog.addEventListener('cancel',event=>{
  if(noteSending)event.preventDefault();
});
noteDialog.addEventListener('close',()=>{
  $('observationText').value='';
  $('observationError').textContent='';
  noteRecipientId=null;
  updateNoteCount();
  if(noteReturnFocus?.isConnected && !noteReturnFocus.disabled)noteReturnFocus.focus();
  noteReturnFocus=null;
});
$('observationText').addEventListener('input',updateNoteCount);
$('observationForm').onsubmit=event=>{
  event.preventDefault();
  if(noteSending)return;
  const recipientId=noteRecipientId;
  if(!recipientId){$('observationError').textContent='Selecciona un estudiante.';return;}
  const text=$('observationText').value.trim();
  const count=text.length;
  if(!text||count>MAX_NOTE_LENGTH){updateNoteCount();return;}
  noteSending=true;
  $('cancelTeacherFeedback').disabled=true;
  $('closeTeacherFeedback').disabled=true;
  updateNoteCount();
  socket.emit('teacher:add-observation',{token:teacherToken,studentId:recipientId,text},result=>{
    noteSending=false;
    $('cancelTeacherFeedback').disabled=false;
    $('closeTeacherFeedback').disabled=false;
    if(!result?.ok){
      updateNoteCount();
      $('observationError').textContent=result?.error||'No se pudo enviar la nota.';
      return;
    }
    closeTeacherFeedback();
    setMessage('teacherMessage','Nota personal enviada al alumno.');
  });
};
$('copyCode').onclick=async()=>{
  try{await navigator.clipboard.writeText($('displayCode').textContent);$('copyCode').textContent='Copiado';}
  catch{setMessage('teacherMessage',`Código: ${$('displayCode').textContent}`);}
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
  closeTeacherFeedback();
  clearFileModule();clearStudentLocal();closePeer();
  if(teacherStream){teacherStream.getTracks().forEach(t=>t.stop());teacherStream=null;}
  updateTeacherShareButtons();
  activeRole=null;teacherToken=null;teacherAttached=false;studentId=null;selectedStudentId=null;
  entry();
  setMessage(accessPath==='/alumno'?'studentEntryMessage':'teacherEntryMessage',`${result.message} Vuelve a abrir /docente si necesitas iniciar otra sesión.`);
});
