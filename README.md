# InterLAB — Sistema local de retroalimentación para laboratorios de cómputo

Aplicación web LAN para sesiones temporales de clase, retroalimentación, proyección de pantalla por WebRTC y archivos compartidos. **Versión actual: 0.5.6 beta**. La base histórica es `PIIS(1).zip` = v0.3.4; v0.4.0 incorporó los archivos temporales, y **v0.5.0 rediseñó el servidor y la proyección**.

> El código incluye mecanismos de reconexión y exclusividad, pero **todavía no se ha validado la recepción de video entre equipos reales ni el arranque automático en una computadora de laboratorio**. Los tests locales no equivalen a una certificación de uso en clase.

## Estado y alcance

- **Servidor:** computadora fija, única instancia Node.js con una sesión activa en memoria; el proyector físico está conectado a esta computadora. El navegador local `/proyeccion` muestra el video recibido; cerrar la ventana no termina la sesión.
- **Docente:** entra desde su laptop a `https://IP-DEL-SERVIDOR:3000/docente`, adquiere el rol si está libre (primer acceso), pulsa «Compartir pantalla» y crea/recupera la sesión. El código de ingreso permanece visible; la credencial administrativa es privada y se guarda en cookie `HttpOnly`.
- **Alumno:** entra a `/alumno` con código y alias. Puede solicitar turno sin iniciar WebRTC ni abrir el selector de pantalla; solo tras permiso docente recibe aviso y autoriza la captura.
- **Proyección:** exclusivamente la pantalla del docente o de un alumno autorizado se envía al receptor local por WebRTC. El servidor coordina SDP/ICE con Socket.IO y no almacena video.
- **Reconexión docente:** 90 segundos desde la desconexión; aviso simple durante los primeros 30 s, luego cuenta regresiva de 60 s. Un alumno que ya proyectaba puede continuar. Tras la expiración se libera el rol, sin eliminar alumnos, cola ni archivos.
- **Reinicio de servidor:** finaliza la sesión anterior y limpia temporales propios al arrancar; no guarda historial permanente. Hasta 30 alumnos por sesión.

Para detalle, consulta [la arquitectura implementada](docs/arquitectura/implementacion-v0.5.0.md), el [alcance revisado](docs/producto/alcance-MVP-redisenio-v1.2.md) y la [enmienda al SRS](docs/requisitos/SRS-enmienda-modelo-servidor-proyeccion-v0.4.0.md).

## Incremento beta v0.4.0: archivos temporales

Se conserva la gestión de archivos de v0.4.0: máximo 50 MB por archivo, 200 MB por selección, 10 GB por sesión, dos transferencias simultáneas por usuario, descargas individuales y ZIP, permisos de eliminación por rol y actualizaciones con Socket.IO. El docente y los alumnos pueden utilizar archivos incluso cuando no hay docente conectado. Las descargas ahora se inician sin navegar fuera de `/docente`. Consulta [arquitectura de archivos](docs/arquitectura/modulo-archivos-v0.4.0.md).

## Acceso e identidad visual por rol

- `/docente`: accesible desde la LAN; el **primer navegador** obtiene el control cuando está libre. Un acceso nuevo sin credencial recibe HTTP 423 si está ocupado. No existe contraseña docente, por decisión del producto: **otra persona en la LAN puede apropiarse del rol si llega primero**.
- `/alumno`: ingreso mediante código y alias.
- `/proyeccion`: disponible **solo por loopback** desde la computadora fija y abierta en modo quiosco. No expone la transmisión a estaciones remotas.
- `/`: redirige a `/alumno`. Credencial docente privada en cookie `HttpOnly; SameSite=Strict` y `Secure` en HTTPS; el código de clase no da permisos administrativos.

## Vista del alumno — v0.5.6

Se implementó el rediseño UX/UI aprobado para escritorio y teléfono: bienvenida con alias, reloj local, botón naranja de proyección con estados, alerta lateral replegable con animación y paneles de archivos y observaciones. El teléfono **no muestra** acciones de proyección y mantiene los módulos de archivos y notas. La proyección voluntaria se solicita a través de un solo botón: **Solicitar permiso para proyectar → Cancelar solicitud → Iniciar proyección (autorización) → Proyectando**. El botón **Proyectando** permite detener la captura. El rótulo «Proyectando» se activa al establecerse WebRTC, no solamente al recibir la autorización. El servidor distingue la concesión desde la cola y la solicitud directa para mostrar la alerta roja solo en esta última. Véase [especificación UX/UI](docs/diseno/interfaz-alumno-v0.5.6.md).

## Flujo de presentación de pantalla

1. Docente autoriza su captura una vez mediante un gesto del navegador y el receptor del servidor muestra su pantalla predeterminada.
2. Alumno solicita entrar a la cola sin capturar ni transmitir video; el docente autoriza desde la cola o elige directamente.
3. Si el docente selecciona directamente al estudiante, se despliega el aviso «El profesor solicita que proyectes tu pantalla» con **Aceptar** y **Denegar**. Si autoriza desde la cola, el botón naranja pasa a **Iniciar proyección**. En ambos casos la captura requiere una acción explícita del estudiante.
4. El servidor autoriza una fuente exclusiva y cambia la negociación WebRTC hacia `/proyeccion`. Al detener el estudiante o perderse su conexión, vuelve a la pantalla del docente si está disponible.
5. Si el docente pierde conexión, continúa cualquier presentación estudiantil ya autorizada; las solicitudes siguientes permanecen en cola pero nadie recibe permiso automáticamente.
6. Al cerrar explícitamente la sesión se invalidan credenciales, cortan transferencias y elimina contenido temporal.

**Importante:** la incidencia histórica de cambio de alumno A→B requiere prueba de WebRTC y proyector físicos antes de considerarse corregida.

## Requisitos y puesta en marcha

Se requiere Node.js 20+, npm, certificados confiables en la LAN y navegador Chromium/Chrome/Edge en el equipo fijo. Los clientes remotos deben confiar en HTTPS antes de utilizar `getDisplayMedia`.

```bash
npm ci
npm test
npm run setup:https
npm run start:servidor
```

En otra terminal **del equipo fijo** ejecuta `npm run start:receptor` para abrir la pantalla de espera en modo quiosco. Para lanzar ambos procesos en una prueba local, el alias heredado `npm run start:docente` ahora **abre `/proyeccion`, no `/docente`**. En Linux se incluye `bash scripts/install-linux-autostart.sh` para configurar autoarranque de servicio y receptor gráfico al iniciar la sesión. Se requiere configuración del SO, sesión gráfica y ubicación de la ventana sobre el proyector. Consulta [guía de despliegue v0.5.0](docs/desarrollo/despliegue-servidor-fijo-v0.5.0.md).

## Pruebas

`npm test` ejecuta tests unitarios e integraciones HTTP/Socket.IO: identidad docente, 90 s, cola, concesión, cambio de fuente, archivos y limpieza al arrancar. Se necesitan pruebas manuales adicionales en la LAN, Windows, proyección real, caudal y cortes de red. Consulta [resultado verificado](docs/pruebas/resultado-beta-050.md).

## Documentación

Índice principal: [`docs/README.md`](docs/README.md). Se conserva la organización `docs/requisitos`, `docs/producto`, `docs/arquitectura`, `docs/diseno`, `docs/pruebas` y `docs/desarrollo`, junto con los documentos Word del rediseño y los documentos de alcance v1.1. El SRS original no ha sido sobrescrito.

## Límites conocidos

- El primer acceso sin contraseña **no comprueba que sea realmente un profesor**; utilizar solo una LAN confiable y una configuración operativa controlada.
- El navegador no puede compartir automáticamente pantalla sin acción del usuario; al cerrar la pestaña será necesario autorizar de nuevo la captura.
- El alumno que se desconecta debe reincorporarse y puede perder capacidad de eliminar archivos de su conexión anterior (el docente sí podrá hacerlo).
- No se incluye grabación, base de datos, servidor de medios ni soporte WAN. Los clientes Windows y el proyector físico requieren validación de laboratorio.

### Inicio automático de sesión docente (ajuste v0.5.0)

Al acceder a `/docente` desde el navegador autorizado, el servidor inicia la sesión de clase automáticamente al establecerse la conexión Socket.IO y muestra de inmediato el panel con el código de incorporación. No hay botón «Crear sesión». Una recarga recupera la misma sesión; «Finalizar sesión» sigue borrando los recursos temporales con confirmación. La captura de pantalla continúa requiriendo pulsar «Compartir mi pantalla». Consulta [el cambio funcional](docs/producto/inicio-automatico-sesion-docente-v0.5.0.md).


### Pantalla de acceso del proyector (v0.5.7)

Cuando no hay video activo, `/proyeccion` muestra las URL completas `/alumno` del servidor. La entrada Wi-Fi, si está disponible, tiene QR escaneable generado sin Internet. Para laboratorios con servidor solo Ethernet y teléfonos que llegan por Wi-Fi a esa IP, consulte [la guía](docs/diseno/pantalla-acceso-estudiantes-v0.5.7.md) y el ajuste opcional `INTERLAB_WIFI_ACCESS_IP`.
