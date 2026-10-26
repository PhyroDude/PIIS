const socket = io();
const $ = id => document.getElementById(id);
let teacherToken = null;
let activeRole = null;
let selectedStudentId = null;
let studentId = null;
let studentStream = null;
let teacherPeer = null;
let studentPeer = null;
let studentHasSelection = false;
let teacherNotes = [];
let studentNotes = [];
let presentationQueue = [];
let pendingTeacherCandidates = [];
let pendingStudentCandidates = [];
const peerConfig = { iceServers: [] }; // LAN: no se necesita un servidor STUN/TURN para la prueba local básica.

function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }
function setMessage(id, text, error = false) { $(id).textContent = text; $(id).classList.toggle('error', error); }
function cleanPeer(peer) { if (peer) { peer.onicecandidate = null; peer.ontrack = null; peer.close(); } }
function stopStudentStream() {
  if (activeRole === 'student') socket.emit('student:stop-sharing');
  if (studentStream) studentStream.getTracks().forEach(track => track.stop());
  studentStream = null;
  cleanPeer(studentPeer); studentPeer = null;
  $('stopShare').disabled = true; $('startShare').disabled = false;
  $('studentScreenStatus').textContent = 'No estás compartiendo pantalla.';
}
function stopTeacherView(message = 'Selecciona un estudiante. Si comparte su pantalla, la transmisión se abrirá cuando lo selecciones.') {
  cleanPeer(teacherPeer); teacherPeer = null;
  $('screenVideo').srcObject = null;
  $('screenStatus').textContent = message;
}
function showNotice(text) { show('notice'); $('notice').textContent = text; }
function setTheme(role = null) { document.body.classList.remove('theme-teacher', 'theme-student'); if (role) document.body.classList.add(`theme-${role}`); }
function showRolePicker() { hide('teacherEntry'); hide('studentEntry'); show('roles'); setTheme(); }

socket.on('connect', () => { $('connection').textContent = 'Conectado'; $('connection').classList.add('online'); $('connection').classList.remove('offline'); });
socket.on('disconnect', () => { $('connection').textContent = 'Conexión interrumpida'; $('connection').classList.add('offline'); $('connection').classList.remove('online'); });
$('teacherChoice').onclick = () => { hide('roles'); hide('studentEntry'); show('teacherEntry'); setTheme('teacher'); setMessage('message', ''); setMessage('teacherEntryMessage', ''); };
$('studentChoice').onclick = () => { hide('roles'); hide('teacherEntry'); show('studentEntry'); setTheme('student'); setMessage('message', ''); setMessage('studentEntryMessage', ''); };
$('backFromTeacher').onclick = showRolePicker;
$('backFromStudent').onclick = showRolePicker;

$('teacherForm').onsubmit = event => {
  event.preventDefault();
  socket.emit('teacher:create-session', result => {
    if (!result.ok) return setMessage('teacherEntryMessage', result.error, true);
    activeRole = 'teacher'; teacherToken = result.token;
    $('displayCode').textContent = result.code;
    hide('roles'); hide('teacherEntry'); show('teacherView');
    socket.emit('teacher:get-participants', { token: teacherToken }, r => { if (r.ok) renderParticipants(r.participants); });
  });
};

$('studentForm').onsubmit = event => {
  event.preventDefault();
  socket.emit('student:join', { code: $('code').value, alias: $('alias').value }, result => {
    if (!result.ok) return setMessage('studentEntryMessage', result.error, true);
    activeRole = 'student'; studentId = result.studentId;
    $('joinedAlias').textContent = result.alias;
    hide('roles'); hide('studentEntry'); show('studentView'); refreshStudentNotes();
    if (!window.APP_CONFIG?.allowNoteExport) $('exportStatus').textContent = 'Copiar y descargar están deshabilitados hasta validar formalmente su compatibilidad con el RNF-002.';
  });
};

function renderParticipants(participants) {
  $('count').textContent = `${participants.length} / 30`;
  const list = $('participants'); list.replaceChildren();
  if (!participants.length) { const li = document.createElement('li'); li.textContent = 'Esperando estudiantes…'; li.className = 'muted'; list.append(li); return; }
  participants.forEach((person, index) => {
    const li = document.createElement('li'); li.className = 'participant';
    const name = document.createElement('span'); name.textContent = `${String(index + 1).padStart(2, '0')} · ${person.alias}`;
    const actions = document.createElement('div'); actions.className = 'actions';
    const view = document.createElement('button'); view.className = 'secondary'; view.type = 'button'; view.textContent = 'Elegir directamente'; view.title = 'Concede acceso inmediato y salta la cola';
    view.onclick = () => selectStudent(person);
    const note = document.createElement('button'); note.className = 'secondary'; note.type = 'button'; note.textContent = 'Dar nota';
    note.onclick = () => selectStudent(person, { focusNote: true });
    actions.append(view, note); li.append(name, actions); list.append(li);
  });
}
socket.on('participants:update', renderParticipants);

function renderPresentationQueue(queue) {
  presentationQueue = Array.isArray(queue) ? queue : [];
  $('queueCount').textContent = `${presentationQueue.length} solicitud${presentationQueue.length === 1 ? '' : 'es'}`;
  const list = $('presentationQueue'); list.replaceChildren();
  if (!presentationQueue.length) {
    const li = document.createElement('li'); li.textContent = 'No hay solicitudes pendientes.'; li.className = 'muted'; list.append(li); return;
  }
  presentationQueue.forEach(person => {
    const li = document.createElement('li'); li.className = 'participant';
    const name = document.createElement('span'); name.textContent = `${person.position}. ${person.alias}`;
    const grant = document.createElement('button'); grant.className = 'primary'; grant.type = 'button'; grant.textContent = 'Conceder acceso';
    grant.onclick = () => selectStudent(person);
    li.append(name, grant); list.append(li);
  });
}
socket.on('presentation:queue-update', renderPresentationQueue);

function selectStudent(person, options = {}) {
  selectedStudentId = person.id;
  $('selectedAlias').textContent = person.alias;
  show('teacherFeedback'); setMessage('teacherMessage', '');
  $('observationText').value = ''; $('charCount').textContent = '0 / 1000';
  stopTeacherView(`Esperando la pantalla de ${person.alias}. Si aún no ha autorizado la captura, pídele que lo haga en su equipo.`);
  socket.emit('teacher:select-student', { token: teacherToken, studentId: person.id }, result => {
    if (!result.ok) setMessage('teacherMessage', result.error, true);
    else if (options.focusNote) $('observationText').focus();
  });
}

$('copyCode').onclick = async () => {
  try { await navigator.clipboard.writeText($('displayCode').textContent); $('copyCode').textContent = 'Copiado'; }
  catch { setMessage('message', `Código de sesión: ${$('displayCode').textContent}`); }
};
$('observationText').addEventListener('input', () => { $('charCount').textContent = `${$('observationText').value.length} / 1000`; });
$('observationForm').onsubmit = event => {
  event.preventDefault();
  if (!selectedStudentId) return setMessage('teacherMessage', 'Selecciona primero a un estudiante.', true);
  socket.emit('teacher:add-observation', { token: teacherToken, studentId: selectedStudentId, text: $('observationText').value }, result => {
    if (!result.ok) return setMessage('teacherMessage', result.error, true);
    $('observationText').value = ''; $('charCount').textContent = '0 / 1000';
    setMessage('teacherMessage', 'Nota guardada temporalmente y enviada al estudiante.');
  });
};

function refreshStudentNotes() {
  socket.emit('student:get-observations', result => {
    if (!result.ok) return setMessage('exportStatus', result.error, true);
    studentNotes = result.observations;
    const list = $('studentNotes'); list.replaceChildren();
    if (!studentNotes.length) { const li = document.createElement('li'); li.textContent = 'Aún no hay observaciones escritas.'; li.className = 'muted'; list.append(li); }
    studentNotes.forEach(note => {
      const li = document.createElement('li'); li.className = 'note';
      const body = document.createElement('p'); body.textContent = note.text;
      const meta = document.createElement('small'); meta.textContent = new Date(note.createdAt).toLocaleString();
      li.append(body, meta); list.append(li);
    });
    const canExport = Boolean(window.APP_CONFIG?.allowNoteExport) && studentNotes.length > 0;
    $('copyNotes').disabled = !canExport; $('downloadNotes').disabled = !canExport;
  });
}
socket.on('student:observations-updated', () => { if (activeRole === 'student') refreshStudentNotes(); });
$('refreshNotes').onclick = refreshStudentNotes;
function notesAsText() { return studentNotes.map((n, i) => `${i + 1}. ${new Date(n.createdAt).toLocaleString()}\n${n.text}`).join('\n\n'); }
$('copyNotes').onclick = async () => {
  if (!window.APP_CONFIG?.allowNoteExport || !studentNotes.length) return;
  try { await navigator.clipboard.writeText(notesAsText()); setMessage('exportStatus', 'Notas copiadas al portapapeles. La copia queda fuera del control de la aplicación.'); }
  catch { setMessage('exportStatus', 'El navegador no permitió copiar las notas.', true); }
};
$('downloadNotes').onclick = () => {
  if (!window.APP_CONFIG?.allowNoteExport || !studentNotes.length) return;
  const blob = new Blob([notesAsText()], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = 'mis-observaciones.txt'; link.click(); URL.revokeObjectURL(url);
  setMessage('exportStatus', 'Archivo descargado. La copia queda fuera del control de la aplicación.');
};

$('startShare').onclick = async () => {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    return setMessage('studentScreenStatus', 'Este navegador no permite capturar pantalla en este contexto. Usa localhost o configura HTTPS para la dirección LAN.', true);
  }
  try {
    // La API exige una acción explícita del usuario; el navegador mostrará su diálogo de selección/autorización.
    studentStream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 12, max: 20 } }, audio: false });
    $('startShare').disabled = true; $('stopShare').disabled = false;
    $('studentScreenStatus').textContent = 'Captura autorizada. Registrando tu solicitud; no se envía video hasta que el docente te conceda acceso.';
    studentStream.getVideoTracks()[0].addEventListener('ended', stopStudentStream, { once: true });
    socket.emit('student:screen-ready', {}, result => {
      if (!result?.ok) return setMessage('studentScreenStatus', result?.error || 'No se pudo registrar la solicitud.', true);
      if (result.selected) $('studentScreenStatus').textContent = 'El docente te eligió directamente. Preparando la transmisión…';
      else $('studentScreenStatus').textContent = `Solicitud registrada. Posición actual: ${result.queue.findIndex(item => item.id === studentId) + 1}. Espera a que el docente te conceda acceso.`;
    });
  } catch (error) { setMessage('studentScreenStatus', error.name === 'NotAllowedError' ? 'No se autorizó la captura de pantalla.' : `No se pudo iniciar la captura: ${error.message}`, true); }
};
$('stopShare').onclick = stopStudentStream;
socket.on('screen:stop', () => {
  if (activeRole === 'student') {
    // Cerrar el peer corta el envío de paquetes de vídeo; conservamos la captura
    // autorizada para no pedir al alumno permiso otra vez en cada selección.
    studentHasSelection = false;
    cleanPeer(studentPeer); studentPeer = null;
    pendingStudentCandidates = [];
    $('studentScreenStatus').textContent = studentStream ? 'Transmisión detenida. La captura queda autorizada, pero no se envían datos hasta una nueva selección.' : 'No estás compartiendo pantalla.';
  }
});
socket.on('screen:student-stopped', () => { if (activeRole === 'teacher') stopTeacherView('El estudiante detuvo la captura de pantalla.'); });
socket.on('screen:cleared', () => { if (activeRole === 'teacher') { selectedStudentId = null; stopTeacherView('Proyección detenida. Elige una solicitud o selecciona directamente a un alumno.'); } });
$('stopPresentation').onclick = () => socket.emit('teacher:stop-presentation', { token: teacherToken }, result => {
  if (!result?.ok) setMessage('teacherMessage', result?.error || 'No se pudo detener la proyección.', true);
});
socket.on('screen:requested', () => {
  studentHasSelection = true;
  if (!studentStream) { $('studentScreenStatus').textContent = 'El docente te seleccionó, pero primero debes autorizar la captura de pantalla.'; return; }
  $('studentScreenStatus').textContent = 'El docente está revisando tu pantalla.';
});

socket.on('screen:selected', ({ studentId: targetId, alias, waitingForAuthorization }) => {
  stopTeacherView(waitingForAuthorization ? `Esperando que ${alias} autorice la captura en su equipo…` : `Conectando con la pantalla de ${alias}…`);
  if (!targetId) return;
  pendingTeacherCandidates = [];
  teacherPeer = new RTCPeerConnection(peerConfig);
  teacherPeer.addTransceiver('video', { direction: 'recvonly' });
  teacherPeer.ontrack = event => { $('screenVideo').srcObject = event.streams[0]; $('screenStatus').textContent = `Mostrando la pantalla de ${alias}.`; };
  teacherPeer.onicecandidate = event => { if (event.candidate) socket.emit('screen:signal', { to: targetId, candidate: event.candidate }); };
  teacherPeer.createOffer().then(offer => teacherPeer.setLocalDescription(offer)).then(() => {
    socket.emit('screen:signal', { to: targetId, description: teacherPeer.localDescription });
  }).catch(error => setMessage('teacherMessage', `No se pudo iniciar la revisión de pantalla: ${error.message}`, true));
});

socket.on('screen:signal', async ({ from, description, candidate }) => {
  if (activeRole === 'student') {
    try {
      if (description?.type === 'offer') {
        // Ignorar ofertas que hayan quedado en tránsito después de cambiar de alumno.
        // El servidor solo reenvía ofertas al alumno seleccionado. No depender de que
        // screen:requested llegue antes por otro socket evita una carrera entre eventos.
        if (!studentStream) return;
        studentHasSelection = true;
        // Los candidatos que llegaron antes de la oferta pertenecen a esta negociación;
        // screen:stop ya limpia los candidatos de la negociación anterior.
        cleanPeer(studentPeer); studentPeer = new RTCPeerConnection(peerConfig);
        studentStream.getTracks().forEach(track => studentPeer.addTrack(track, studentStream));
        studentPeer.onicecandidate = event => { if (event.candidate) socket.emit('screen:signal', { to: from, candidate: event.candidate }); };
        await studentPeer.setRemoteDescription(description);
        for (const queuedCandidate of pendingStudentCandidates) await studentPeer.addIceCandidate(queuedCandidate);
        pendingStudentCandidates = [];
        const answer = await studentPeer.createAnswer(); await studentPeer.setLocalDescription(answer);
        socket.emit('screen:signal', { to: from, description: studentPeer.localDescription });
      } else if (candidate && studentStream) {
        if (studentPeer?.remoteDescription) await studentPeer.addIceCandidate(candidate); else pendingStudentCandidates.push(candidate);
      }
    } catch (error) { setMessage('studentScreenStatus', `No se pudo transmitir la pantalla: ${error.message}`, true); }
  } else if (activeRole === 'teacher' && teacherPeer) {
    try {
      if (description?.type === 'answer') {
        await teacherPeer.setRemoteDescription(description);
        for (const queuedCandidate of pendingTeacherCandidates) await teacherPeer.addIceCandidate(queuedCandidate);
        pendingTeacherCandidates = [];
      } else if (candidate && teacherPeer.remoteDescription) await teacherPeer.addIceCandidate(candidate);
      else if (candidate) pendingTeacherCandidates.push(candidate);
    } catch (error) { setMessage('teacherMessage', `Error de conexión de pantalla: ${error.message}`, true); }
  }
});
$('fullscreen').onclick = async () => {
  const video = $('screenVideo');
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await (video.requestFullscreen ? video.requestFullscreen() : video.parentElement.requestFullscreen()); }
  catch (error) { setMessage('teacherMessage', `No se pudo activar pantalla completa: ${error.message}`, true); }
};

$('end').onclick = () => {
  if (!confirm('¿Finalizar la sesión? Todas las observaciones temporales se eliminarán.')) return;
  socket.emit('teacher:end-session', { token: teacherToken }, result => {
    if (!result.ok) return setMessage('teacherMessage', result.error, true);
    teacherToken = null; activeRole = null; selectedStudentId = null; stopTeacherView();
    hide('teacherView'); showRolePicker(); showNotice('Sesión finalizada. Se eliminó el estado temporal.');
  });
};
socket.on('session:ended', result => {
  if (!activeRole) return;
  const wasStudent = activeRole === 'student';
  activeRole = null; teacherToken = null; selectedStudentId = null;
  stopTeacherView(); stopStudentStream();
  hide('teacherView'); hide('studentView'); showRolePicker(); showNotice(result.message);
  if (wasStudent) { studentNotes = []; $('studentNotes').replaceChildren(); }
});
