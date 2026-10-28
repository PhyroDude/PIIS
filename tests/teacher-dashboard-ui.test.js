'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../public/styles.css'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8');

test('la interfaz docente dispone el panel derecho desde la altura de los controles',()=>{
  assert.match(html,/<div class="dashboard-stage">\s*<div class="dashboard-left">/);
  assert.match(html,/<section class="dashboard-card participants-card"/);
  assert.match(css,/\.teacher-dashboard \.dashboard-stage\{display:grid;grid-template-columns:/);
  assert.match(css,/\.teacher-dashboard \.participants-card\{display:flex/);
});
test('se conservan los controles y IDs conectados al módulo de archivos y proyección',()=>{
  const ids=['teacherView','teacherShareActive','stopPresentation','displayCode','copyCode','count',
    'participants','presentationQueue','queueCount','teacherFeedback','observationForm',
    'selectedAlias','observationText','teacherMessage','teacherUpload','teacherUploadButton',
    'teacherFileTabs','teacherFileFilters','teacherFileSearch','teacherFileList','teacherZip',
    'teacherUploadQueue','teacherFileStatus','teacherSpaceWarning','screenStatus','screenVideo','fullscreen','end'];
  for(const id of ids){
    assert.match(html,new RegExp(`id="${id}"`),`no debe perderse #${id}`);
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,`#${id} debe ser único`);
  }
});
test('los filtros son locales al docente y se conserva restricción para teléfonos',()=>{
  for(const id of ['teacherParticipantSearch','teacherQueueSearch','teacherParticipantSort','selectedProjectionRequest','selectedNoteButton'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(js,/selectedPerson\.isPhone===true/);
  assert.match(js,/person\.isPhone===true/);
  assert.match(js,/selectedStudentId=person\.id/);
  assert.match(js,/socket\.emit\('teacher:select-student'/);
});
