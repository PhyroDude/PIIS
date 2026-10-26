# Changelog

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
