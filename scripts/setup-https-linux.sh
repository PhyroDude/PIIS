#!/usr/bin/env bash
set -Eeuo pipefail

# Genera un certificado HTTPS autofirmado con OpenSSL; no requiere mkcert ni CA propia.
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_DIR="$ROOT_DIR/certs"
CERT_FILE="$CERT_DIR/interlab.pem"
KEY_FILE="$CERT_DIR/interlab-key.pem"

if ! command -v openssl >/dev/null 2>&1; then
  echo "ERROR: OpenSSL no está instalado o no está en PATH." >&2
  echo "En Ubuntu/Debian puedes instalarlo con: sudo apt install openssl" >&2
  exit 1
fi

mapfile -t LAN_IPS < <(node - "$ROOT_DIR/src/network-addresses.js" <<'NODE'
const { getLanIPv4Addresses } = require(process.argv[2]);
for (const { address } of getLanIPv4Addresses()) console.log(address);
NODE
)

if ((${#LAN_IPS[@]} == 0)); then
  echo "ERROR: no se detectaron direcciones IPv4 de red." >&2
  echo "Conecta la computadora a la LAN y vuelve a ejecutar el script." >&2
  exit 1
fi

mkdir -p "$CERT_DIR"
chmod 700 "$CERT_DIR"

# subjectAltName es necesario para que el certificado coincida con la IP usada.
SAN="DNS:localhost,IP:127.0.0.1,IP:0:0:0:0:0:0:0:1"
for ip in "${LAN_IPS[@]}"; do SAN+=",IP:$ip"; done

openssl req -x509 -newkey rsa:2048 -sha256 -nodes \
  -keyout "$KEY_FILE" \
  -out "$CERT_FILE" \
  -days 365 \
  -subj "/CN=localhost" \
  -addext "subjectAltName=$SAN" \
  -addext "keyUsage=digitalSignature,keyEncipherment" \
  -addext "extendedKeyUsage=serverAuth"

chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"

printf '\nCertificado HTTPS autofirmado creado con OpenSSL.\n\nDirecciones para estudiantes:\n'
for ip in "${LAN_IPS[@]}"; do printf '  https://%s:3000/alumno\n' "$ip"; done
printf '\nVista docente local: https://localhost:3000/docente\n'
printf '\nArchivos generados:\n  %s\n  %s\n' "$CERT_FILE" "$KEY_FILE"
printf '\nIMPORTANTE:\n'
printf ' - El navegador mostrará una advertencia porque el certificado es autofirmado.\n'
printf ' - Aceptar la advertencia puede no bastar en todos los navegadores para habilitar getDisplayMedia().\n'
printf ' - No compartas la clave privada certs/interlab-key.pem.\n'
printf ' - Si cambia la IP LAN, vuelve a ejecutar npm run setup:https.\n'
