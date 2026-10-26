# Puesta en marcha y verificación — base 0.3.0

## Entorno

- Node.js 20 o posterior recomendado.
- npm.
- VS Code u otro editor.
- Navegador moderno con soporte de `getDisplayMedia()` y WebRTC.
- Computadora del docente y equipos cliente conectados a la misma LAN.
- Para capturar pantalla desde otros equipos, un origen HTTPS confiable en la dirección LAN. La base 0.3.0 incluida sirve HTTP y no incorpora terminación TLS propia.

## Instalar y ejecutar

```bash
npm install
npm test
npm start
```

En la computadora del docente, abre `http://localhost:3000`. Para probar con otros equipos, configura por separado una terminación HTTPS que reenvíe al servidor local, usa un certificado cuyo nombre/IP coincida con la dirección utilizada y confía ese certificado en los clientes Windows. La configuración exacta depende de la infraestructura disponible en el laboratorio; no cambies simplemente `localhost` por la IP esperando que la captura funcione por HTTP.

No abras el puerto del sistema a Internet. Limita el acceso a la LAN prevista y revisa el firewall del sistema anfitrión.

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
- [ ] La captura y WebRTC funcionan con HTTPS confiable en la LAN.
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
