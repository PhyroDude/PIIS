# ADR-008: Despliegue LAN y restricción de rutas por origen

- **Estado:** Aceptada para el siguiente incremento sobre la base v0.3.0.
- **Fecha:** 26 de octubre de 2026.

## Contexto

El host debe abrir la vista docente al iniciar, mientras que las computadoras de estudiantes deben acceder a la vista `/alumno` mediante la IP actual del host. Una dirección escrita como marcador en la documentación obliga a buscar manualmente la IP y puede fallar cuando el host tiene varias interfaces.

## Decisión

- El servidor escucha por defecto en `0.0.0.0`, manteniendo `HOST` y `PORT` configurables.
- Al iniciar, se detectan las direcciones IPv4 no internas y se imprimen URLs candidatas con la ruta `/alumno`; las direcciones privadas se listan primero.
- `npm run start:docente` conserva la apertura de `http://localhost:PORT/docente` en el navegador del anfitrión.
- `/docente` solo sirve la aplicación cuando la conexión HTTP proviene de una dirección loopback; solicitudes remotas reciben HTTP 403. Además, el evento Socket.IO `teacher:create-session` se rechaza cuando la conexión no proviene de loopback.
- `/` y `/index.html` redirigen a `/docente` para loopback y a `/alumno` para conexiones remotas.
- `/alumno` queda disponible desde la LAN.

## Consecuencias y límites

- No es necesario escribir la IP del host en el código. Si hay varias interfaces, el operador debe elegir la dirección de la misma LAN que los clientes.
- La regla restringe la ruta web y el inicio de sesión docente a loopback, pero no es autenticación institucional fuerte ni prueba de identidad del docente. La autorización de las demás operaciones Socket.IO debe mantenerse en el servidor.
- La aplicación continúa sirviendo HTTP en esta base. Captura de pantalla mediante `getDisplayMedia()` desde clientes remotos requiere HTTPS confiable y debe configurarse por separado.
- La apertura del puerto en el firewall debe limitarse a la LAN prevista; no se debe exponer el servicio a Internet.
- La validación con equipos físicos, el bloqueo remoto de rutas y las pruebas de flujo WebRTC permanecen pendientes hasta ejecutarse y registrarse.
