# Puesta en marcha y verificación — InterLAB v0.4.0 beta
> **Actualización v0.4.0 (prioritaria sobre instrucciones antiguas de esta página):** base adoptada de `PIIS(1).zip` como InterLAB v0.3.4. Después de `npm ci`, ejecuta `npm run setup:https` en el docente Linux para generar un certificado OpenSSL local (predeterminado). Para preferir la CA de mkcert en Linux: `INTERLAB_CERT_PROVIDER=mkcert npm run setup:https`. Los certificados **no** vienen en el ZIP. Revisa la confianza y `window.isSecureContext` de Firefox/Windows antes de probar WebRTC. La configuración de OpenSSL requiere confianza explícita del cliente según navegador. No expongas directamente el servidor a Internet.

Para archivos, consulta [arquitectura v0.4.0](../arquitectura/modulo-archivos-v0.4.0.md), [pruebas](../pruebas/resultado-beta-040.md) y [alcance](../producto/alcance-MVP-y-product-backlog-base-v1.1.md). Las instrucciones previas sobre mkcert que siguen abajo describen la variante alternativa, no el valor predeterminado.


## Entorno

- Node.js 20 o posterior recomendado.
- npm.
- VS Code u otro editor.
- Navegador moderno con soporte de `getDisplayMedia()` y WebRTC.
- Computadora del docente y equipos cliente conectados a la misma LAN.
- Para captura de pantalla remota, HTTPS con certificado confiable. Esta versión incluye servidor HTTPS propio. OpenSSL es el generador predeterminado en Linux; mkcert es opcional.

## Instalar y ejecutar

```bash
npm install
npm test
npm run setup:https
npm run start:docente
```

### Preparar HTTPS en el equipo docente

**Opción predeterminada en Linux: OpenSSL.** Instala `openssl` si hace falta (`sudo apt install openssl`), luego ejecuta `npm run setup:https`. Se generan `certs/interlab.pem` y `certs/interlab-key.pem` (certificado autofirmado con las IP LAN detectadas). Los navegadores pueden mostrar advertencias y **no está garantizado que `getDisplayMedia()` funcione** hasta establecer una confianza aceptada por cada navegador/cliente. Valida `window.isSecureContext` y las políticas de la universidad. Si cambia la IP, regenera los certificados.

**Opción alternativa: mkcert.** Instala `mkcert` desde su [documentación oficial](https://github.com/FiloSottile/mkcert) y ejecuta `INTERLAB_CERT_PROVIDER=mkcert npm run setup:https` en Linux. Para clientes Windows, distribuye por un canal autorizado únicamente el certificado público `rootCA.pem` ubicado mediante `mkcert -CAROOT`; nunca distribuyas `rootCA-key.pem`. La instalación de una CA confiable debe seguir la política de TI y comprobarse en Firefox/Chrome.

**No se suministran claves ni certificados del ZIP original.** Cada anfitrión debe generar los suyos. Inicia `npm run start:docente` después de preparar el certificado; los alumnos acceden a `https://IP-LAN-DEL-DOCENTE:3000/alumno`.

El servidor escucha por defecto en `0.0.0.0`. Si el host tiene varias interfaces, elige la IP de la LAN del laboratorio. Si cambia una IP incluida en el certificado, vuelve a ejecutar `npm run setup:https`. Los certificados quedan en `certs/`, excluidos de Git. HTTPS está habilitado por defecto; `HTTPS_ENABLED=false` se reserva para pruebas HTTP automatizadas locales y no debe usarse para proyectar desde otros equipos. No abras el servicio a Internet y revisa el firewall del host.

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
- [ ] El host abre `https://localhost:3000/docente` sin advertencia de certificado.
- [ ] Los clientes Windows confían en la CA y abren `https://IP-LAN-DEL-DOCENTE:3000/alumno` sin advertencia.
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
- [ ] Firefox permite `getDisplayMedia()` con HTTPS confiable en la LAN y se visualiza la pantalla por WebRTC.
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
