# InterLAB — Historial de cambios

## 0.4.0 (beta) — Módulo temporal de archivos

- **Nueva base oficial:** `PIIS(1).zip`, asignado por el responsable a **InterLAB v0.3.4**, reemplaza el punto de partida anterior. Se preservan HTTPS, rutas, control de sesión, cola y WebRTC.
- Resolución de conflictos Git presentes en el ZIP de origen. `package.json` y lockfile normalizados a 0.4.0. Código de sesión heredado: cuatro dígitos del 1 al 9.
- Gestión temporal de archivos con HTTP streaming, permisos de docente/estudiante, cuota compartida, carga múltiple, cola/progreso, descargas individuales y ZIP sin compresión, búsqueda y orden, actualización por Socket.IO, limpieza al cierre y restricción de caudal durante proyección.
- Se incluyen el alcance v1.1 en Markdown y Word, requisitos consolidados v0.1, ADR-011 a ADR-014, diagramas y pruebas.
- **Seguridad:** credenciales temporales para API, tickets de descarga de un uso, archivos fuera de `public/`, sin claves/certificados incluidos. La generación HTTPS usa OpenSSL en Linux por defecto y mantiene mkcert alternativo.
- Pruebas automatizadas de la beta: 23 aprobadas en entorno local. Pendientes: pruebas de LAN real/Windows/HTTPS, caudal WebRTC, A→B, fallos severos y limpieza de huérfanos.

---

> **Nota sobre historial heredado:** `PIIS(1).zip` tenía versiones y documentación en conflicto (0.3.3, 0.3.4 y 0.3.5). Por decisión del responsable, se considera conjuntamente **v0.3.4** como línea base; los encabezados históricos siguientes se conservan por trazabilidad, **no** como nuevas bases oficiales.

## 0.3.4

- Se incorpora `scripts/setup-https-linux.sh` para automatizar en Linux la preparación de la CA local de `mkcert` y la generación de certificados HTTPS para localhost y las IPv4 LAN detectadas.
- `npm run setup:https` invoca el script Bash; se actualizan instrucciones de puesta en marcha.
- La confianza en los equipos cliente sigue requiriendo distribución del certificado raíz por un procedimiento autorizado; la clave privada de la CA nunca debe compartirse.

# Changelog

## 0.3.5

- Se sustituye la generación HTTPS con mkcert por OpenSSL, sin requerir una CA local.
- El script genera un certificado autofirmado con SAN para localhost y las IPv4 LAN detectadas.
- Se actualizan la guía de puesta en marcha, README, arquitectura y ADR-009 para explicar la advertencia y la verificación del contexto seguro.
- La captura desde navegadores cliente sigue pendiente de validación manual; si `window.isSecureContext` es `false`, deberá configurarse confianza explícita del certificado.


## 0.2.0 — Integración de gestión de observaciones

- Se conserva la base inicial de sesión temporal, código y alias.
- Se separa la lógica de sesión en `src/session-store.js`.
- Se añaden observaciones individuales opcionales con límite de 1,000 caracteres.
- Se añade consulta de notas propias para el estudiante.
- Se añade captura de pantalla mediante permiso explícito del navegador y señalización WebRTC bajo demanda.
- Se añade control de pantalla completa para la vista del docente.
- Copiar/descargar notas queda condicionado a `ENABLE_NOTE_EXPORT` y deshabilitado por defecto.
- Se integra documentación de alcance, backlog, diseño, decisión, trazabilidad y puesta en marcha.


## 0.2.1 — Control de transmisión exclusiva

- Al cambiar de estudiante, el servidor notifica al anterior para cerrar su conexión WebRTC.
- El estudiante cierra la conexión que enviaba vídeo y descarta candidatos ICE pendientes; la captura autorizada puede mantenerse abierta sin transmitir paquetes de vídeo.
- Se ignoran ofertas/candidatos que lleguen después de invalidar la selección.
- Al detener manualmente la compartición, el servidor elimina la selección activa para impedir que se inicie otra transmisión hacia ese estudiante hasta que el docente lo vuelva a seleccionar.
- La corrección requiere validación manual con varios navegadores/equipos; las pruebas unitarias existentes no verifican el comportamiento real de WebRTC en la LAN.

## 0.3.0 — Cola de presentación y concesión exclusiva

- El botón del estudiante solicita autorización de captura y registra una solicitud en la cola; no inicia por sí solo una conexión WebRTC.
- El docente puede conceder acceso desde la cola en orden de llegada.
- La selección directa desde la lista de participantes conserva prioridad y puede saltarse la cola.
- El servidor mantiene un único estudiante seleccionado y solo permite señalización WebRTC con ese estudiante que ya autorizó la captura.
- El docente puede detener la proyección activa; detener la captura del alumno elimina su solicitud o libera el turno activo.
- Se añadieron pruebas unitarias para cola, prioridad directa, autorización pendiente y liberación del turno.


## Actualización documental sobre la base 0.3.0

- Se documenta la decisión de arquitectura local en ADR-001: aplicación web servida desde la computadora del docente, LAN, clientes Windows previstos y estado temporal en memoria.
- Se detalla el flujo de presentación: solicitud de turno, autorización explícita del navegador, cola por orden de llegada, concesión del docente y selección directa prioritaria.
- Se añade un backlog específico de proyección y casos de prueba para A→B, C, detención y pantalla completa.
- Se registra como incidencia abierta el fallo reportado al cambiar de A a B; no se declara resuelto sin prueba real entre equipos.
- Se aclara que la base 0.3.0 sirve HTTP y necesita una terminación HTTPS confiable externa para captura de pantalla en clientes remotos. No se cambia el código ni se crea una nueva versión de la aplicación con esta actualización documental.

## Incremento de interfaz: acceso separado por rol

- Se separaron los formularios de creación de sesión docente y de incorporación estudiantil en pantallas de acceso distintas.
- Se añadió navegación para volver al selector de rol antes de enviar los formularios.
- Se definieron paletas diferenciadas: azul oscuro para docente y verde azulado para estudiante.
- Se conserva la validación de operaciones en el servidor; el cambio visual no añade autenticación institucional.
- Se añadieron ADR-004, documento de diseño y backlog de acceso por rol.
- Pendiente: validar usabilidad, contraste y adaptación en escritorio y móvil.


## Incremento: rutas directas y arranque docente sobre la base v0.3.0

- Se añadieron las rutas `/docente` y `/alumno`, que sirven la misma aplicación y muestran directamente el acceso correspondiente al rol.
- Se conserva `/` como selector general de rol.
- Se añadió `npm run start:docente` para iniciar el servidor y abrir la ruta docente en el navegador del anfitrión cuando existe un abridor de URL disponible.
- Se documentó el acceso de estudiantes mediante la IP LAN del anfitrión y `/alumno`.
- Se añadieron ADR-005 y ADR-006; ADR-007 aclara que la paleta por rol sigue siendo provisional y pendiente de aprobación.
- Se añadió una prueba automatizada para comprobar las respuestas HTTP de ambas rutas. La integración real entre equipos, la apertura automática y la revisión visual continúan pendientes.
- Se mantiene la base del proyecto en v0.3.0; no se adopta una versión posterior como referencia.


## Ajuste de despliegue LAN sobre la base v0.3.0

- El servidor escucha por defecto en todas las interfaces (`0.0.0.0`) y detecta/imprime las direcciones IPv4 disponibles al iniciar.
- `npm run start:docente` conserva la apertura automática de `/docente` en el anfitrión; la consola lista direcciones candidatas `/alumno` para clientes.
- `/docente` devuelve HTTP 403 a solicitudes remotas; `/` y `/index.html` redirigen a `/docente` en el host y a `/alumno` en solicitudes remotas. El evento de creación de sesión docente también rechaza conexiones Socket.IO remotas.
- Se añadieron pruebas unitarias para el descubrimiento de IP y detección de loopback.
- Se documenta que la restricción de ruta no reemplaza la autenticación/autorización de eventos Socket.IO.
- Sigue pendiente validar el acceso desde equipos físicos de la LAN y HTTPS confiable para captura remota.
- Se conserva la línea base de producto v0.3.0; este incremento no se etiqueta como versión nueva.

## 0.3.3 — HTTPS confiable para proyección en LAN

- Se avanza el conteo de versiones desde la base 0.3.0; no se recuperan los cambios descartados posteriores a esa base.
- El servidor usa HTTPS por defecto y requiere certificados locales en `certs/`.
- Se añade `npm run setup:https`, que usa `mkcert` para crear un certificado para `localhost`, loopback y las IPv4 LAN detectadas.
- `start:docente` abre la URL HTTPS del host por defecto y la consola anuncia direcciones HTTPS para alumnos.
- Se documenta la instalación de la CA raíz en Windows y se excluyen los certificados y claves locales del control de versiones.
- `HTTPS_ENABLED=false` queda disponible para pruebas HTTP automatizadas locales; no es una configuración válida para proyección remota.
- Pendiente de validación real: instalación de confianza en clientes Windows, captura `getDisplayMedia()` en Firefox y proyección WebRTC en la LAN. La habilitación de HTTPS no resuelve por sí sola el defecto reportado en el cambio de A a B.
