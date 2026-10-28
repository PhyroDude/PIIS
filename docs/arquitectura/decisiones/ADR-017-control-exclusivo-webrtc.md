# ADR-017 — Arbitraje de video y exclusividad de turno WebRTC

**Estado:** reglas de producto confirmadas; mecanismo de negociación pendiente · **Fecha:** 2026-10-28

## Contexto
Antes el docente recibía video del estudiante. Ahora el receptor fijo muestra por defecto al docente y transitoriamente a un alumno. Debe evitarse saturación y repetir el defecto de cambio A→B.

## Decisión
Docente autorizado inicia captura por gesto explícito. Receptor fijo recibe video WebRTC del docente de forma predeterminada. Alumno no negocia al ingresar ni por entrar en cola. Solo tras concesión docente y aceptación/autorización del alumno se detiene la transmisión docente y se negocia alumno→receptor. Al terminar el alumno, se restablece docente si es posible, sin exigencia de reautorizar mientras captura viva. Alumno y docente autorizado pueden detener presentación estudiantil. Desconexión confirmada del alumno revoca sin gracia.

## Consecuencias
Conservar captura local no implica mantener el envío en segundo plano. Se propone generación de negociación para rechazar SDP/ICE tardíos. El orden exacto de conmutación y liberación de pistas debe ensayarse. El servicio no decodifica video en Node; el receptor sí.

## Validación
Proyectar docente, alumno A, B, regreso docente; cero streams simultáneos no autorizados; notificación directa; aceptación; desconexión alumno; video remoto en servidor fijo.
