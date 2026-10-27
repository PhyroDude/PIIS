# ADR-005: Rutas de acceso por rol

- **Estado:** Aceptada para el MVP v0.3.0.
- **Fecha:** 24 de octubre de 2026.

## Contexto

El equipo anfitrión es la computadora del docente; los demás equipos acceden como estudiantes desde la LAN. Un selector común obliga a elegir rol en todos los equipos y facilita que el acceso inicial no corresponda al uso esperado.

## Decisión

La misma aplicación web ofrecerá rutas explícitas:

- `/docente`: muestra directamente el acceso para crear la sesión docente.
- `/alumno`: muestra directamente el formulario de incorporación con código y alias temporal.
- `/`: conserva el selector de rol como entrada general o de desarrollo.

Las rutas no crean una sesión ni incorporan usuarios por sí mismas; eso ocurre al enviar el formulario correspondiente.

## Consecuencias

- El docente puede abrir `https://localhost:3000/docente` en la computadora anfitriona.
- Los estudiantes abren `http://IP-LAN-DEL-DOCENTE:3000/alumno` desde sus equipos.
- Ambas rutas sirven el mismo cliente y usan el mismo servidor, estado temporal y canal Socket.IO.
- Las rutas son navegación, no autenticación. La autorización de operaciones debe seguir validándose en el servidor.
