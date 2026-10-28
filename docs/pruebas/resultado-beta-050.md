# InterLAB v0.5.0 beta — Resultados verificables

**Estado:** evaluación automatizada local, no aceptación definitiva en laboratorio.

## Ejecución

Comando: `node --test` (equivalente a `npm test`).

- **27 pruebas automatizadas: 27 aprobadas, 0 fallidas**.
- Tipos: unidades de `SessionStore`, rutas HTTP, reglas de FileStore, API de carga/descarga/ZIP, integración Socket.IO entre docente/estudiantes/receptor simulado, rotación de credenciales, continuidad de proyección al desconectarse docente, colas y limpieza de subdirectorios UUID después de reinicio.
- `node --check` de archivos JavaScript modificados: sintaxis válida.
- La prueba de navegador automatizado con Chromium/Playwright **no se completó**: el navegador devolvió `net::ERR_BLOCKED_BY_ADMINISTRATOR` al intentar abrir una URL localhost. No se dispone de evidencia de reproducción de video real en esta sesión.

## Verificado por pruebas de código

1. El docente que posee la cookie puede recuperar la misma sesión; otro navegador sin esa cookie no toma el control durante la vigencia de la credencial.
2. La sesión sobrevive al `disconnect` del socket docente y el plazo lógico es 90 segundos; pasados los 90 segundos el titular anterior deja de tener acceso administrativo y el código de clase/cola continúan.
3. El alumno puede pedir turno sin captura; iniciar video requiere selección del docente y confirmación posterior del alumno.
4. Un alumno ya autorizado continúa mientras el docente está desconectado; otro alumno puede solicitar turno y quedar en cola.
5. Al terminar el turno estudiantil, la fuente lógica preferida vuelve al docente. Se rechaza señalización con fuente o época inválida.
6. Un nuevo proceso limpia directorios temporales de sesiones anteriores identificados por UUID y conserva archivos ajenos a dichos directorios.
7. La API de archivos conserva los límites, permisos, ZIP, tickets y limpieza de la beta anterior.

## Pendiente antes de utilizar en clase

- Abrir una laptop docente y al menos dos equipos alumnos **Windows** en LAN real con HTTPS confiable y confirmar captura, SDP/ICE, video del docente, solicitud A, cambio a B y retorno al docente. Esta es la validación obligatoria para la incidencia histórica A→B.
- Conectar el equipo fijo al proyector real y probar que el navegador abre `/proyeccion` en pantalla completa tras un reinicio eléctrico, con sesión gráfica y certificado preparados.
- Medir concurrencia y prioridad de WebRTC frente a cargas/descargas de archivos grandes.
- Cronometrar en laboratorio desconexión docente: 0–30 s mensaje sin contador, 30–90 s cuenta regresiva de un minuto, 90 s expiración, y ausencia de overlay sobre video estudiantil.
- Desconexión accidental del alumno activo, rechazo de solicitud, navegador cerrado, renuncia al turno, alteración de cookies y recuperación administrativa excepcional.
- Verificar bloqueo de `/proyeccion` y del registro Socket.IO del receptor desde **otro equipo físico**, no solo localhost de las pruebas.
- Revisar seguridad operativa de primer acceso sin contraseña y el código estudiantil de cuatro dígitos; no exponer el servicio a Internet.

## Advertencia de seguridad

La opción aprobada «primer acceso adquiere rol docente» **no demuestra la identidad real** del profesor. La cookie evita reutilización casual pero no impide que otro usuario de la LAN reclame primero el rol cuando esté libre. Los procedimientos del laboratorio deben impedir accesos adelantados o no autorizados.
