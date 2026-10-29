'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getStudentAccessLinks,interfaceType,isValidLocalIPv4 }=require('../src/student-access-links');
const { qrSvgForUrl }=require('../src/qr-svg');

const interfaces={
 lo:[{address:'127.0.0.1',family:'IPv4',internal:true}],
 eth0:[{address:'172.17.240.120',family:'IPv4',internal:false}],
 wlan0:[{address:'192.168.1.50',family:'IPv4',internal:false}],
 docker0:[{address:'172.17.0.1',family:'IPv4',internal:false}],
 tun0:[{address:'10.9.0.1',family:'IPv4',internal:false}],
 veth123:[{address:'10.0.0.4',family:'IPv4',internal:false}]
};
test('URL Ethernet completa sin QR; URL Wi-Fi completa con QR local',()=>{
 const data=getStudentAccessLinks({networkInterfaces:interfaces,protocol:'https',port:3000,wifiAccessIp:''});
 assert.deepEqual(data.ethernet.map(x=>x.url),['https://172.17.240.120:3000/alumno']);
 assert.equal(data.ethernet[0].qrSvg,undefined);
 assert.deepEqual(data.wifi.map(x=>x.url),['https://192.168.1.50:3000/alumno']);
 assert.match(data.wifi[0].qrSvg,/^<svg /);
 assert.match(data.wifi[0].qrSvg,/<path fill=/);
 assert.equal(data.lan.length,0);
});
test('sin Wi-Fi detectado solo se muestra Ethernet sin QR',()=>{
 const {wlan0,...wired}=interfaces;
 const data=getStudentAccessLinks({networkInterfaces:wired,protocol:'https',port:3000,wifiAccessIp:''});
 assert.equal(data.ethernet.length,1);
 assert.equal(data.wifi.length,0);
});
test('los teléfonos alcanzan la IP Ethernet por WLAN: QR configurable sin inventar IP',()=>{
 const {wlan0,...wired}=interfaces;
 const data=getStudentAccessLinks({networkInterfaces:wired,protocol:'https',port:3000,wifiAccessIp:'172.17.240.120'});
 assert.equal(data.wifi.length,1);
 assert.equal(data.wifi[0].url,data.ethernet[0].url);
 assert.ok(data.wifi[0].qrSvg);
});
test('clasifica interfaces y descarta dispositivos virtuales',()=>{
 assert.equal(interfaceType('enp3s0'),'ethernet');
 assert.equal(interfaceType('wlp2s0'),'wifi');
 assert.equal(interfaceType('wlan0'),'wifi');
 assert.equal(interfaceType('tun0'),null);
 assert.equal(interfaceType('docker0'),null);
 assert.equal(isValidLocalIPv4('192.168.1.23'),true);
 assert.equal(isValidLocalIPv4('127.0.0.1'),false);
 assert.equal(isValidLocalIPv4('8.8.8.8'),false);
});
test('QR no permite codificar la ruta docente ni URLs arbitrarias',()=>{
 assert.throws(()=>qrSvgForUrl('https://172.17.240.120:3000/docente'),/alumnos/);
 assert.throws(()=>qrSvgForUrl('javascript:alert(1)'),/alumnos/);
 assert.match(qrSvgForUrl('http://192.168.1.50:3010/alumno'),/viewBox=/);
});
test('la vista accesos conserva estados de espera y el intercambio WebRTC',()=>{
 const root=path.join(__dirname,'../public');
 const html=fs.readFileSync(path.join(root,'proyeccion.html'),'utf8');
 const js=fs.readFileSync(path.join(root,'proyeccion.js'),'utf8');
 assert.match(html,/id="studentAccess"/);
 assert.match(html,/id="screen"/);
 assert.match(html,/id="timer"/);
 assert.match(js,/projection:source/);
 assert.match(js,/screen:signal/);
 assert.match(js,/student-access/);
 assert.match(js,/waiting.classList.add\('hidden'\)/);
});
