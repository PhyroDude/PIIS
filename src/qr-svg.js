'use strict';
// Generación completamente local: los QR solo contienen la URL /alumno.
const QRCode = require('./vendor/qrcode');
const errorLevels = require('./vendor/qrcode/QRErrorCorrectLevel');

function qrSvgForUrl(url) {
  if (typeof url !== 'string' || !/^https?:\/\/[\w.:-]+\/alumno$/.test(url)) {
    throw new TypeError('La dirección QR debe ser una URL de acceso de alumnos.');
  }
  const qr = new QRCode(-1, errorLevels.M);
  qr.addData(url);
  qr.make();
  const n = qr.getModuleCount(), pad = 4, total = n + pad * 2;
  const paths = [];
  for (let y = 0; y < n; y++) {
    let x = 0;
    while (x < n) {
      if (!qr.isDark(y, x)) { x++; continue; }
      const from = x;
      while (x < n && qr.isDark(y, x)) x++;
      paths.push(`M${from+pad} ${y+pad}h${x-from}v1h-${x-from}z`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" role="img" aria-label="Código QR de ingreso a alumnos"><rect width="${total}" height="${total}" fill="#fff"/><path fill="#102b29" d="${paths.join(' ')}"/></svg>`;
}
module.exports = {qrSvgForUrl};
