'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
const detector = source.match(/function isPhoneDevice\(\)\{[\s\S]*?\n\}/);
assert.ok(detector, 'Debe existir el detector de teléfonos');
function detect(ua, mobile){
  const sandbox = {navigator: {userAgent: ua, userAgentData: mobile === undefined ? undefined : { mobile }}};
  return vm.runInNewContext(detector[0] + '\nisPhoneDevice()', sandbox);
}
test('reconoce Chrome Android en teléfono', () => {
  assert.equal(detect('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/121 Mobile Safari/537.36'), true);
});
test('reconoce Firefox Android en teléfono', () => {
  assert.equal(detect('Mozilla/5.0 (Android 13; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0'), true);
});
test('reconoce Safari iPhone', () => {
  assert.equal(detect('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'), true);
});
test('no bloquea Chrome Windows', () => {
  assert.equal(detect('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36'), false);
});
test('no bloquea Firefox Linux', () => {
  assert.equal(detect('Mozilla/5.0 (X11; Linux x86_64; rv:156.0) Gecko/20100101 Firefox/156.0'), false);
});
test('el indicador de plataforma móvil es reconocido', () => {
  assert.equal(detect('Desconocido', true), true);
});
test('los teléfonos no solicitan turno ni inician captura desde sus controles', () => {
  assert.match(source, /\$\('startShare'\)\.onclick=\(\)=>\{\s*if\(applyPhoneProjectionRestriction\(\)\)return;/);
  assert.match(source, /\$\('projectionNoticeAction'\)\.onclick=async\(\)=>\{\s*closeStudentNotice\(\);\s*if\(applyPhoneProjectionRestriction\(\)\)return;/);
  assert.match(source, /if\(studentOnPhone\)\{\s*\/\/[^\n]*\n[^\n]*\n\s*socket\.emit\('student:stop-sharing'/);
});
