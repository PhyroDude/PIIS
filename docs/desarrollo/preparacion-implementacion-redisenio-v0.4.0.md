# Preparación de implementación — rediseño InterLAB v0.4.0

**Estado:** guía; los cambios **no están aplicados** al ZIP `InterLAB-v0.4.0-beta-docs-corregidos.zip`.

## 1. Base de código y referencias

La base oficial histórica es `PIIS(1).zip` = InterLAB v0.3.4. La versión funcional recibida posteriormente es InterLAB v0.4.0 beta con módulo de archivos. Este paquete **solo contiene documentación nueva** y no cambia código fuente, tests ni archivos originales. Se mantiene el árbol `docs/{requisitos,producto,arquitectura,diseno,pruebas,desarrollo}` sin reorganizar README principal.

## 2. Brechas obligatorias

- `server.js` deniega `/docente` y creación docente a conexiones remotas; debe sustituirse por política de primer acceso + autorización privada.
- `src/session-store.js` liga docente a `socket.id` y `removeSocket()` indica fin de sesión ante desconexión docente; debe separarse titular, sesión y conexión.
- Señalización WebRTC está entre docente y alumno; cambiar a emisor autorizado → receptor fijo, con cola sin conexiones o envío de video.
- `start-docente.js` abre `/docente` en host; sustituir por autoarranque de proceso + receptor `/proyeccion` fullscreen.
- Agregar expiración 30/90 s desde servidor y recepción de estado en `/proyeccion`.
- Receptor autenticado: no basta abrir `/proyeccion`; impedir que equipos de alumnos reciban video ajeno.
- `src/file-store.js`: conservar operaciones durante desconexión/vencimiento docente y añadir limpieza de temporales tras reinicio inesperado.
- Integrar, probar y documentar los dos fixes enviados aparte: aviso al alumno y descarga sin abandonar `/docente`.

## 3. Riesgos prioritarios

La política de primer acceso sin autenticación fuerte habilita suplantación de docente desde la LAN. Esta decisión está confirmada, pero el riesgo debe informarse y mitigarse operativamente (segmentación de red, acceso controlado), sin atribuir al sistema garantías que no existen. Las cookies protegidas evitan exposición casual de tokens, no convierten la opción C en autenticación de identidad. Controlar CSRF, conexiones Socket.IO, sesiones y tickets de descarga.

## 4. Pruebas antes de aceptar

Revisar `../pruebas/plan-redisenio-servidor-proyeccion-v0.4.0.md`. No dar por resuelto el defecto de transición A→B. Medir la prioridad de video con varias transferencias en LAN real. Probar fallos de energía, reinicios rápidos, tiempos de desconexión, señalización tardía, inicio sin monitor/GUI, confianza HTTPS en Windows y que las solicitudes no se autoricen solas.

## 5. Pendientes que NO se han decidido

Sistema operativo final y gestor de servicios; autocierre/reapertura del receptor y credencial local; detección exacta de caída docente vs caída de WebRTC; múltiples pestañas docentes en un perfil; rotación de credenciales; texto neutral cuando docente aún no captura; sincronización de señalización con interrupción del video docente; mecanismo de prevención de apropiación del primer acceso desde equipos no autorizados (más allá de aceptar ese riesgo), y decisión sobre compatibilidad de código de cuatro dígitos.

## 6. Orden sugerido

1. Reconciliar SRS, alcance y ADR nuevos con referencias históricas sin borrar originales.
2. Separar ciclo de sesión/rol de Socket.IO; añadir 90 s y cookies privadas.
3. Reorientar WebRTC al receptor fijo, con autorización por turno.
4. Integrar y probar continuidad de cola, archivos y proyección estudiantil con docente ausente.
5. Arranque automático/cierre/reinicio y limpieza segura de temporales.
6. Ejecutar pruebas manuales con equipo fijo, laptop docente, dos alumnos y proyector.
