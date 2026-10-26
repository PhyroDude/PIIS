# Backlog — solicitudes y presentación de pantalla

- **Base de código:** 0.3.0.
- **Estado:** historias derivadas de decisiones de producto; varias requieren validación manual antes de considerarse terminadas.
- **Límite:** este backlog no reemplaza el SRS ni cambia la prioridad formal de sus requisitos.

## PROY-01 — Solicitar turno de presentación

**Como** estudiante, **quiero** solicitar un turno para compartir mi pantalla, **para** que el docente pueda revisar mi trabajo sin que varios estudiantes transmitan al mismo tiempo.

**Criterios de aceptación**
- La solicitud requiere una acción explícita del estudiante y autorización del navegador.
- El estudiante aparece una sola vez en la cola.
- La cola refleja el orden de llegada.
- La solicitud no inicia transmisión de vídeo mientras espera.

## PROY-02 — Conceder turno desde la cola

**Como** docente, **quiero** conceder el turno a una solicitud, **para** decidir cuándo revisar la pantalla de cada estudiante.

**Criterios de aceptación**
- El docente puede conceder el turno a una persona visible en la cola.
- La persona seleccionada se elimina de la cola y se identifica por su alias.
- Solo una persona puede transmitir hacia la vista del docente.

## PROY-03 — Selección directa prioritaria

**Como** docente, **quiero** elegir directamente a cualquier participante, **para** atender una necesidad sin esperar su posición en la cola.

**Criterios de aceptación**
- La selección directa puede saltarse la cola.
- Si el estudiante ya estaba en la cola, se elimina la solicitud duplicada.
- Si no ha autorizado captura, el sistema espera su acción explícita antes de negociar WebRTC.

## PROY-04 — Cambiar de presentador sin arrastrar la conexión anterior

**Como** docente, **quiero** que al cambiar de A a B se cierre la transmisión de A y se muestre la de B, **para** revisar varios trabajos durante la misma sesión.

**Criterios de aceptación**
- Se cierra el peer anterior, se limpia el vídeo previo y se descartan candidatos ICE de la negociación anterior.
- Se inicia una negociación nueva con el estudiante seleccionado.
- Las señales tardías de A no pueden reemplazar la vista de B.
- El caso se prueba con A, B y C en secuencia en dos o más equipos reales.
- **Estado actual:** incidencia reportada: B no aparece tras cambiar desde A. No marcar como terminado hasta corregir y repetir la prueba.

## PROY-05 — Detener y liberar el turno

**Como** docente o estudiante, **quiero** detener la proyección o captura, **para** liberar recursos y permitir otro turno.

**Criterios de aceptación**
- Detener la proyección desde el docente limpia la vista y libera la selección.
- Detener captura desde el estudiante elimina su solicitud o libera el turno activo.
- No queda vídeo congelado ni conexión transmitiendo en segundo plano.

## PROY-06 — Ampliar la vista de presentación

**Como** docente, **quiero** poner la vista de presentación en pantalla completa, **para** observar mejor el trabajo compartido.

**Criterios de aceptación**
- El control responde a una acción explícita del docente.
- Se documenta qué área entra en pantalla completa y se confirma que satisface el requerimiento de ventana completa.
- Se prueba en los navegadores objetivo y se documenta cualquier limitación.
- **Estado actual:** el código tiene un control para el vídeo/contenedor; la validación de la vista esperada sigue pendiente.

## Dependencias y definición de terminado

La cola y la selección están presentes en la base 0.3.0, pero las historias PROY-04 y PROY-06 necesitan prueba de integración real. Una historia no se considera terminada solo porque exista el control o pasen las pruebas unitarias: requiere criterios de aceptación ejecutados y resultados registrados.
