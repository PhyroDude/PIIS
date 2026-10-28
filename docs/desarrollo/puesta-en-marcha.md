<<<<<<< HEAD
# Puesta en marcha y verificación — versión 0.3.3
=======
# Puesta en marcha y verificación — versión 0.3.5
>>>>>>> 2f7796c (Integración de credenciales)

## Entorno

- Node.js 20 o posterior recomendado.
- npm.
- VS Code u otro editor.
- Navegador moderno con soporte de `getDisplayMedia()` y WebRTC.
- Computadora del docente y equipos cliente conectados a la misma LAN.
<<<<<<< HEAD
- Para captura de pantalla remota, HTTPS con certificado confiable. Esta versión incluye servidor HTTPS propio mediante certificados locales generados con `mkcert`.
=======
- Para captura de pantalla remota, HTTPS con certificado confiable. Esta versión incluye servidor HTTPS propio mediante un certificado autofirmado generado con OpenSSL.
>>>>>>> 2f7796c (Integración de credenciales)

## Instalar y ejecutar

```bash
npm install
npm test
npm run setup:https
npm run start:docente
```

<<<<<<< HEAD
### Preparar HTTPS confiable

1. Instala `mkcert` en la computadora anfitriona siguiendo la guía oficial: https://github.com/FiloSottile/mkcert.
2. Ejecuta `npm run setup:https`. El script instala la CA local en el host y genera `certs/interlab.pem` y `certs/interlab-key.pem` para `localhost`, loopback y las IPv4 LAN detectadas.
3. Ejecuta `mkcert -CAROOT` para localizar la carpeta de la CA. Copia únicamente `rootCA.pem` a cada equipo Windows mediante un medio confiable. **Nunca copies `rootCA-key.pem` ni la carpeta completa de la CA.**
4. En Windows, instala `rootCA.pem` en **Usuario actual → Entidades de certificación raíz de confianza**. En equipos administrados por la universidad, sigue el procedimiento autorizado de TI.
5. Cierra y vuelve a abrir Firefox. Comprueba que la dirección HTTPS del host no muestra error de certificado.
6. Ejecuta `npm run start:docente`. El anfitrión abre `https://localhost:3000/docente`; los alumnos usan `https://IP-LAN-DEL-DOCENTE:3000/alumno`.

El servidor escucha por defecto en `0.0.0.0`. Si el host tiene varias interfaces, elige la IP de la LAN del laboratorio. Si cambia una IP incluida en el certificado, vuelve a ejecutar `npm run setup:https`. Los certificados quedan en `certs/`, excluidos de Git. HTTPS está habilitado por defecto; `HTTPS_ENABLED=false` se reserva para pruebas HTTP automatizadas locales y no debe usarse para proyectar desde otros equipos. No abras el servicio a Internet y revisa el firewall del host.
=======
### Preparar HTTPS con OpenSSL

1. Comprueba que OpenSSL esté instalado (`openssl version`). En Ubuntu/Debian, si falta: `sudo apt install openssl`.
2. Ejecuta `npm run setup:https`. El script detecta las IPv4 LAN y genera `certs/interlab.pem` y `certs/interlab-key.pem`, con nombres alternativos para `localhost`, `127.0.0.1` y las IP detectadas.
3. Ejecuta `npm run start:docente`. El anfitrión abre `https://localhost:3000/docente`; los alumnos usan `https://IP-LAN-DEL-DOCENTE:3000/alumno`.
4. Al ser autofirmado, el certificado produce una advertencia del navegador. Para la prueba inicial, revisa el certificado y continúa solo si estás seguro de que accedes a la computadora docente correcta. No compartas la clave privada `certs/interlab-key.pem`.
5. En el navegador del alumno abre las herramientas de desarrollador y evalúa `window.isSecureContext`. Debe devolver `true`; además, comprueba la captura con una acción explícita del usuario. Si devuelve `false`, el certificado autofirmado no ha habilitado un contexto seguro en ese navegador. En ese caso se necesitará instalar y confiar el certificado en el almacén correspondiente o usar un certificado emitido por una CA de confianza.

El servidor escucha por defecto en `0.0.0.0`. Si el host tiene varias interfaces, elige la IP de la LAN del laboratorio. Si cambia una IP incluida en el certificado, vuelve a ejecutar `npm run setup:https`. Los certificados quedan en `certs/`, excluidos de Git. HTTPS está habilitado por defecto; `HTTPS_ENABLED=false` se reserva para pruebas HTTP automatizadas locales y no debe usarse para proyectar desde equipos remotos. No abras el servicio a Internet y revisa el firewall del host.
>>>>>>> 2f7796c (Integración de credenciales)

## Rutas y roles

- `/docente`: acceso docente directo, permitido únicamente cuando la petición llega desde el propio host (loopback). Una petición remota recibe HTTP 403.
- `/alumno`: acceso estudiantil directo desde la LAN.
- `/`: redirige a `/docente` en el host y a `/alumno` para solicitudes remotas.
- `/index.html`: redirige según el mismo criterio para no saltarse la ruta por rol.

Este filtro limita la vista por HTTP, pero no es autenticación institucional. Las operaciones docentes y los eventos Socket.IO deben autorizarse en el servidor; no se debe tratar la URL como un secreto ni exponer el puerto a Internet. Las paletas por rol están implementadas provisionalmente y siguen pendientes de aprobación visual.

## Exportación de notas

Copiar/descargar está deshabilitado por defecto. Solo después de validar formalmente su compatibilidad con RNF-002 se puede habilitar:

```bash
ENABLE_NOTE_EXPORT=true npm start
```

La exportación crea una copia local que queda fuera del control de borrado del servidor. Si no hay aprobación, mantén la opción deshabilitada.

## Pruebas unitarias

```bash
npm test
```

Estas pruebas cubren lógica de sesión y cola, pero no validan la captura ni WebRTC entre computadoras físicas.

## Lista de comprobación manual

### Despliegue LAN y rutas

- [ ] Al ejecutar `npm run start:docente`, el servidor escucha en `0.0.0.0` y muestra las direcciones IPv4 detectadas.
<<<<<<< HEAD
- [ ] El host abre `https://localhost:3000/docente` sin advertencia de certificado.
- [ ] Los clientes Windows confían en la CA y abren `https://IP-LAN-DEL-DOCENTE:3000/alumno` sin advertencia.
=======
- [ ] El host abre `https://localhost:3000/docente`; se documenta la advertencia esperada del certificado autofirmado.
- [ ] Los clientes Windows abren `https://IP-LAN-DEL-DOCENTE:3000/alumno`; se verifica la advertencia autofirmada y `window.isSecureContext === true`.
>>>>>>> 2f7796c (Integración de credenciales)
- [ ] Desde otro equipo de la LAN, `/alumno` responde y permite cargar la pantalla estudiantil.
- [ ] Desde otro equipo de la LAN, `/docente` devuelve HTTP 403.
- [ ] Desde otro equipo, `/` y `/index.html` redirigen a `/alumno`.
- [ ] Se comprueba el acceso con la IP correspondiente a la interfaz de red del laboratorio y se revisa el firewall del host.

### Sesión y roles

- [ ] El docente crea una sesión y comparte dirección y código temporal.
- [ ] Un estudiante entra con código y alias válido.
- [ ] Se rechazan código incorrecto, alias vacío, alias duplicado y exceso de participantes.
- [ ] Al cerrar la sesión, el código deja de ser válido y se elimina el estado temporal.

### Solicitud y cola de presentación

- [ ] A, B y C autorizan captura desde sus navegadores y aparecen una sola vez en la cola.
- [ ] Mientras esperan, A, B y C no envían vídeo al docente.
- [ ] El docente concede acceso a A; la pantalla y el alias corresponden a A.
- [ ] El docente cambia de A a B; A deja de transmitir y la pantalla de B aparece correctamente.
- [ ] El docente concede después el turno a C y se visualiza su pantalla.
- [ ] La selección directa de un participante salta la cola y respeta la exclusividad.
- [ ] Las señales retrasadas de A no reemplazan la pantalla de B o C.
- [ ] Detener la proyección libera el turno y no deja un vídeo congelado.
- [ ] Detener captura o desconectarse elimina la solicitud correspondiente.

### Permisos, pantalla completa y red

- [ ] El navegador muestra el diálogo de captura solo tras una acción explícita del estudiante.
- [ ] La transmisión empieza únicamente después de que el docente concede/selecciona al estudiante autorizado.
- [ ] La pantalla completa se prueba en los navegadores objetivo y se registra si se amplía el vídeo o toda la vista de presentación.
<<<<<<< HEAD
- [ ] Firefox permite `getDisplayMedia()` con HTTPS confiable en la LAN y se visualiza la pantalla por WebRTC.
=======
- [ ] Firefox permite `getDisplayMedia()` desde HTTPS en la LAN y se visualiza la pantalla por WebRTC; si no, se configura confianza explícita del certificado.
>>>>>>> 2f7796c (Integración de credenciales)
- [ ] La sesión funciona sin Internet cuando ya están disponibles los recursos y certificados requeridos.
- [ ] Se prueba desconexión temporal y reconexión.
- [ ] Se comprueba que eventos directos del cliente no permiten señalizar con estudiantes no seleccionados.

### Observaciones

- [ ] El docente puede dar retroalimentación oral sin crear una nota.
- [ ] Una nota opcional llega solo al estudiante destinatario.
- [ ] Un estudiante no puede consultar notas de otro participante.
- [ ] Las notas se eliminan al cerrar la sesión y no se recuperan tras reiniciar el servidor.
- [ ] Copiar/descargar permanece deshabilitado hasta resolver RNF-002.

No marques una prueba como aprobada hasta ejecutarla y registrar fecha, navegador, sistema operativo, equipos usados y resultado observado. En particular, el defecto de cambio de A a B debe permanecer abierto hasta que pase la prueba en la LAN.
