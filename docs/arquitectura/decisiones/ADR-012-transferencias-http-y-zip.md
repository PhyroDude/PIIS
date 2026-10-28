# ADR-012 — HTTP streaming, Socket.IO y generación ZIP

**Fecha:** 2026-10-28 · **Estado:** decisión técnica adoptada para la beta, pendiente de validación en LAN real · **Código:** v0.4.0 (basado en PIIS v0.3.4)

## Contexto
Se necesitan cargas con progreso independiente, descargas individuales y múltiples como ZIP, actualizaciones automáticas de listas y un máximo de dos transferencias simultáneas por participante. Socket.IO ya coordina la sesión y WebRTC envía vídeo entre navegadores.

## Decisión adoptada
- **HTTP con streaming** para recibir y entregar bytes; cola de carga por participante en navegador y verificación de límites también en servidor.
- **Socket.IO** para metadatos, operaciones autorizadas, alertas y cambios de catálogo. No enviar contenido binario de documentos en mensajes Socket.IO.
- **ZIP generado al vuelo** y transmitido al navegador: sin copia completa del ZIP en RAM ni archivo ZIP temporal por defecto. Nombres repetidos reciben entradas únicas en el ZIP.
- **Acceso HTTP autenticado** mediante credenciales temporales/tickets de alcance restringido emitidos después de confirmar participación y rol en sesión. No usar el alias ni el código de sesión como autorización de descarga.

## Alternativas
- Enviar archivos por WebRTC: mezcla datos con vídeo y complica la prioridad de pantalla.
- Socket.IO para bytes: aumenta memoria y dificulta streaming/HTTP nativo.
- Generar ZIP completo en disco: requiere espacio adicional y limpieza de archivos intermedios.

## Consecuencias y validación
Se eligió HTTP binario por archivo y ZIP sin compresión por streaming implementados con la biblioteca estándar de Node.js. Quedan por ejecutar pruebas de abortos, ZIP grande, interoperabilidad y nombres maliciosos en Windows. En Windows, la eliminación de archivo activo exige bajar lógicamente el registro y liberar físicamente tras cerrar lectores. **Implementación beta:** existe código y pruebas automatizadas; quedan pendientes las pruebas de LAN, navegadores Windows y fallos de energía.


> **Control documental:** numeración ajustada porque la base PIIS v0.3.4 ya utiliza ADR-009 y ADR-010 para HTTPS. El documento de preparación anterior usaba IDs distintos; se conserva la trazabilidad sin sobrescribir decisiones históricas.
