# InterLAB — Plan de pruebas del rediseño de servidor y proyección v0.4.0

**Estado:** por ejecutar; todos los casos listados **PENDIENTES**.  
**Entorno mínimo:** computadora fija con servicio y proyector, laptop docente, dos laptops alumnos y una LAN de laboratorio. Para pruebas de colas, tres alumnos; navegador/es certificados confiables y registro de eventos.  
**No reutilizar** como «aprobados» los 23 tests del módulo de archivos beta: no prueban este rediseño ni su integración WebRTC en LAN.

## A. Arranque, rutas y propiedad

| ID | Acción | Resultado esperado |
|---|---|---|
| INT-01 | Encender equipo fijo con proyector; no abrir otra pestaña | Servicio y `/proyeccion` se abren automáticamente en fullscreen con «Esperando al docente». |
| INT-02 | Cerrar solo receptor y volverlo a abrir | Sesión, archivos y participantes no se destruyen; receptor vuelve a sincronizar estado de presentación. |
| AUT-01 | Desde laptop docente entrar a `/docente` por HTTPS LAN | Primer navegador obtiene control; no hay 403 por ser remoto; puede crear sesión. |
| AUT-02 | Abrir `/docente` en segundo dispositivo mientras titular vive | Segundo no adquiere permisos ni tokens, sin importar acceso a URL. |
| AUT-03 | Intentar leer `/proyeccion` desde alumno o reinyectar WebRTC | Acceso a video bloqueado; receptor autorizado exclusivamente. |
| AUT-04 | Reutilizar credencial docente revocada | Operaciones administrativas y señalización rechazadas. |

## B. Sesión y reconexión docente

| ID | Acción | Resultado esperado |
|---|---|---|
| SES-01 | Crear sesión, leer código visible y entrar como alumno | Código solo incorpora; credencial docente privada no se muestra al grupo. |
| REC-01 | Refrescar pestaña docente durante sesión | Sin cierre; mismo perfil recupera y ve código/alumnos/cola/archivos. |
| REC-02 | Cerrar pestaña docente y reconectar a los 20 s con cookie | Mismo docente recupera; se cancela temporizador; se solicita nueva captura si fue cerrada. |
| REC-03 | Desconectar docente y observar proyector sin alumno activo de 0 a 29 s | Muestra «Esperando conexión», sin contador. |
| REC-04 | Mantener desconectado 30 a 89 s | Debajo del mensaje, contador de 01:00 a 00:01 aprox. sobre plazo del servidor. |
| REC-05 | Mantener desconectado ≥90 s | Credencial revocada y «Tiempo de espera concluido, esperando nuevo docente». Sesión intacta. |
| REC-06 | Borrar cookie antes de 90 s y volver a acceder | No recupera reserva del docente; no obtiene segunda credencial antes de expiración. |
| REC-07 | Expirar y entrar desde otro navegador | Nuevo primer acceso obtiene control de sesión existente y observa cola/archivos. |
| REC-08 | Desconectar docente sin cortar receptor y recargar receptor | Receptor no altera plazo ni se considera nueva sesión. |

## C. WebRTC y arbitraje de pantallas

| ID | Acción | Resultado esperado |
|---|---|---|
| VID-01 | Docente carga `/docente` sin pulsar compartir | No se inicia captura; servidor espera acción explícita. |
| VID-02 | Docente autoriza compartir y crea/usa sesión | Receptor fijo ve pantalla docente; no la recibe una pestaña docente local. |
| VID-03 | Alumno ingresa y pide turno | No hay WebRTC/stream del alumno hasta autorización y aceptación. |
| VID-04 | Docente concede turno alumno A, A autoriza captura | Se detiene envío docente, empieza A; solo A se visualiza. |
| VID-05 | Docente selecciona directamente B mientras A presenta | Se cierra A, nueva negociación B, sin video mezclado ni defecto A→B; señales tardías de A rechazadas. |
| VID-06 | Alumno detiene su propia captura | Turno liberado inmediatamente; vuelve docente o aviso de espera. |
| VID-07 | Docente detiene proyección del alumno | A pierde permiso; se cierra WebRTC, retorna docente o espera. |
| VID-08 | Desconectar alumno activo | Turno revocado al confirmarse desconexión; reconectado debe solicitar nuevamente. |
| VID-09 | Docente desconecta durante video de alumno, esperar >90 s | Alumno sigue sin superposición de mensaje/temporizador; al terminar ve «Esperando nuevo docente». |
| VID-10 | Docente reconecta mientras alumno presenta | Alumno no se interrumpe; docente ve control y puede detenerlo. |
| VID-11 | Intercambio rápido A→B→docente con pérdida/reordenación de señal | Solo generación actual de negociación; cero video no autorizado ni transmisiones residuales. |

## D. Cola y actividades sin docente

| ID | Acción | Resultado esperado |
|---|---|---|
| COL-01 | Sin docente, A/B/C solicitan turno en ese orden | Cola FIFO, sin autorización automática ni negociación de video. |
| COL-02 | Docente vuelve, examina cola | Persiste A/B/C y el docente elige sin concesiones automáticas. |
| COL-03 | Alumno B en cola se desconecta | B desaparece, A/C mantienen orden. |
| COL-04 | B se reconecta y pide turno | Entra al final; no conserva lugar anterior. |
| COL-05 | Alumno retira su propia solicitud | Se elimina una vez y se notifica el cambio. |
| COL-06 | Docente selecciona C directamente con A en cola | C tiene prioridad; A sigue pendiente y no transmite. |
| COL-07 | Docente expira mientras A presenta y B espera | A continúa; B sigue pendiente sin permiso; no se borra cola. |

## E. Archivos, limpieza y seguridad

| ID | Acción | Resultado esperado |
|---|---|---|
| ARC-01 | Durante ausencia y expiración docente, alumno nuevo ingresa, sube y descarga | Permitido; archivos visibles según rol, límites existentes respetados. |
| ARC-02 | Transferencia de 40 MB en curso durante 90 s de ausencia docente | Continúa; no se cancela por expiración de credencial docente. |
| ARC-03 | Cargar archivos mientras alumno presenta video | Transferencias limitadas por política de prioridad; video utilizable sin saturación. |
| LIM-01 | Docente autorizado cierra sesión con descargas y uploads activos | Invalida tickets/código, detiene streams, elimina archivos completos y `.part`; no reaparecen. |
| LIM-02 | Reiniciar proceso con sesión, cola y archivos | No se restaura sesión/cola; se borran temporales propios antes de aceptar conexiones. |
| LIM-03 | Matar proceso abruptamente durante upload y reiniciar | Limpieza de huérfanos; no quedan datos accesibles de sesión anterior. |
| LIM-04 | Profesor ejecuta recuperación administrativa local | Titular viejo se revoca, video termina, sesión permanece; acceso remoto equivalente es rechazado. |
| SEG-01 | Equipo alumno intenta primero `/docente` | Documentar que adquiere el rol bajo política acordada: riesgo de suplantación, no marcar sistema como autenticado. |
| SEG-02 | Dos clientes intentan simultáneamente primer acceso | Exactamente uno adquiere control; otro es rechazado. |

## F. Criterio de salida

Requiere cero fallos críticos en permisos/limpieza, casos VID-05 y VID-11 validados con dos alumnos, y pruebas de REC-01…07 y ARC-01…03 en equipos reales. Registrar SO, navegador, fecha, IP de la red, certificado, latencia, fallos y evidencia. **Sin ejecución registrada, el estado es pendiente**.
