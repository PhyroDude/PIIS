# InterLAB v0.5.0 — Botón alternable de captura docente

**Estado:** ajuste de interfaz y captura sobre la versión estable v0.5.0, con el modal de notas de 1000 caracteres. No cambia la arquitectura.

## Comportamiento

- Cuando el docente **no** está capturando su pantalla, el botón muestra **«Compartir mi pantalla»**.
- Tras seleccionar una pantalla o ventana, cambia a **«Dejar de compartir mi pantalla»**, con una descripción de detención y color diferenciado.
- Una nueva pulsación detiene las pistas `MediaStreamTrack` de la captura local, cierra el emisor WebRTC y notifica al servidor (`teacher:screen-ended`) si ya existe una sesión.
- Cuando el docente detiene el uso compartido desde el propio navegador, el botón también vuelve a «Compartir mi pantalla».
- La misma alternancia funciona **antes de crear una sesión** en `/docente`; en ese caso no se envían eventos de una sesión inexistente.
- El botón «Detener proyección actual» sigue siendo independiente: permite al docente detener la presentación de un alumno, sin confundirse con su propia captura.
- Si el alumno ya está proyectando, detener **la captura local del docente** no revoca el turno del alumno ni renueva su época de negociación.

## Archivos modificados

- `public/app.js`: control alternable y sincronización del estado.
- `public/index.html`: estado accesible `aria-pressed` inicial.
- `public/styles.css`: estilo distintivo para «Dejar de compartir».
- `server.js`: al recibir `teacher:screen-ended`, renueva `epoch` **solo si la fuente activa era el docente**.
- `tests/teacher-share-toggle.test.js`: regresiones de etiquetas, estado, detención, permiso previo a sesión y continuidad de alumno.

## Pruebas manuales recomendadas

1. Entrar a `/docente` y compartir pantalla antes de crear sesión. Verificar cambio de etiqueta.
2. Pulsar «Dejar de compartir mi pantalla»; verificar que el navegador deja de capturar y el botón vuelve a su estado inicial.
3. Volver a compartir y crear la sesión; confirmar recepción en `/proyeccion`.
4. Autorizar la pantalla de un alumno. Mientras presenta, detener la captura local docente; verificar que el alumno continúa proyectando.
5. Finalizar el turno del alumno; debe aparecer la pantalla de espera si el docente dejó de compartir. Reanudar captura docente.
6. Detener el uso compartido desde el botón de parada de captura del navegador, comprobar que el estado de la interfaz se restablece.

**Límite de validación:** los tests de UI no sustituyen pruebas de captura y reproducción WebRTC en dos computadoras reales.
