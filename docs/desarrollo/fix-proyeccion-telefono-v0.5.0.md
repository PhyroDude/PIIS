# Fix de la vista docente: presentación no disponible desde teléfonos

**Base:** `InterLAB-v0.5.0-estable-fix-movil.zip` (derivada de la base estable designada por el responsable).  
**Versión:** 0.5.0, ajuste puntual.  
**Fecha:** 28 de octubre de 2026.

## Comportamiento

- En `/alumno`, los teléfonos mantienen deshabilitado el botón `Solicitar turno`, como en el ajuste anterior.
- Al incorporarse un alumno, la aplicación informa si se detectó un teléfono; el servidor lo comprueba también mediante el User-Agent de la conexión y lo asocia temporalmente al participante.
- En `/docente`, los teléfonos aparecen identificados como `📱 Teléfono`; el botón `Solicitar presentación` queda deshabilitado. Las computadoras mantienen disponible el botón.
- El servidor rechaza la solicitud de turno o selección directa si el alumno está registrado como teléfono. Evita crear una autorización que ese navegador no pueda completar.
- La gestión de archivos y las observaciones del alumno no se deshabilitan. `Dar nota` selecciona al destinatario de observaciones sin iniciar una presentación.
- La lista del docente se actualiza mediante el evento `participants:update` ya existente, sin añadir nuevos sockets.

## Limitación

La identificación de teléfono usa información declarada por el navegador; puede fallar cuando el agente de usuario se altera o se usa modo escritorio, y no es una prueba de identidad ni de seguridad.

## Archivos modificados

- `public/app.js`: envío de indicador y bloqueo del control docente.
- `src/session-store.js`: metadato del dispositivo, roster y validación de permisos.
- `server.js`: recibe y contrasta el indicador del navegador.
- `tests/mobile-teacher-projection.test.js`: cobertura del flujo del docente.
- `CHANGELOG.md`: registro de cambio.

## Validación

```bash
node --test tests/mobile-projection-ui.test.js tests/mobile-teacher-projection.test.js tests/session-store.test.js
```

También se deben hacer pruebas manuales con un teléfono y un equipo de escritorio conectados simultáneamente al laboratorio. La suite de integración que inicia el servidor requiere instalar previamente dependencias con `npm ci`.
