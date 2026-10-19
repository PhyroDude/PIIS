const socket = io();
const $ = id => document.getElementById(id);

let teacherToken = null;
let activeRole = null;
let studentId = null;
let screenStream = null;
let teacherPeer = null;
let studentPeer = null;
let selectedStudentId = null;
let pendingTeacherSocketId = null;
let pendingOffer = null;
let pendingIce = [];

function show(id) { $(id).classList.remove("hidden"); }
function hide(id) { $(id).classList.add("hidden"); }
function message(text, error = false) {
  $("message").textContent = text;
  $("message").classList.toggle("error", error);
}
function closePeer(peer) {
  if (peer) peer.close();
  return null;
}
function stopScreenStream() {
  if (screenStream) screenStream.getTracks().forEach(track => track.stop());
  screenStream = null;
  $("screenStatus").textContent = "Captura de pantalla no autorizada";
  $("startScreen").disabled = false;
  $("stopScreen").disabled = true;
  socket.emit("student:screen-ready", { ready: false });
}
function resetScreenConnections() {
  teacherPeer = closePeer(teacherPeer);
  studentPeer = closePeer(studentPeer);
  pendingIce = [];
  pendingTeacherSocketId = null;
  pendingOffer = null;
  selectedStudentId = null;
  const video = $("screenVideo");
  if (video) video.srcObject = null;
  const status = $("screenViewStatus");
  if (status) status.textContent = "Selecciona un estudiante autorizado para iniciar la revisión.";
}
function createPeerConnection() {
  // Sin servidores STUN/TURN: el MVP está pensado para equipos dentro de la misma LAN.
  const pc = new RTCPeerConnection();
  pc.onicecandidate = event => {
    if (event.candidate) socket.emit("rtc:ice", {
      targetRole: activeRole === "teacher" ? "student" : "teacher",
      candidate: event.candidate
    });
  };
  pc.onconnectionstatechange = () => {
    if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
      const status = $("screenViewStatus");
      if (status && activeRole === "teacher") status.textContent = `Conexión: ${pc.connectionState}`;
    }
  };
  return pc;
}

socket.on("connect", () => { $("connection").textContent = "Conectado"; });
socket.on("disconnect", () => { $("connection").textContent = "Conexión interrumpida"; });

$("teacherChoice").onclick = () => { show("teacherForm"); hide("studentForm"); message(""); };
$("studentChoice").onclick = () => { show("studentForm"); hide("teacherForm"); message(""); };

$("teacherForm").onsubmit = event => {
  event.preventDefault();
  socket.emit("teacher:create-session", result => {
    if (!result.ok) return message(result.error, true);
    activeRole = "teacher";
    teacherToken = result.token;
    $("displayCode").textContent = result.code;
    hide("roles");
    show("teacherView");
  });
};

$("studentForm").onsubmit = event => {
  event.preventDefault();
  socket.emit("student:join", { code: $("code").value, alias: $("alias").value }, result => {
    if (!result.ok) return message(result.error, true);
    activeRole = "student";
    studentId = result.studentId;
    $("joinedAlias").textContent = result.alias;
    hide("roles");
    show("studentView");
    $("screenStatus").textContent = "Aún no has autorizado la captura de pantalla.";
  });
};

socket.on("participants:update", participants => {
  $("count").textContent = `${participants.length} / 30`;
  const list = $("participants");
  list.replaceChildren();
  if (!participants.length) {
    const item = document.createElement("li");
    item.textContent = "Esperando estudiantes…";
    item.className = "muted";
    list.append(item);
    return;
  }
  participants.forEach((participant, index) => {
    const item = document.createElement("li");
    item.className = "participant";
    const info = document.createElement("div");
    info.className = "participantInfo";
    const name = document.createElement("strong");
    name.textContent = `${String(index + 1).padStart(2, "0")}  ${participant.alias}`;
    const status = document.createElement("span");
    status.className = "muted";
    status.textContent = participant.screenReady ? "Captura autorizada" : "Sin autorización de pantalla";
    info.append(name, status);
    item.append(info);
    const select = document.createElement("button");
    select.className = "selectStudent";
    select.textContent = participant.selected ? "Seleccionado" : "Revisar pantalla";
    select.disabled = !participant.screenReady;
    select.onclick = () => selectStudent(participant.id);
    item.append(select);
    list.append(item);
  });
});

async function selectStudent(id) {
  resetScreenConnections();
  socket.emit("teacher:select-student", { token: teacherToken, studentId: id }, async result => {
    if (!result.ok) {
      $("screenViewStatus").textContent = result.error;
      return;
    }
    selectedStudentId = id;
    $("screenViewStatus").textContent = `Conectando con ${result.alias}…`;
    teacherPeer = createPeerConnection();
    teacherPeer.addTransceiver("video", { direction: "recvonly" });
    teacherPeer.ontrack = event => {
      $("screenVideo").srcObject = event.streams[0];
      $("screenViewStatus").textContent = `Visualizando la pantalla de ${result.alias}.`;
    };
    try {
      const offer = await teacherPeer.createOffer();
      await teacherPeer.setLocalDescription(offer);
      socket.emit("rtc:offer", { token: teacherToken, studentId: id, offer: teacherPeer.localDescription }, response => {
        if (response && !response.ok) $("screenViewStatus").textContent = response.error;
      });
    } catch (error) {
      $("screenViewStatus").textContent = `No se pudo iniciar la transmisión: ${error.message}`;
    }
  });
}

$("copy").onclick = async () => {
  try {
    await navigator.clipboard.writeText($("displayCode").textContent);
    $("copy").textContent = "Copiado";
  } catch {
    message("Código de sesión: " + $("displayCode").textContent);
  }
};

$("fullscreenProjection").onclick = async () => {
  const projection = $("screenPanel");
  try {
    if (document.fullscreenElement === projection) {
      await document.exitFullscreen();
    } else if (projection.requestFullscreen) {
      await projection.requestFullscreen();
    } else {
      $("screenViewStatus").textContent = "Este navegador no permite activar pantalla completa.";
    }
  } catch (error) {
    $("screenViewStatus").textContent = `No se pudo activar pantalla completa: ${error.message}`;
  }
};

document.addEventListener("fullscreenchange", () => {
  const button = $("fullscreenProjection");
  if (button) button.textContent = document.fullscreenElement === $("screenPanel")
    ? "Salir de pantalla completa"
    : "Proyectar en pantalla completa";
});

$("stopViewing").onclick = () => {
  socket.emit("teacher:stop-screen", { token: teacherToken }, result => {
    if (!result.ok) return $("screenViewStatus").textContent = result.error;
    resetScreenConnections();
  });
};

$("startScreen").onclick = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    $("screenStatus").textContent = "Este navegador no permite capturar pantalla en este contexto. Usa HTTPS o localhost y un navegador compatible.";
    return;
  }
  try {
    // This call must follow a direct user gesture; the browser displays its own permission picker.
    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 15, max: 20 } }, audio: false });
    $("screenStatus").textContent = "Captura autorizada. Tu pantalla solo se transmitirá cuando el docente te seleccione.";
    $("startScreen").disabled = true;
    $("stopScreen").disabled = false;
    socket.emit("student:screen-ready", { ready: true });
    screenStream.getVideoTracks()[0].addEventListener("ended", () => {
      if (screenStream) stopScreenStream();
    }, { once: true });
  } catch (error) {
    $("screenStatus").textContent = error.name === "NotAllowedError"
      ? "No se concedió el permiso. Puedes intentarlo de nuevo cuando estés listo."
      : `No se pudo capturar la pantalla: ${error.message}`;
  }
};

$("stopScreen").onclick = () => {
  stopScreenStream();
  resetScreenConnections();
};

socket.on("screen:selected", ({ teacherSocketId }) => {
  if (activeRole !== "student" || !screenStream) return;
  studentPeer = closePeer(studentPeer);
  pendingIce = [];
  pendingTeacherSocketId = teacherSocketId;
  studentPeer = createPeerConnection();
  screenStream.getTracks().forEach(track => studentPeer.addTrack(track, screenStream));
  $("screenStatus").textContent = "El docente te seleccionó. Estableciendo conexión dentro de la red local…";
  if (pendingOffer && pendingOffer.teacherSocketId === teacherSocketId) {
    const offer = pendingOffer;
    pendingOffer = null;
    acceptStudentOffer(offer.teacherSocketId, offer.offer);
  }
});

async function acceptStudentOffer(teacherSocketId, offer) {
  if (activeRole !== "student" || !studentPeer || teacherSocketId !== pendingTeacherSocketId) return;
  try {
    await studentPeer.setRemoteDescription(offer);
    const answer = await studentPeer.createAnswer();
    await studentPeer.setLocalDescription(answer);
    socket.emit("rtc:answer", { teacherSocketId, answer: studentPeer.localDescription });
    for (const candidate of pendingIce) await studentPeer.addIceCandidate(candidate).catch(() => {});
    pendingIce = [];
    $("screenStatus").textContent = "Tu pantalla está siendo transmitida al docente seleccionado.";
  } catch (error) {
    $("screenStatus").textContent = `Error de conexión: ${error.message}`;
  }
}

socket.on("rtc:offer", ({ teacherSocketId, offer }) => {
  if (activeRole !== "student") return;
  if (!studentPeer || teacherSocketId !== pendingTeacherSocketId) {
    pendingOffer = { teacherSocketId, offer };
    return;
  }
  acceptStudentOffer(teacherSocketId, offer);
});

socket.on("rtc:answer", async ({ studentSocketId: fromStudent, answer }) => {
  if (activeRole !== "teacher" || !teacherPeer || !selectedStudentId) return;
  try {
    await teacherPeer.setRemoteDescription(answer);
    for (const candidate of pendingIce) await teacherPeer.addIceCandidate(candidate).catch(() => {});
    pendingIce = [];
  } catch (error) {
    $("screenViewStatus").textContent = `Error al establecer la conexión: ${error.message}`;
  }
});

socket.on("rtc:ice", async ({ candidate }) => {
  const peer = activeRole === "teacher" ? teacherPeer : studentPeer;
  if (!peer || !peer.remoteDescription) {
    pendingIce.push(candidate);
    return;
  }
  try { await peer.addIceCandidate(candidate); } catch { /* Ignore stale candidates from a closed peer connection. */ }
});

socket.on("screen:deselected", () => {
  studentPeer = closePeer(studentPeer);
  pendingIce = [];
  pendingOffer = null;
  pendingTeacherSocketId = null;
});

socket.on("screen:stopped", () => {
  resetScreenConnections();
});

$("end").onclick = () => {
  if (!confirm("¿Finalizar la sesión?")) return;
  socket.emit("teacher:end-session", { token: teacherToken }, result => {
    if (!result.ok) return message(result.error, true);
    teacherToken = null;
    activeRole = null;
    resetScreenConnections();
    hide("teacherView");
    show("roles");
    show("notice");
    $("notice").textContent = "Sesión finalizada. Se eliminó el estado temporal.";
  });
};

socket.on("session:ended", result => {
  if (!activeRole) return;
  activeRole = null;
  teacherToken = null;
  resetScreenConnections();
  if (screenStream) stopScreenStream();
  hide("teacherView");
  hide("studentView");
  show("roles");
  show("notice");
  $("notice").textContent = result.message;
});
