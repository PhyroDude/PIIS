'use strict';
const crypto = require('node:crypto');
const ALPHABET = '123456789';
const MAX_STUDENTS = 30;
const MAX_NOTE_LENGTH = 1000;
const TEACHER_RECONNECT_MS = 90_000;
function makeCode() { return Array.from({length:4},()=>ALPHABET[crypto.randomInt(ALPHABET.length)]).join(''); }
function makeToken() { return crypto.randomBytes(32).toString('hex'); }
function digest(value) { return crypto.createHash('sha256').update(value).digest(); }
function equalCredential(cookie, hash) {
  return Boolean(typeof cookie==='string' && /^[a-f0-9]{64}$/.test(cookie) && hash && crypto.timingSafeEqual(digest(cookie),hash));
}

// La titularidad del docente, la conexión Socket.IO y la sesión son entidades separadas.
// Los secretos de cookies no se conservan en texto claro dentro del almacén.
class SessionStore {
  constructor() { this.session=null; this.roles=new Map(); this.teacherLease=null; }
  claimTeacher(cookie, now=Date.now()) {
    this.expireTeacher(now);
    if (this.teacherLease) {
      if (!equalCredential(cookie,this.teacherLease.hash)) return {ok:false,error:'El control docente ya está asignado a otro navegador.'};
      return {ok:true,existing:true};
    }
    const credential=makeToken();
    this.teacherLease={hash:digest(credential),socketId:null,expiresAt:now+TEACHER_RECONNECT_MS,state:'reserved'};
    return {ok:true,existing:false,credential};
  }
  attachTeacher(socketId,cookie,now=Date.now()) {
    this.expireTeacher(now);
    if (!this.teacherLease || !equalCredential(cookie,this.teacherLease.hash)) return {ok:false,error:'Acceso docente no autorizado.'};
    const former=this.teacherLease.socketId;
    if (former && former!==socketId) this.roles.delete(former);
    this.teacherLease.socketId=socketId;
    this.teacherLease.state='connected';
    this.teacherLease.expiresAt=null;
    this.roles.set(socketId,{role:'teacher',sid:this.session?.id ?? null});
    if (this.session) {
      this.session.teacher=socketId;
      this.session.teacherCaptureReady=false; // un MediaStream no sobrevive a una pestaña destruida
    }
    return {ok:true,replacedSocketId:former && former!==socketId?former:null,session:this.session ? {
      code:this.session.code,token:this.session.token,participants:this.roster(),queue:this.presentationQueueRoster()
    }:null};
  }
  teacherConnected() { return Boolean(this.teacherLease?.state==='connected' && this.teacherLease.socketId && this.roles.has(this.teacherLease.socketId)); }
  teacherStatus(now=Date.now()) {
    if (!this.teacherLease) return {state:this.session?'expired':'unassigned',expiresAt:null};
    if (this.teacherLease.state==='waiting' && this.teacherLease.expiresAt <= now) return {state:'expired',expiresAt:this.teacherLease.expiresAt};
    return {state:this.teacherLease.state,expiresAt:this.teacherLease.expiresAt};
  }
  disconnectTeacher(socketId,now=Date.now()) {
    if (this.teacherLease?.socketId !== socketId) return false;
    this.teacherLease.socketId=null;
    this.roles.delete(socketId);
    if (this.session) {
      this.session.teacher=null;this.session.teacherCaptureReady=false;
      this.teacherLease.state='waiting';this.teacherLease.expiresAt=now+TEACHER_RECONNECT_MS;
    } else this.teacherLease=null;
    return true;
  }
  expireTeacher(now=Date.now()) {
    if (!['waiting','reserved'].includes(this.teacherLease?.state) || this.teacherLease.expiresAt>now) return false;
    this.teacherLease=null;
    if (this.session) {
      this.session.teacher=null;this.session.teacherCaptureReady=false;
      this.session.token=makeToken(); // Revocar credenciales administrativas del titular anterior.
      // Conservar como solicitud pendiente una selección que nunca llegó a ser
      // autorizada: no puede iniciar WebRTC cuando ya no hay docente.
      const selected=this.session.selectedStudent;
      if(selected&&!this.session.screenReady.has(selected)) {
        this.session.selectedStudent=null;this.session.epoch++;
        if(this.session.students.has(selected)&&!this.session.presentationQueue.includes(selected))this.session.presentationQueue.unshift(selected);
      }
    }
    return true;
  }
  releaseTeacher() {
    const previous=this.teacherLease?.socketId || null;
    if (previous) this.roles.delete(previous);
    this.teacherLease=null;
    if (this.session) {this.session.teacher=null;this.session.teacherCaptureReady=false;this.session.token=makeToken();}
    return previous;
  }
  createSession(teacherSocketId) {
    if (this.session) return {ok:false,error:'Ya existe una sesión activa.'};
    if (!this.teacherConnected() || this.teacherLease.socketId!==teacherSocketId) return {ok:false,error:'Docente no autorizado.'};
    this.session={id:crypto.randomUUID(),code:makeCode(),teacher:teacherSocketId,token:makeToken(),students:new Map(),observations:[],selectedStudent:null,presentationQueue:[],screenReady:new Set(),teacherCaptureReady:false,epoch:0};
    this.roles.set(teacherSocketId,{role:'teacher',sid:this.session.id});
    return {ok:true,code:this.session.code,token:this.session.token};
  }
  joinStudent(socketId,code,alias) {
    const normalizedCode=String(code||'').trim();const normalizedAlias=String(alias||'').trim().slice(0,32);
    if (!this.session || normalizedCode!==this.session.code) return {ok:false,error:'Código incorrecto o sesión inactiva.'};
    if (!normalizedAlias) return {ok:false,error:'Escribe un alias.'};
    if (this.session.students.size>=MAX_STUDENTS) return {ok:false,error:'La sesión está llena (30 estudiantes).'};
    if ([...this.session.students.values()].some(s=>s.alias.toLowerCase()===normalizedAlias.toLowerCase())) return {ok:false,error:'Ese alias ya está en uso.'};
    const student={id:socketId,alias:normalizedAlias,fileToken:makeToken()};
    this.session.students.set(socketId,student);this.roles.set(socketId,{role:'student',sid:this.session.id});
    return {ok:true,alias:normalizedAlias,studentId:socketId,fileToken:student.fileToken};
  }
  roster() {return this.session?[...this.session.students.values()].map(({id,alias})=>({id,alias})):[];}
  presentationQueueRoster() {return this.session?this.session.presentationQueue.filter(id=>this.session.students.has(id)).map((id,i)=>({id,alias:this.session.students.get(id).alias,position:i+1})):[];}
  requestStudent(socketId) {
    if (!this.isStudentInSession(socketId))return {ok:false,error:'Permiso denegado.'};
    if (this.session.selectedStudent===socketId) return {ok:true,selected:true,queue:this.presentationQueueRoster()};
    if (!this.session.presentationQueue.includes(socketId))this.session.presentationQueue.push(socketId);
    return {ok:true,selected:false,queue:this.presentationQueueRoster()};
  }
  rejectStudentRequest(studentId) {
    if(!this.session?.students.has(studentId))return {ok:false,error:'El estudiante ya no está en la sesión.'};
    if(!this.session.presentationQueue.includes(studentId))return {ok:false,error:'No hay solicitud pendiente.'};
    this.session.presentationQueue=this.session.presentationQueue.filter(id=>id!==studentId);
    return {ok:true,queue:this.presentationQueueRoster()};
  }
  // Se emite *después* de un gesto de usuario y de getDisplayMedia.
  markScreenReady(socketId) {
    if (!this.isStudentInSession(socketId)||this.session.selectedStudent!==socketId||!this.teacherConnected()) return {ok:false,error:'No existe autorización docente vigente para transmitir.'};
    if(!this.session.screenReady.has(socketId)){this.session.screenReady.add(socketId);this.session.epoch++;}
    return {ok:true,selected:true};
  }
  markTeacherReady(socketId) {
    if (!this.teacherConnected()||this.session?.teacher!==socketId)return {ok:false,error:'Sin permiso docente.'};
    this.session.teacherCaptureReady=true;return {ok:true};
  }
  selectStudent(studentId) {
    if (!this.teacherConnected())return {ok:false,error:'No hay un docente disponible.'};
    if (!this.session?.students.has(studentId))return {ok:false,error:'El estudiante ya no está en la sesión.'};
    const session=this.session,previousStudent=session.selectedStudent;
    const previousWasActive=Boolean(previousStudent&&session.screenReady.has(previousStudent));
    session.presentationQueue=session.presentationQueue.filter(id=>id!==studentId);
    if(previousStudent)session.screenReady.delete(previousStudent);
    session.selectedStudent=studentId;session.screenReady.delete(studentId);
    if(previousWasActive)session.epoch++;
    return {ok:true,previousStudent,student:{...session.students.get(studentId)},ready:false,queue:this.presentationQueueRoster()};
  }
  stopStudentPresentation(socketId) {
    if (!this.session) return {ok:false};
    const s=this.session,wasSelected=s.selectedStudent===socketId;
    const wasActive=wasSelected&&s.screenReady.has(socketId);
    s.presentationQueue=s.presentationQueue.filter(id=>id!==socketId);s.screenReady.delete(socketId);
    if(wasSelected){s.selectedStudent=null;if(wasActive)s.epoch++;}
    return {ok:true,wasSelected,queue:this.presentationQueueRoster()};
  }
  activeSource() {
    const s=this.session;
    if (!s) return {kind:'waiting',epoch:0};
    if (s.selectedStudent && s.screenReady.has(s.selectedStudent) && s.students.has(s.selectedStudent)) return {kind:'student',id:s.selectedStudent,epoch:s.epoch};
    if (this.teacherConnected() && s.teacherCaptureReady) return {kind:'teacher',id:s.teacher,epoch:s.epoch};
    return {kind:'waiting',epoch:s.epoch};
  }
  authorizeTeacher(socketId,token) {return Boolean(this.session&&this.teacherConnected()&&this.session.teacher===socketId&&this.roles.get(socketId)?.role==='teacher'&&token===this.session.token);}
  fileActor(token) {
    if (!this.session||typeof token!=='string')return null;
    if (token===this.session.token && this.teacherConnected())return {role:'teacher',id:'teacher',alias:'Docente',sessionId:this.session.id};
    for(const s of this.session.students.values()) if(token===s.fileToken&&this.isStudentInSession(s.id))return {role:'student',id:s.id,alias:s.alias,sessionId:this.session.id};
    return null;
  }
  getRole(socketId) {return this.roles.get(socketId)||null;}
  isStudentInSession(socketId) {return Boolean(this.session?.students.has(socketId)&&this.roles.get(socketId)?.sid===this.session.id);}
  addObservation(socketId,token,studentId,text) {
    if (!this.authorizeTeacher(socketId,token))return {ok:false,error:'Permiso denegado.'};
    if (!this.session.students.has(studentId))return {ok:false,error:'El estudiante ya no pertenece a la sesión.'};
    const content=String(text||'').trim();if(!content)return {ok:false,error:'Escribe una observación.'};
    if(content.length>MAX_NOTE_LENGTH)return {ok:false,error:`La observación no puede superar ${MAX_NOTE_LENGTH} caracteres.`};
    const observation={id:crypto.randomUUID(),studentId,studentAlias:this.session.students.get(studentId).alias,text:content,createdAt:new Date().toISOString(),visibility:'individual'};
    this.session.observations.push(observation);return {ok:true,observation};
  }
  observationsForStudent(socketId) {return this.isStudentInSession(socketId)?{ok:true,observations:this.session.observations.filter(o=>o.studentId===socketId).map(o=>({...o}))}:{ok:false,error:'Permiso denegado.'};}
  removeSocket(socketId) {
    const role=this.roles.get(socketId);this.roles.delete(socketId);
    if (!role||role.role==='teacher')return {changed:false,ended:false};
    if (!this.session||role.sid!==this.session.id)return {changed:false,ended:false};
    this.session.students.delete(socketId);this.session.presentationQueue=this.session.presentationQueue.filter(id=>id!==socketId);
    const wasActive=this.session.selectedStudent===socketId&&this.session.screenReady.has(socketId);
    this.session.screenReady.delete(socketId);
    this.session.observations=this.session.observations.filter(o=>o.studentId!==socketId);
    const wasSelected=this.session.selectedStudent===socketId;
    if(wasSelected){this.session.selectedStudent=null;if(wasActive)this.session.epoch++;}
    return {changed:true,ended:false,wasSelected};
  }
  endSession() {
    if(!this.session)return false;
    const sid=this.session.id;for(const [id,role] of this.roles)if(role.sid===sid)this.roles.delete(id);
    this.session=null;this.teacherLease=null;return true;
  }
}
module.exports={SessionStore,MAX_STUDENTS,MAX_NOTE_LENGTH,TEACHER_RECONNECT_MS};
