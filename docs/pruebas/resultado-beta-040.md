# Resultado de verificación automatizada — InterLAB v0.4.0 beta

**Fecha:** 28-10-2026. **Comando:** `npm test` en el proyecto ensamblado.

- Verificaciones de servidor y red local; control de acceso por rutas; creación, unión, observaciones y cola de proyección.
- Gestor temporal: reservas y topes de selección, nombres duplicados, catálogo, descarga individual y ZIP, tickets de un solo uso, permisos de eliminación, revocación de token y limpieza de sesión.
- Integración HTTP + Socket.IO: autenticación real, unión de docente/dos estudiantes, subida de dos archivos, lectura de lista, rechazo de eliminación indebida, descargas, ticket consumido, límite por archivo, cierre y revocación.

**Estado:** las 23 pruebas incluidas se ejecutaron y aprobaron en el entorno de generación con Node.js 22 y HTTPS deshabilitado **únicamente para pruebas locales**. No validan certificados HTTPS ni la calidad WebRTC.

**Comprobación visual:** se intentó abrir la aplicación con Chromium automatizado en este entorno, pero el acceso local fue bloqueado por una política del navegador (`ERR_BLOCKED_BY_ADMINISTRATOR`). No se da por validada la interacción visual.

**Aún pendiente:** validar con equipos Windows reales, Firefox/Chrome, navegador y servidor bajo HTTPS, carga/desconexión simultánea con WebRTC, aceleración/limitación de red, cambio de presentador A→B, ZIP grande en Windows, espacio físico insuficiente, apagado inesperado y limpieza de residuos huérfanos.
