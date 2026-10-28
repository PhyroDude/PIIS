// InterLAB 0.4.0: OpenSSL en Linux por defecto; mkcert como alternativa explícita.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
if (process.env.INTERLAB_CERT_PROVIDER === 'mkcert') {
  require('./setup-https-mkcert');
} else {
  if (process.platform === 'win32') {
    console.error('La generación OpenSSL se realiza en el anfitrión Linux. Usa INTERLAB_CERT_PROVIDER=mkcert si preparas el certificado en Windows.');
    process.exit(1);
  }
  const result = spawnSync('bash', [path.join(__dirname, 'setup-https-linux.sh')], { stdio: 'inherit' });
  if (result.error) console.error(result.error.message);
  process.exit(result.status === 0 ? 0 : 1);
}
