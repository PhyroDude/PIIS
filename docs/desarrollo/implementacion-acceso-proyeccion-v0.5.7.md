# Cambios de implementación — v0.5.7

- `src/student-access-links.js`: recopila y clasifica las IPv4 del servidor y construye únicamente URL `/alumno`; opción `INTERLAB_WIFI_ACCESS_IP` para Wi-Fi que alcanza la IP cableada.
- `src/qr-svg.js` y `src/vendor/qrcode/`: codificación local de QR, sin dependencias externas ni servicios de terceros.
- `server.js`: nuevo endpoint local `GET /api/projection/student-access`. Los endpoints y sockets originales permanecen intactos.
- `public/proyeccion.html`, `public/proyeccion.css`, `public/proyeccion.js`: visualización institucional de URL completa Ethernet y Wi-Fi + QR; consulta periódica y preservación del video WebRTC y de los estados de conexión docente.
- `tests/student-access-projection.test.js`: comprobaciones de URLs completas, filtrado de interfaces, QR solo Wi-Fi, opción de IP compartida, seguridad y conservación de controles de presentación.
- `package.json`, `package-lock.json`, `CHANGELOG.md`: versión 0.5.7.

**No se ha modificado** el proceso de autorización, la captura de pantalla ni la señalización WebRTC. El flujo real debe probarse en el laboratorio.
