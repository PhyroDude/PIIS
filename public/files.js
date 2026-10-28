'use strict';
// InterLAB v0.4.0: ninguna credencial se escribe en el DOM ni en almacenamiento persistente.
let fileToken = null;
let currentFiles = [];
let currentFileRole = null;
let fileTab = null;
let fileSearch = {teacher:'',student:''};
let fileSort = {teacher:{field:'date',direction:'desc'},student:{field:'date',direction:'desc'}};
let fileSelected = new Set();
let uploadItems = [];
let activeUploads = 0;
let activeRequests = new Set();
let teacherCapacityWarning = false;
const fileTabs = {
  teacher:[['mine','Mis archivos'],['students','Archivos de los alumnos']],
  student:[['teacher','Archivos del profesor'],['students','Archivos de los alumnos'],['mine','Mis archivos']]
};
const fmtDate = iso => new Date(iso).toLocaleString();
const filePrefix = () => currentFileRole === 'teacher' ? 'teacher' : 'student';
const fileStatus = (text,bad=false) => {if(!currentFileRole)return;setMessage(`${filePrefix()}FileStatus`,text,bad);};
function clearFileModule() {
  activeRequests.forEach(req => req.abort());activeRequests.clear();
  fileToken=null;currentFileRole=null;currentFiles=[];fileSelected.clear();
  uploadItems=[];activeUploads=0;teacherCapacityWarning=false;
  $('teacherSpaceWarning').classList.add('hidden');
}
async function filesRequest(route,{method='GET',body}={}) {
  if (!fileToken)throw Error('No hay una sesión de archivos activa.');
  const response = await fetch(`/api/files${route}`,{method,headers:{'Authorization':`Bearer ${fileToken}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
  const json=await response.json();
  if(!response.ok||!json.ok)throw Error(json.error||'La operación no pudo completarse.');
  return json;
}
function initializeFileModule(role) {
  currentFileRole=role;fileTab=role==='teacher'?'mine':'teacher';currentFiles=[];fileSelected.clear();
  uploadItems=[];activeUploads=0;fileSort[role]={field:'date',direction:'desc'};fileSearch[role]='';
  const prefix=filePrefix();
  $(`${prefix}FileSearch`).value='';$(`${prefix}Upload`).value='';
  const tabs=$(`${prefix}FileTabs`);tabs.replaceChildren();
  for(const [key,label] of fileTabs[role]) {
    const button=document.createElement('button');button.type='button';button.textContent=label;
    button.setAttribute('role','tab');button.onclick=()=>{fileTab=key;fileSelected.clear();renderFiles();};
    button.dataset.tab=key;tabs.append(button);
  }
  renderUploadItems();refreshFiles();
}
async function refreshFiles() {
  if(!fileToken)return;
  try {const response=await filesRequest('/');if(!fileToken)return;currentFiles=response.files;renderFiles();}
  catch(error){fileStatus(error.message,true);}
}
function visibleFiles() {
  if(!currentFileRole)return [];
  const role=currentFileRole;
  let files=currentFiles.filter(f => fileTab==='mine' ? f.own : (fileTab==='teacher' ? f.role==='teacher' : f.role==='student'));
  if(fileTab==='students'){
    const prefix=fileSearch[role].trim().toLocaleLowerCase();
    files=files.filter(f=>f.name.toLocaleLowerCase().startsWith(prefix));
    const {field,direction}=fileSort[role];
    files.sort((a,b)=>{
      const compare=field==='date' ? a.createdAt.localeCompare(b.createdAt) : (field==='name'?a.name:a.alias).localeCompare(field==='name'?b.name:b.alias,'es',{sensitivity:'base',numeric:true});
      return direction==='desc'?-compare:compare;
    });
  }else files.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  return files;
}
function renderFiles() {
  if(!currentFileRole)return;
  const role=currentFileRole;const prefix=filePrefix();
  [...$(`${prefix}FileTabs`).children].forEach(btn=>btn.setAttribute('aria-selected',String(btn.dataset.tab===fileTab)));
  $(`${prefix}FileFilters`).classList.toggle('hidden',fileTab!=='students');
  const container=$(`${prefix}FileList`);container.replaceChildren();
  const files=visibleFiles();
  if(!files.length){
    if(fileTab==='students'&&fileSearch[role]){
      const table=document.createElement('table');table.className='file-table';
      const row=table.insertRow();const cell=row.insertCell();cell.colSpan=6;cell.className='file-empty';cell.textContent='No existen coincidencias';container.append(table);
    } else {const p=document.createElement('p');p.className='file-empty';p.textContent='No hay archivos en esta sección.';container.append(p);}
  }
  else {
    const table=document.createElement('table');table.className='file-table';
    const thead=document.createElement('thead');const header=document.createElement('tr');
    const columns=['','Tipo','Nombre',...(fileTab==='students'?['Alias']:[]),'Fecha y hora','Acciones'];
    columns.forEach(col=>{const th=document.createElement('th');th.textContent=col;header.append(th);});thead.append(header);table.append(thead);
    const tbody=document.createElement('tbody');
    for(const file of files){
      const tr=document.createElement('tr');
      const selection=document.createElement('td');const check=document.createElement('input');check.type='checkbox';check.checked=fileSelected.has(file.id);check.setAttribute('aria-label',`Seleccionar ${file.name}`);
      check.onchange=()=>{if(check.checked)fileSelected.add(file.id);else fileSelected.delete(file.id);setZipState();};selection.append(check);tr.append(selection);
      const icon=document.createElement('td');icon.className='file-icon';icon.textContent=/\.zip$/i.test(file.name)?'▤':'▣';tr.append(icon);
      const name=document.createElement('td');name.textContent=file.name;tr.append(name);
      if(fileTab==='students'){const alias=document.createElement('td');alias.textContent=file.alias;tr.append(alias);}
      const date=document.createElement('td');date.textContent=fmtDate(file.createdAt);tr.append(date);
      const actions=document.createElement('td');const group=document.createElement('div');group.className='actions';
      const download=document.createElement('button');download.type='button';download.className='secondary';download.textContent='Descargar';download.onclick=()=>downloadFiles([file.id]);group.append(download);
      if(role==='teacher'||file.own){const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='Eliminar';remove.onclick=()=>deleteFile(file);group.append(remove);}
      actions.append(group);tr.append(actions);tbody.append(tr);
    }table.append(tbody);container.append(table);
  }
  const presentIds=new Set(files.map(f=>f.id));fileSelected=new Set([...fileSelected].filter(id=>presentIds.has(id)));
  setZipState();
  $(`${prefix}FileFilters`).querySelectorAll('[data-file-sort]').forEach(btn=>{
    const {field,direction}=fileSort[role];
    btn.setAttribute('aria-pressed',String(btn.dataset.fileSort===field));
    if(btn.dataset.fileSort===field)btn.textContent=`${field==='date'?'Fecha':field==='name'?'Nombre':'Alias'}: ${field==='date'?(direction==='desc'?'más recientes':'más antiguos'):(direction==='desc'?'Z→A':'A→Z')}`;
    else btn.textContent=btn.dataset.fileSort==='date'?'Fecha':btn.dataset.fileSort==='name'?'Nombre':'Alias';
  });
}
function setZipState() {if(currentFileRole)$(`${filePrefix()}Zip`).disabled=fileSelected.size<2;}
async function downloadFiles(ids) {
  try {
    const result = await filesRequest('/tickets', {
      method: 'POST',
      body: { ids }
    });

    // Iniciar la descarga sin navegar fuera de InterLAB.
    const iframe = document.createElement('iframe');

    iframe.style.display = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.src = result.url;

    document.body.appendChild(iframe);

    fileStatus(
      ids.length === 1
        ? 'Descarga iniciada en el navegador.'
        : 'El navegador inició la descarga ZIP.'
    );

  } catch (error) {
    fileStatus(error.message, true);
  }
}
async function deleteFile(file) {
  if(!confirm(`¿Eliminar «${file.name}» de esta sesión?`))return;
  try{await filesRequest(`/${encodeURIComponent(file.id)}`,{method:'DELETE'});fileSelected.delete(file.id);await refreshFiles();fileStatus('Archivo eliminado de la sesión.');}
  catch(error){fileStatus(error.message,true);}
}
function createUploadItem(file){const item={id:Math.random().toString(36).slice(2),file,state:'pending',progress:0,error:'',batchId:null,fileId:null};uploadItems.push(item);return item;}
async function enqueueSelection(files) {
  if(!fileToken)return;
  const selection=Array.from(files);
  if(!selection.length)return fileStatus('Selecciona archivos primero.',true);
  const total=selection.reduce((n,f)=>n+f.size,0);
  if(total>200_000_000)return fileStatus('La selección supera 200 MB. Ningún archivo fue enviado.',true);
  const accepted=[];
  for(const file of selection){const item=createUploadItem(file);if(file.size>50_000_000){item.state='failed';item.error='Supera los 50 MB';}else accepted.push(item);}
  renderUploadItems();
  if(!accepted.length)return;
  try{
    const result=await filesRequest('/batches',{method:'POST',body:{files:accepted.map(item=>({name:item.file.name,size:item.file.size}))}});
    accepted.forEach((item,i)=>{item.batchId=result.batchId;item.fileId=result.files[i].id;});
    pumpUploads();
  }catch(error){accepted.forEach(item=>{item.state='failed';item.error=error.message;});renderUploadItems();fileStatus(error.message,true);}
}
async function retryUpload(item){
  item.state='reserving';item.error='';item.progress=0;renderUploadItems();
  try{const batch=await filesRequest('/batches',{method:'POST',body:{files:[{name:item.file.name,size:item.file.size}]}});
    item.batchId=batch.batchId;item.fileId=batch.files[0].id;item.state='pending';pumpUploads();
  }catch(error){item.state='failed';item.error=error.message;renderUploadItems();fileStatus(error.message,true);}
}
function pumpUploads() {
  if(!fileToken)return;
  while(activeUploads<2){const item=uploadItems.find(item=>item.state==='pending'&&item.batchId);if(!item)break;startUpload(item);}
  renderUploadItems();
}
function startUpload(item){
  item.state='uploading';activeUploads++;
  const xhr=new XMLHttpRequest();activeRequests.add(xhr);
  const bearer=fileToken;
  xhr.open('PUT',`/api/files/batches/${encodeURIComponent(item.batchId)}/${encodeURIComponent(item.fileId)}`);
  xhr.setRequestHeader('Authorization',`Bearer ${bearer}`);
  xhr.setRequestHeader('Content-Type','application/octet-stream');
  xhr.upload.onprogress=event=>{if(event.lengthComputable){item.progress=Math.round(100*event.loaded/event.total);renderUploadItems();}};
  xhr.onload=()=>{
    let payload={};try{payload=JSON.parse(xhr.responseText);}catch{}
    if(xhr.status>=200&&xhr.status<300&&payload.ok){item.state='done';item.progress=100;setTimeout(()=>{if(item.state==='done'){uploadItems=uploadItems.filter(i=>i!==item);renderUploadItems();}},3500);refreshFiles();}
    else{item.state='failed';item.error=payload.error||`Error HTTP ${xhr.status}`;fileStatus(item.error,true);}
    finish();
  };
  xhr.onerror=()=>{item.state='failed';item.error='Conexión interrumpida. Reintenta desde cero.';finish();};
  xhr.onabort=()=>{item.state='failed';item.error='La sesión terminó.';finish();};
  let finished=false;
  function finish(){if(finished)return;finished=true;activeRequests.delete(xhr);activeUploads=Math.max(0,activeUploads-1);renderUploadItems();pumpUploads();}
  try{xhr.send(item.file);}catch(error){item.state='failed';item.error=error.message;finish();}
}
function renderUploadItems(){
  if(!currentFileRole)return;
  const container=$(`${filePrefix()}UploadQueue`);container.replaceChildren();
  for(const item of uploadItems){const row=document.createElement('div');row.className='upload-item';
    const name=document.createElement('strong');name.textContent=item.file.name;row.append(name);
    const status=document.createElement('span');status.textContent=item.state==='done'?'Completado':item.state==='uploading'?`Subiendo ${item.progress}%`:item.state==='pending'?'En cola':item.state==='reserving'?'Preparando…':item.error||'Error';row.append(status);
    if(item.state==='uploading'){const progress=document.createElement('progress');progress.max=100;progress.value=item.progress;row.append(progress);}
    if(item.state==='failed'){const buttons=document.createElement('div');buttons.className='actions';
      const retry=document.createElement('button');retry.className='secondary';retry.type='button';retry.textContent='Reintentar';retry.onclick=()=>retryUpload(item);
      const dismiss=document.createElement('button');dismiss.className='secondary';dismiss.type='button';dismiss.textContent='Eliminar de la cola';dismiss.onclick=()=>{uploadItems=uploadItems.filter(i=>i!==item);renderUploadItems();};
      buttons.append(retry,dismiss);row.append(buttons);
    }container.append(row);
  }
}
for(const role of ['teacher','student']){
  const prefix=role;
  $(`${prefix}UploadButton`).onclick=()=>{if(currentFileRole!==role)return;enqueueSelection($(`${prefix}Upload`).files);$(`${prefix}Upload`).value='';};
  $(`${prefix}FileSearch`).oninput=event=>{fileSearch[role]=event.target.value;renderFiles();};
  $(`${prefix}Zip`).onclick=()=>{if(fileSelected.size>1)downloadFiles([...fileSelected]);};
  $(`${prefix}FileFilters`).querySelectorAll('[data-file-sort]').forEach(button=>{
    button.onclick=()=>{const field=button.dataset.fileSort;const previous=fileSort[role];fileSort[role]={field,direction:previous.field===field?(previous.direction==='desc'?'asc':'desc'):(field==='date'?'desc':'desc')};renderFiles();};
  });
}
socket.on('files:changed',()=>{if(fileToken)refreshFiles();});
socket.on('files:capacity-alert',({warning})=>{teacherCapacityWarning=Boolean(warning);$('teacherSpaceWarning').classList.toggle('hidden',!teacherCapacityWarning);});
