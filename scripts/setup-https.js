<<<<<<< HEAD
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { getLanIPv4Addresses } = require('../src/network-addresses');

const root = path.join(__dirname, '..');
const certDir = path.join(root, 'certs');
const certFile = path.join(certDir, 'interlab.pem');
const keyFile = path.join(certDir, 'interlab-key.pem');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', ...options });
  if (result.error) {
    console.error(`No se pudo ejecutar ${command}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.stderr.write(result.stderr || 'El comando terminó con error.\n');
    process.exit(result.status || 1);
  }
  if (result.stdout) process.stdout.write(result.stdout);
}

const check = spawnSync('mkcert', ['-version'], { encoding: 'utf8' });
if (check.error || check.status !== 0) {
  console.error('No se encontró mkcert. Instálalo en la computadora anfitriona y vuelve a ejecutar npm run setup:https.');
  console.error('Guía oficial: https://github.com/FiloSottile/mkcert');
  process.exit(1);
}

const addresses = [...new Set(getLanIPv4Addresses().map(item => item.address))];
if (addresses.length === 0) {
  console.error('No se detectó ninguna dirección IPv4. Conecta el equipo a la LAN y vuelve a intentarlo.');
  process.exit(1);
}
fs.mkdirSync(certDir, { recursive: true });
run('mkcert', ['-install']);
const names = ['localhost', '127.0.0.1', '::1', ...addresses];
run('mkcert', ['-cert-file', certFile, '-key-file', keyFile, ...names]);
console.log('\nCertificado HTTPS generado. Direcciones LAN incluidas:');
for (const address of addresses) console.log(`  https://${address}:3000/alumno`);
console.log('\nPara Windows, exporta solo rootCA.pem desde `mkcert -CAROOT` e instálalo en “Entidades de certificación raíz de confianza”.');
console.log('NO compartas rootCA-key.pem. Si cambia la IP LAN, vuelve a ejecutar npm run setup:https.');
=======
// Compatibilidad para ejecutar la preparación HTTPS desde Node.js.
// La generación real del certificado se realiza con OpenSSL en Linux.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const script = path.join(__dirname, 'setup-https-linux.sh');
const result = spawnSync('bash', [script], { stdio: 'inherit' });
if (result.error) {
  console.error(`No se pudo ejecutar el script HTTPS: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
>>>>>>> 2f7796c (Integración de credenciales)
