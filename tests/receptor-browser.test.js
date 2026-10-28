'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {browserKind,findBrowser,profileFor,launchArgs}=require('../scripts/open-receptor');

test('Firefox se detecta primero en Linux y utiliza parámetros propios',()=>{
  const browser=findBrowser({platform:'linux',env:{},available:cmd=>['firefox','chromium'].includes(cmd)});
  assert.deepEqual(browser,{command:'firefox',kind:'firefox'});
  const profile=profileFor(browser,{home:'/home/docente',env:{},exists:()=>false});
  assert.equal(profile,'/home/docente/.interlab/receptor-firefox');
  assert.deepEqual(launchArgs(browser,profile,'https://localhost:3000/proyeccion'),
    ['--no-remote','--profile',profile,'--kiosk','https://localhost:3000/proyeccion']);
});

test('Firefox Snap usa un perfil accesible desde su confinamiento',()=>{
  const browser={command:'firefox',kind:'firefox'};
  const profile=profileFor(browser,{home:'/home/docente',env:{},exists:p=>p==='/snap/bin/firefox'});
  assert.equal(profile,'/home/docente/snap/firefox/common/.mozilla/firefox/interlab-receptor');
});

test('INTERLAB_BROWSER permite elegir Firefox mediante una ruta explícita',()=>{
  const browser=findBrowser({platform:'linux',env:{INTERLAB_BROWSER:'/snap/bin/firefox'},available:()=>false});
  assert.deepEqual(browser,{command:'/snap/bin/firefox',kind:'firefox'});
  assert.equal(browserKind('firefox-esr'),'firefox');
});

test('Se respeta un perfil Firefox personalizado',()=>{
  const browser={command:'firefox',kind:'firefox'};
  assert.equal(profileFor(browser,{home:'/home/docente',env:{INTERLAB_FIREFOX_PROFILE:'/tmp/interlab-prueba'},exists:()=>false}),'/tmp/interlab-prueba');
});

test('Chromium conserva sus argumentos anteriores',()=>{
  const browser=findBrowser({platform:'linux',env:{},available:cmd=>cmd==='chromium'});
  assert.deepEqual(browser,{command:'chromium',kind:'chromium'});
  const args=launchArgs(browser,'/home/docente/.interlab/receptor-browser','http://localhost:3000/proyeccion');
  assert.ok(args.includes('--no-first-run'));
  assert.ok(args.includes('--user-data-dir=/home/docente/.interlab/receptor-browser'));
  assert.ok(!args.includes('--no-remote'));
});

test('Windows reconoce Firefox como alternativa',()=>{
  const executable=path.win32.join('C:\\Program Files','Mozilla Firefox','firefox.exe');
  const browser=findBrowser({platform:'win32',env:{PROGRAMFILES:'C:\\Program Files'},exists:p=>p===executable});
  assert.ok(browser);
  assert.equal(browser.command,executable);
  assert.equal(browser.kind,'firefox');
});

test('Firefox ofrece modo de preparación del certificado sin pantalla completa',()=>{
  const browser={command:'firefox',kind:'firefox'};
  const args=launchArgs(browser,'/home/docente/.interlab/receptor-firefox','https://localhost:3000/proyeccion',{setup:true});
  assert.ok(args.includes('--no-remote'));
  assert.ok(args.includes('--profile'));
  assert.ok(!args.includes('--kiosk'));
});
