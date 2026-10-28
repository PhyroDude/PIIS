# Registro de decisiones confirmadas — rediseño InterLAB 0.4.0

**Estado:** acuerdos de producto confirmados en conversación; implementación de este rediseño pendiente.  
**Nota:** la numeración conversacional es indicativa; los ADR-015…020 son los registros arquitectónicos formales.

| Aspecto | Decisión confirmada | ADR |
|---|---|---|
| Infraestructura | InterLAB se ejecuta exclusivamente como servicio en una computadora fija dentro del laboratorio, distinta de la laptop docente. | 015 |
| Proyector | El proyector físico está conectado directamente a esa computadora fija; recibe video remoto por WebRTC desde la laptop del docente o un alumno autorizado. | 015, 017 |
| Inicio automático | Al encender el equipo fijo se inician el servicio y la vista receptora en pantalla completa; sin emisión muestra «Esperando al docente». | 015 |
| Rol docente | El primer navegador que ingresa a `/docente` cuando el rol está libre obtiene control, sin contraseña inicial. | 016, 020 |
| Recuperación mismo navegador | Cerrar/actualizar la pestaña no destruye sesión; mismo perfil con credencial privada recupera rol mientras siga válido. | 016, 019 |
| Recuperación local excepcional | El profesor puede liberar el rol desde equipo fijo cuando pierde credencial; no hace falta que nadie más se acerque al servidor para operación normal. | 016, 020 |
| Aviso durante ausencia | Los primeros 30 s se muestra «Esperando conexión» si no hay video estudiantil activo. | 016 |
| Cuenta regresiva | Desde 30 s se muestra contador de un minuto; a 90 s se invalida la credencial y aparece «Tiempo de espera concluido, esperando nuevo docente». | 016 |
| Transmisión estudiantil existente | Un alumno ya autorizado sigue proyectando aunque docente desconecte o expire; estado de espera se muestra solo después de que termine, si procede. | 017, 018 |
| Fin de presentación | Alumno siempre puede detener; docente autorizado puede detener; desconexión confirmada de alumno la termina y no reserva turno. | 017 |
| Disponibilidad sin docente | Continúan incorporación, archivos, cargas, descargas y transferencias activas. Solo nuevas concesiones de proyección quedan suspendidas. | 018 |
| Cola sin docente | Alumnos solicitan turno, cola espera hasta que docente conceda o rechace o alumno retire; no hay autorizaciones automáticas. | 018 |
| Cola y desconexión | Cuando alumno en cola se desconecta se retira su solicitud; al volver deberá solicitar de nuevo. | 018 |
| Prioridad | Video docente predeterminado; alumno obtiene permiso temporal por autorización docente y aceptación; regreso al docente al terminar si está disponible. | 017 |
| Captura docente | Docente pulsa «Compartir pantalla» y autoriza captura mediante gesto explícito; no inicia automáticamente solo por abrir URL. | 017 |
| Tokens distintos | El código visible corresponde a incorporación de alumnos; la credencial administrativa es secreta y distinta. | 016, 020 |
| Reinicio | Reiniciar servidor finaliza sesión anterior y borra temporales; no restaura sesión, credenciales ni cola. | 019 |
| Cierre explícito | Solo cierre confirmado de sesión invalida código y permisos y destruye recursos temporales. | 019 |

## Decisiones revisadas o sustituidas

- **Límite de 60 segundos:** sustituido por **90 segundos** (30 segundos sin contador + 60 segundos de cuenta regresiva).
- **Suspensión de todas las actividades:** sustituida por **suspensión exclusiva de nuevas autorizaciones de proyección**. Archivo y admisión continúan.
- **Interpretación «proyector físico = sin WebRTC»:** corregida expresamente. La computadora fija es receptora WebRTC y está conectada físicamente al proyector.
- **Servidor en laptop docente:** sustituido por servidor fijo y laptop docente cliente LAN.

## Pendientes técnicos (no confundir con decisiones confirmadas)

Autenticación técnica de `/proyeccion`, implementación de cookies, supervisor gráfico, detección de caídas, orden exacto de renegociación, reglas para múltiples pestañas, interacción de captura previa a sesión y tratamiento de fallo parcial de señalización. Véase [arquitectura objetivo](arquitectura-objetivo-servidor-y-proyeccion-v0.4.0.md).
