const test = require('node:test');
const assert = require('node:assert/strict');
const { getLanIPv4Addresses, isLoopbackAddress, isPrivateIPv4 } = require('../src/network-addresses');

test('detecta IPv4 LAN y prioriza direcciones privadas', () => {
  const result = getLanIPv4Addresses({
    lo: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
    eth0: [
      { address: '203.0.113.5', family: 'IPv4', internal: false },
      { address: '192.168.1.24', family: 'IPv4', internal: false }
    ],
    wlan0: [{ address: '10.0.0.8', family: 'IPv4', internal: false }],
    apipa: [{ address: '169.254.1.2', family: 'IPv4', internal: false }],
    eth6: [{ address: '2001:db8::1', family: 'IPv6', internal: false }]
  });
  assert.deepEqual(result.map(item => item.address), ['192.168.1.24', '10.0.0.8', '203.0.113.5']);
});

test('identifica loopback IPv4, IPv6 y IPv4 mapeada en IPv6', () => {
  assert.equal(isLoopbackAddress('127.0.0.1'), true);
  assert.equal(isLoopbackAddress('127.0.1.1'), true);
  assert.equal(isLoopbackAddress('::1'), true);
  assert.equal(isLoopbackAddress('::ffff:127.0.0.1'), true);
  assert.equal(isLoopbackAddress('192.168.1.20'), false);
});

test('clasifica direcciones IPv4 privadas', () => {
  assert.equal(isPrivateIPv4('10.1.2.3'), true);
  assert.equal(isPrivateIPv4('172.20.1.2'), true);
  assert.equal(isPrivateIPv4('192.168.1.3'), true);
  assert.equal(isPrivateIPv4('8.8.8.8'), false);
});
