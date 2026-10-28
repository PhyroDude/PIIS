# InterLAB — Enmienda propuesta al SRS: servidor independiente y proyección priorizada

**Proyecto:** InterLAB v0.4.0 · **Base histórica:** InterLAB v0.3.4 (`PIIS(1).zip`)  
**Documento:** ENM-SRS-01 · **Versión:** 1.0 · **Fecha:** 28-10-2026  
**Estado:** decisiones de producto confirmadas; enmienda redactada, pendiente de revisión formal del SRS. **No modifica ni sustituye** `SRS-original.pdf`.

## 1. Propósito, fuente y control de cambios

Esta enmienda traduce a requisitos verificables las decisiones de las conversaciones del rediseño. El SRS original usa RF-001 a RF-012 y RNF-001 a RNF-008. Aquí se asignan **RF-013 a RF-036** y **RNF-009 a RNF-015** como identificadores de extensión propuestos, sin renumerar el original. Las referencias exactas del SRS original se conservan en la trazabilidad.

La enmienda altera explícitamente supuestos y arquitectura del MVP anterior: el servidor ya **no reside en el equipo docente**; el docente accede remotamente a `/docente`; el destino WebRTC es una **vista receptora en la máquina fija**, no la pestaña docente; y el proyector del laboratorio forma parte de la integración requerida. Los diagramas y textos históricos que digan lo contrario deben marcarse como reemplazados en una próxima consolidación formal, no editarse silenciosamente.

Los requisitos siguientes se refieren a comportamiento objetivo **no implementado ni validado todavía**. No debe inferirse que el código v0.4.0-beta los cumple.

## 2. Actores y límites

- **Servidor físico del laboratorio:** computadora fija que aloja el proceso InterLAB y está conectada al proyector. Mantiene sesión, permisos, cola, archivos y estado de presentación; abre automáticamente una vista receptora en pantalla completa.
- **Docente:** usa una laptop propia y accede por LAN a `/docente`; obtiene el control administrativo bajo la regla de primer acceso, autoriza captura y decide proyecciones.
- **Alumno:** accede a `/alumno`, introduce alias y código; no inicia negociación WebRTC por incorporarse. Puede solicitar un turno; proyecta solo con permiso docente temporal.
- **Vista receptora `/proyeccion`:** propuesta técnica para que el navegador de la computadora fija reciba el video WebRTC y lo muestre en el proyector. Su implementación exacta se documenta como propuesta arquitectónica, no como decisión de producto acerca de software específico.

## 3. Requisitos funcionales nuevos

| ID | Requisito verificable | Prioridad | Origen |
|---|---|---|---|
| RF-013 | El servicio InterLAB se inicia automáticamente al arrancar la computadora fija designada y no depende de una pestaña del docente. | Alta | Decisiones 1–3 |
| RF-014 | En la computadora fija se abre automáticamente la vista receptora en pantalla completa y, sin transmisión, muestra un estado de espera. | Alta | Decisión 3 |
| RF-015 | El acceso remoto a `/docente` está disponible desde la LAN, y el primer navegador autorizado cuando no existe titular docente recibe el control exclusivo. | Alta | Decisión 5 |
| RF-016 | Al primer acceso, el servidor emite una credencial administrativa privada y la vincula al navegador titular; el código para alumnos no autoriza administración. | Alta | Decisiones 4, 5 y 17 |
| RF-017 | El docente autoriza la captura de pantalla mediante un gesto explícito («Compartir pantalla»), y su video se recibe mediante WebRTC en la computadora fija. | Alta | Decisión 18 |
| RF-018 | El servidor crea y mantiene la sesión de clase y el código de incorporación, que permanece visible al docente mientras exista la sesión. | Alta | Decisiones 1, 17 |
| RF-019 | Actualizar o cerrar la pestaña docente no finaliza la sesión; el mismo perfil puede recuperar el control con una credencial válida. | Alta | Decisión 4 |
| RF-020 | Ante desconexión del docente, se reserva su control durante 90 s desde la detección; en los primeros 30 s la vista sin video muestra «Esperando conexión». | Alta | Decisión 8 revisada |
| RF-021 | Transcurridos los primeros 30 s sin reconexión, la vista sin video conserva «Esperando conexión» y muestra una cuenta regresiva desde 01:00 hasta 00:00. | Alta | Decisión 8 revisada |
| RF-022 | A los 90 s sin reconexión, el servidor invalida la credencial, libera el control docente y, sin video activo, muestra «Tiempo de espera concluido, esperando nuevo docente». | Alta | Decisión 8 revisada |
| RF-023 | La pérdida o expiración del docente no cierra la sesión ni elimina participantes, archivos, código de acceso o solicitudes pendientes. | Alta | Decisiones 7, 8, 13 |
| RF-024 | Los estudiantes pueden seguir incorporándose, subiendo, consultando, descargando y eliminando sus archivos permitidos durante la ausencia docente; las transferencias activas siguen. | Alta | Decisión 13 |
| RF-025 | Un alumno puede solicitar proyección aun sin docente; el servidor conserva la cola y no concede automáticamente nuevas proyecciones. | Alta | Decisiones 13, 14 |
| RF-026 | El alumno que se desconecta pierde automáticamente su solicitud pendiente; si reingresa, solicita de nuevo y ocupa nueva posición. | Alta | Decisión 15 |
| RF-027 | La pantalla docente es la fuente predeterminada; solo el docente concede proyección a un alumno desde la cola o por selección directa prioritaria. | Alta | Decisiones de presentación |
| RF-028 | Una solicitud directa del docente avisa al alumno; el alumno acepta y autoriza la captura antes de habilitar su transmisión. | Alta | Flujo confirmado |
| RF-029 | Mientras presenta un alumno autorizado, la transmisión del docente se detiene; no hay envío simultáneo innecesario ni negociación de video por alumnos que solo esperan turno. | Alta | Flujo confirmado |
| RF-030 | El alumno puede detener su propia proyección en todo momento; el docente puede revocar inmediatamente su turno. | Alta | Decisión 9 |
| RF-031 | Si el alumno que presenta se desconecta, su turno se revoca al confirmarse la desconexión y no se reserva; deberá solicitar nuevamente. | Alta | Decisión 10 |
| RF-032 | Una presentación de alumno ya concedida continúa aun durante los 90 s de reconexión docente y tras su vencimiento, hasta que el alumno o el docente autorizado la detengan, o el alumno pierda conexión. | Alta | Decisiones 12 y 13 |
| RF-033 | Cuando termina el turno estudiantil, el servidor devuelve prioridad al docente si está disponible; de lo contrario muestra el estado de espera que corresponda al tiempo transcurrido. | Alta | Flujo confirmado |
| RF-034 | El docente que recupera o adquiere control visualiza las solicitudes conservadas y decide autorizarlas, rechazarlas o esperar a que el estudiante las retire; ninguna se aprueba automáticamente. | Alta | Decisión 14 |
| RF-035 | Reiniciar el proceso/servidor invalida la sesión anterior y sus credenciales; al volver a iniciar, limpia recursos temporales previos y muestra «Esperando al docente». | Alta | Decisión 16 |
| RF-036 | El cierre explícito por el docente invalida credenciales y código, termina transmisiones/transferencias y elimina recursos temporales de la sesión. | Alta | RF-012 y nuevo modelo |

## 4. Requisitos no funcionales propuestos

| ID | Requisito de calidad y criterio de validación |
|---|---|
| RNF-009 | **Separación de ciclos de vida.** Cerrar, recargar o perder la conexión de `/docente` o `/proyeccion` no termina el servicio ni la sesión. Se comprueba con desconexiones deliberadas. |
| RNF-010 | **Exclusividad WebRTC.** Solo el presentador autorizado negocia video con el receptor; la revocación impide negociar o continuar enviando con una autorización anterior. Probar condiciones de carrera y mensajes tardíos. |
| RNF-011 | **Autoridad y confidencialidad.** El primer acceso al rol docente se determina en el servidor; las credenciales se transmiten por HTTPS, son privadas, no aparecen en URL ni en pantallas públicas y se invalidan como está definido. |
| RNF-012 | **Despliegue local.** El servidor y receptor inician automáticamente tras arranque y su operación principal no requiere Internet; deben comprobarse sistema operativo, sesión gráfica y certificados. |
| RNF-013 | **No persistencia tras reinicio.** La limpieza de archivos y cargas parciales huérfanas ocurre antes de permitir el uso; si el cierre fue abrupto, se recupera la limpieza al arrancar. |
| RNF-014 | **Precisión temporal.** Los 30 y 90 s se computan en el servidor con un reloj monotónico o equivalente; la vista solo presenta valores recibidos/derivados del plazo servidor, sin reiniciar el plazo por abrir pestañas. |
| RNF-015 | **Transiciones seguras.** En sustituciones de presentador y reconexiones no se muestra video de un participante no autorizado; debe validarse en una LAN real con docente, dos alumnos, servidor y proyector. |

## 5. Reglas de negocio y excepciones

**RB-N01.** Solo una persona puede ejercer el control docente a la vez. Cuando no hay titular o expiró, lo obtiene el primer navegador que acceda a `/docente`; **esto no autentica la identidad profesional** y permite apropiación del rol por quien llegue antes. Es una elección explícita del producto, con riesgo documentado.

**RB-N02.** Si el navegador docente pierde la credencial (por borrar cookies), **no puede recuperar el control reservado**; espera el vencimiento o realiza la liberación local excepcional. Acceso físico al servidor para liberación manual queda reservado al propio profesor y debe requerir una acción local deliberada. La liberación manual detiene el video del titular anterior, pero conserva la sesión.

**RB-N03.** El temporizador docente es independiente del estado de video: si un alumno presenta, el receptor continúa mostrándolo y oculta pantalla/contador; los plazos siguen transcurriendo. Al finalizar el turno, muestra el estado temporal correcto, sin reiniciar 90 s.

**RB-N04.** Expiración administrativa ≠ cierre de sesión. No se suspenden archivos, altas ni nuevas solicitudes; **solo las nuevas concesiones** de proyección requieren un docente conectado y autorizado.

**RB-N05.** El cierre explícito de la sesión y el reinicio del servidor sí destruyen contenido temporal. La credencial privada del docente y el código visible para alumnos tienen propósitos distintos.

**RB-N06.** Pérdida de video o cierre de la vista `/proyeccion` no equivale necesariamente a desconexión del docente; las causas deben modelarse separadas y no detonar automáticamente los 90 s sin evidencia de desconexión docente.

## 6. Impacto formal sobre el SRS original

| Elemento del SRS original | Tratamiento en esta enmienda |
|---|---|
| RF-001, RF-002, RF-003, RF-012 | Se mantienen; su implementación debe respetar sesión en servidor y cierre explícito. |
| RF-004, RF-005, RF-006 | Se mantienen como funciones de retroalimentación; el receptor de video y el rol docente cambian de dispositivo. |
| RF-007 a RF-011 | Se mantienen; la proyección grupal y las observaciones no se confunden con enviar video WebRTC. |
| RNF-001, RNF-004, RNF-006, RNF-008 | Se complementan con continuidad del servicio, control de autorización y operación LAN sin Internet. |
| SRS §7 y §14.4 (proyector fuera del MVP inicial) | **Cambio solicitado:** el receptor conectado a proyector pasa al alcance de este rediseño. Requiere aprobación en una revisión formal del SRS. |
| Despliegue en computadora docente en documentación posterior | **Reemplazado por decisión confirmada:** equipo fijo del laboratorio, independiente de laptop docente. |

## 7. Criterios generales de aceptación

Para dar por aceptada esta enmienda hay que comprobar: (1) continuidad de sesión al cerrar `/docente`; (2) reconexión antes de 90 s; (3) contador mostrado solo desde 30 s y nunca encima de un alumno; (4) credencial revocada después de 90 s; (5) acceso nuevo por primer navegador; (6) carga/descarga y solicitudes sin docente; (7) cola y presentación existente conservadas; (8) reinicio que elimina archivos; (9) proyección segura A→B; (10) control total del fin de proyección por alumno o docente.

## 8. Pendientes explícitos — no aprobados por esta enmienda

- Sistema operativo de la computadora fija, arranque con sesión gráfica y supervisión/reapertura del receptor.
- Procedimiento exacto de recuperación manual local y cómo impedir su ejecución remota.
- Política ante dos pestañas del mismo navegador docente; almacenamiento y renovación de cookie.
- Definición de desconexión detectable (Socket.IO, heartbeat, WebRTC) y retraso tolerado.
- Comportamiento ante desvanecimiento de video con control Socket.IO todavía vivo.
- Procedimiento seguro de transición entre captura docente y estudiante sin blackout prolongado.
- Tratamiento de observaciones escritas cuando desaparece el docente y política de retención de estudiantes reconectados.
- Validación de certificados en Windows; recursos de red y caudal con archivos activos.

**Fuentes internas:** `SRS-original.pdf`, `InterLAB_Requisitos_Modulo_Archivos_v0.1.md`, alcance v1.1, decisiones de producto tomadas para el rediseño y código de InterLAB 0.4.0 beta (solo como diagnóstico de brechas).
