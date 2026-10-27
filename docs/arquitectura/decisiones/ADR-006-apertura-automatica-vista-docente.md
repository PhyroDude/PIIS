# ADR-006: Apertura automática de la vista docente

- **Estado:** Aceptada para el MVP v0.3.0.
- **Fecha:** 24 de octubre de 2026.

## Contexto

La computadora anfitriona pertenece al docente. Al iniciar el servicio, el recorrido esperado en ese equipo es el acceso docente, mientras que los equipos cliente deben entrar como estudiantes.

## Decisión

Añadir el comando `npm run start:docente`, que inicia el servidor y trata de abrir `https://localhost:3000/docente` en el navegador predeterminado del anfitrión. `PORT` y `HOST` pueden configurarse mediante variables de entorno. `npm start` permanece disponible para iniciar el servidor sin abrir el navegador.

## Consecuencias y límites

- Si el navegador no se abre automáticamente, la URL puede abrirse manualmente.
- El comando requiere un entorno gráfico y un abridor de URL disponible (`start` en Windows, `open` en macOS o `xdg-open` en Linux).
- La apertura automática solo ocurre en el equipo donde se ejecuta el comando; no redirige a los clientes LAN.
- El inicio automático no constituye autenticación ni protección de la vista docente.
