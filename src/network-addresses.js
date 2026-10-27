const os = require('node:os');

function isPrivateIPv4(address) {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some(value => !Number.isInteger(value) || value < 0 || value > 255)) return false;
  return octets[0] === 10
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    || (octets[0] === 192 && octets[1] === 168);
}

function getLanIPv4Addresses(networkInterfaces = os.networkInterfaces()) {
  const addresses = [];
  for (const [interfaceName, entries] of Object.entries(networkInterfaces)) {
    for (const entry of entries || []) {
      const family = typeof entry.family === 'string' ? entry.family : (entry.family === 4 ? 'IPv4' : String(entry.family));
      if (family !== 'IPv4' || entry.internal || !entry.address || entry.address.startsWith('169.254.')) continue;
      addresses.push({ interfaceName, address: entry.address, private: isPrivateIPv4(entry.address) });
    }
  }
  return addresses.sort((a, b) => Number(b.private) - Number(a.private) || a.interfaceName.localeCompare(b.interfaceName));
}

function isLoopbackAddress(address = '') {
  const normalized = address.startsWith('::ffff:') ? address.slice(7) : address;
  return normalized === '::1' || normalized.startsWith('127.');
}

module.exports = { getLanIPv4Addresses, isLoopbackAddress, isPrivateIPv4 };
