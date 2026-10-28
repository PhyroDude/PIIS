# InterLAB 0.5.0 — arquitectura implementada

**Estado:** implementación beta; pruebas automatizadas locales y de señalización superadas. **Sin validación de video real** en varios equipos Windows, HTTPS de laboratorio ni proyector. Este documento complementa, no sustituye, la [arquitectura objetivo del rediseño](arquitectura-objetivo-servidor-y-proyeccion-v0.4.0.md) y los ADR-015 a ADR-020.

## Topología

1. **Computadora fija del laboratorio:** `server.js` (Node.js/Express/Socket.IO), almacenamiento temporal en disco y una vista local `/proyeccion` que ejecuta WebRTC receptor. El proyector físico muestra esa vista; el servicio y el navegador receptor son procesos separados.
2. **Laptop docente:** `/docente` por HTTPS a la IP LAN del equipo fijo. La primera visita sin titular autorizado reserva el rol y emite cookie `interlab_docente` `HttpOnly; SameSite=Strict; Secure` (Secure en HTTPS). Después el cliente une su conexión Socket.IO mediante `teacher:attach`.
3. **Equipos de los alumnos:** `/alumno`, alias y código de clase. Solicitar turno (`student:request-presentation`) no invoca `getDisplayMedia` ni establece peer. Se muestra notificación al recibir `screen:requested` y el alumno pulsa «Autorizar pantalla»; solo entonces envía `student:screen-ready`.

## Ciclo de vida de la sesión

- El proceso servidor contiene `SessionStore.session` en memoria; **no** depende de `socket.id` de la pestaña docente. `teacher:attach` retorna sesión, código, participantes, cola y token administrativo vigente. La credencial de recuperación está en cookie privada; el código visible se comparte con estudiantes.
- Primera toma del rol: primer GET de `/docente` cuando no hay titular. Un segundo navegador sin cookie obtiene HTTP 423. Esta política **no autentica la identidad real del profesor**: cualquier equipo LAN podría tomar el rol primero; riesgo aceptado por el responsable, requiere operación en red controlada.
- Desconexión docente: `disconnectTeacher` preserva sesión y archivos e inicia plazo de **90 s** medido por el servidor. En `/proyeccion`: 0–30 s «Esperando conexión», a los 30 s aparece una cuenta regresiva de 1:00. Si sigue proyectando un alumno autorizado, los mensajes permanecen ocultos mientras el video continúe.
- Antes de 90 s: `teacher:attach` con cookie válida cancela vencimiento; si se perdió el MediaStream, se solicita otra interacción explícita para compartir pantalla.
- A los 90 s: se invalida la credencial anterior, se rota el token administrativo de sesión y se libera el rol. El servidor muestra «Tiempo de espera concluido. Esperando nuevo docente» si no hay video estudiantil activo. Una nueva visita a `/docente` adquiere el control y recupera la sesión.
- Durante la ausencia del docente se permiten nuevas incorporaciones, solicitudes de proyección y operaciones de archivos, pero **no** nuevas concesiones. Las presentaciones estudiantiles previamente autorizadas pueden terminar cuando el alumno quiera. Una selección pendiente que no llegó a activar video vuelve a la cola cuando expira el docente.
- Cierre explícito: invalida credenciales, termina presentación/transferencias y elimina temporales. Reinicio del servicio: nunca recupera sesión; al arrancar borra únicamente subdirectorios con nombre UUID bajo el almacenamiento temporal propio. Archivos fuera de esos directorios no se tocan.

## Exclusividad WebRTC

El **navegador receptor local** inicia la oferta SDP. El servidor permite `screen:signal` solamente entre ese receptor y el emisor que `SessionStore.activeSource()` indique en ese instante: docente con captura autorizada o alumno seleccionado que aceptó capturar. Cada cambio efectivo incorpora `epoch`; candidatos/SDP con épocas antiguas no se reenvían. Si un alumno es seleccionado pero aún no acepta, el docente conserva la transmisión predeterminada. El docente puede aprobar o rechazar elementos de la cola; un alumno puede retirar su solicitud o rechazar una petición directa. Si el alumno comienza, el peer docente se cierra, conservando la captura local para reanudarla después. Al finalizar, se revoca la fuente estudiantil y se renegocia con el docente disponible.

No se introduce SFU, almacenamiento ni transcodificación. El proceso Node.js **no** decodifica el video: lo hace `/proyeccion` dentro del navegador local. Si falla el receptor, el servicio y los datos siguen activos; reconectar el receptor permite negociar otra vez.

## Protección del receptor y control local

- GET `/proyeccion` y el evento `projection:register` comprueban la IP de origen loopback. El endpoint `/proyeccion.html` redirige a la ruta protegida. No deben utilizarse reverse proxies que falseen el origen de ese acceso.
- El control administrativo de emergencia se realiza únicamente en la computadora fija mediante `npm run release:docente` en una terminal interactiva. Requiere un secreto aleatorio guardado con permisos locales en `.local-control/recovery.json`, más acceso loopback; rota credencial sin destruir sesión. Es un **recurso excepcional**, no parte del flujo diario.
- La API de archivos conserva sus límites anteriores: 50 MB/archivo, 200 MB/selección, 10 GB/sesión y dos transferencias simultáneas por participante. El propietario lógico del docente es estable (`teacher`) entre reconexiones; las reservas/descargas viejas se invalidan cuando el navegador docente se desconecta.
- El fix de descarga genera un `iframe` oculto para evitar navegación fuera de `/docente`; el navegador recibe el archivo sin que JavaScript cargue el binario completo.

## Límites de la beta

- Sin pruebas físicas de WebRTC A→B, reconexiones con redes Wi-Fi degradadas o rendimiento al subir ZIP mientras se proyecta.
- El navegador del docente requiere aceptar la captura nuevamente si se cierra; **ninguna web puede autorizar automáticamente `getDisplayMedia()` al abrir una URL**.
- El alumno desconectado debe reincorporarse con código y alias; su nueva conexión tiene ID nuevo y no recupera automáticamente la propiedad de archivos subidos antes de esa desconexión. El docente sí conserva facultad de eliminarlos.
- El receptor en modo quiosco necesita sesión gráfica de SO, navegador instalado, certificado HTTPS confiable y configuración de la pantalla de salida hacia el proyector.
- El inicio automático está preparado para Linux con systemd de usuario y autostart de sesión gráfica; **no está instalado en la computadora real**. Configuraciones Windows requieren un procedimiento de tareas programadas equivalente.
