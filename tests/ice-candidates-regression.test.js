'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8');

test('el emisor conserva candidatos ICE incluso si la oferta aún se está aplicando',()=>{
  assert.match(src,/const key=`\$\{from\}:\$\{epoch\}`;[\s\S]*?const items=earlySignals\.get\(key\)\|\|\[\];[\s\S]*?items\.push\(candidate\);[\s\S]*?earlySignals\.set\(key,items\);/);
  assert.doesNotMatch(src,/else if\(!mediaPeer\)\{const key=`\$\{from\}:\$\{epoch\}`/);
});
test('los candidatos almacenados se aplican tras la descripción remota',()=>{
  assert.match(src,/await peer\.setRemoteDescription\(description\);[\s\S]*?const early=earlySignals\.get\(key\)\|\|\[\];[\s\S]*?await peer\.addIceCandidate\(item\)/);
});
test('no se modifica la configuración LAN sin servidores ICE externos',()=>{
  assert.match(src,/const peerConfig=\{iceServers:\[\]\}/);
});
