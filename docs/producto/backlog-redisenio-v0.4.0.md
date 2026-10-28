# InterLAB — Product Backlog incremental del rediseño 0.4.0

**Estado:** historias redactadas, pendientes de implementación y aceptación.  
**Conservar:** HU-01 a HU-19 del alcance v1.1 como referencia histórica; estas historias nuevas son HU-20 a HU-30.  
**Advertencia:** las historias anteriores de presentación «docente receptor» requieren revisión de criterios afectados; no deben considerarse válidas tal cual para nuevo destino WebRTC.

## 1. Historias de usuario nuevas

### HU-20 — Arranque autónomo del servidor y receptor
**Como** profesor del laboratorio, **quiero** que al encender la computadora fija inicie InterLAB y una vista de proyección a pantalla completa, **para** no depender de abrir manualmente la aplicación.

**Aceptación:** servicio accesible sin abrir `/docente`; receptor muestra «Esperando al docente»; cerrar receptor no cierra sesión; reinicio permite abrir receptor.

### HU-21 — Adquirir control docente desde laptop
**Como** docente, **quiero** ingresar a `/docente` desde mi laptop y obtener control si no hay otro titular, **para** administrar la clase a distancia.

**Aceptación:** primera toma de rol atómica, cookie privada, segundo equipo rechazado como titular; rutas remotas accesibles por LAN con controles.

### HU-22 — Recuperar la sesión docente sin borrar el contenido
**Como** docente, **quiero** recuperar mis permisos después de actualizar/cerrar la pestaña, **para** continuar la clase sin crear otra sesión.

**Aceptación:** sesión conserva código, alumnos, observaciones, archivos y cola; con misma credencial recupera antes de 90 s, aun en nueva pestaña del mismo perfil.

### HU-23 — Señalizar desconexión con aviso y tiempo de gracia
**Como** público de la clase, **quiero** saber cuándo se espera al docente, **para** comprender la ausencia de imagen.

**Aceptación:** 0–30 s «Esperando conexión»; 30–90 s contador de 60 s; a 90 s «Tiempo de espera concluido, esperando nuevo docente». Si alumno presenta no se muestra aviso ni contador, pero sigue el plazo real.

### HU-24 — Proyectar la pantalla docente por WebRTC
**Como** docente, **quiero** autorizar mi captura desde mi laptop y enviarla al receptor fijo, **para** presentar mi trabajo al grupo.

**Aceptación:** gesto obligatorio «Compartir pantalla»; video llega a `/proyeccion` en equipo fijo, no al docente; sin permiso no se transmite.

### HU-25 — Conceder turno temporal al alumno
**Como** docente, **quiero** conceder turno desde cola o seleccionar directamente a un alumno, **para** permitirle presentar temporalmente.

**Aceptación:** notificación visible y aceptación del alumno; servidor solo negocia después de autorización; se detiene transmisión docente; regreso docente al terminar; no dos fuentes activas.

### HU-26 — Finalizar presentación con doble control
**Como** estudiante, **quiero** detener mi presentación cuando termine, **para** no compartir más mi pantalla; **como** docente, **quiero** poder detenerla también.

**Aceptación:** cualquiera de ambos termina turno; desconexión alumno lo revoca inmediatamente al confirmarse; mensaje tardío no restablece video antiguo.

### HU-27 — Continuar la clase durante la ausencia del docente
**Como** alumno, **quiero** permanecer en sesión, compartir archivos y solicitar turno aunque el docente no esté, **para** no perder mi trabajo.

**Aceptación:** altas, archivos y transferencias continúan; solicitudes en cola no se conceden sin docente; presentación ya activa sigue incluso después de 90 s.

### HU-28 — Gestionar cola pendiente y desconexiones
**Como** docente, **quiero** revisar las solicitudes acumuladas al recuperar el control, **para** decidir su resolución.

**Aceptación:** cola FIFO persistente, sin aprobación automática, retiro voluntario, retiro automático de solicitud pendiente al confirmarse desconexión del alumno, prioridad de selección directa.

### HU-29 — Limpiar tras reinicio o cierre
**Como** responsable de operación, **quiero** que un reinicio elimine sesiones y archivos previos, **para** empezar limpio sin recuperar datos.

**Aceptación:** sin sesión al reiniciar, invalidación código/credenciales, borrado de binarios y `.part` de directorio propio, vista «Esperando al docente»; cierre normal interrumpe stream y descargas.

### HU-30 — Recuperar excepcionalmente el control desde el equipo fijo
**Como** profesor, **quiero** liberar manualmente un control docente perdido desde el servidor, **para** reasignar el rol sin destruir la clase.

**Aceptación:** solo operación local deliberada y protegida; revoca viejo titular y video, conserva sesión, código, archivos y cola; otro navegador adquiere rol por primer acceso.

## 2. Trabajo técnico habilitador

| ID | Trabajo | Prioridad | Dependencia |
|---|---|---|---|
| TEC-13 | Separar `teacherOwnerId` de `socket.id` y modelar expiración de 90 s | Crítica | HU-21, HU-22, HU-23 |
| TEC-14 | Validación atómica de primer acceso y cookies de docente | Crítica | HU-21 |
| TEC-15 | Vista `/proyeccion` segura y receptor WebRTC en equipo fijo | Crítica | HU-20, HU-24 |
| TEC-16 | Señalización y exclusividad por generación de presentación | Crítica | HU-24, HU-25, HU-26 |
| TEC-17 | Modelo de cola persistente independiente de presencia docente | Alta | HU-27, HU-28 |
| TEC-18 | Arranque de servicio y GUI + supervisor del receptor | Alta | HU-20 |
| TEC-19 | Limpieza de temporales propios al inicio y cierre seguro | Crítica | HU-29 |
| TEC-20 | Revisión de APIs de archivo y autorización HTTP con docente remoto | Alta | HU-22, HU-27 |
| TEC-21 | Revisión de política de HTTPS/certificados Windows para docente remoto | Alta | HU-20, HU-24 |
| TEC-22 | Integrar fixes conocidos de alerta alumno y descarga docente sin navegar | Media | HU-25, módulo archivos |
| TEC-23 | Instrumentar pruebas de señalización, cambios A→B y rendimiento LAN | Crítica | HU-24, HU-25, HU-26 |

## 3. Secuencia de incrementos sugerida

1. **Base de ciclo de vida:** TEC-13/14 + HU-21/22/23, sin tocar multimedia todavía; impedir que `disconnect` cierre sesión.
2. **Receptor:** TEC-15/18/21 + HU-20/24; validar captura docente y proyección LAN real.
3. **Arbitraje:** TEC-16/17/23 + HU-25/26/28; probar A→B y regreso docente, señales tardías y exclusividad.
4. **Ausencias:** HU-27 + integración archivos (TEC-20), mantener cola y presentación estudiante durante expiración docente.
5. **Limpieza:** HU-29/30 + TEC-19; verificar reinicio abrupto, recuperación local y cierre.
6. **Validación integral:** actualizaciones/cierre navegador, Wi-Fi, Windows, certificados y rendimiento de archivos con WebRTC.

## 4. Trazabilidad resumida

| Requisitos nuevos | Historias | Casos de prueba |
|---|---|---|
| RF-013, RF-014, RNF-012 | HU-20 | INT-01, INT-02 |
| RF-015, RF-016, RF-018 | HU-21 | AUT-01, AUT-02, SES-01 |
| RF-019 a RF-023, RNF-009, RNF-014 | HU-22, HU-23 | REC-01 a REC-07 |
| RF-017, RF-027 a RF-033, RNF-010, RNF-015 | HU-24 a HU-26 | VID-01 a VID-09 |
| RF-024 a RF-026, RF-034 | HU-27, HU-28 | COL-01 a COL-07, ARC-01 a ARC-03 |
| RF-035, RF-036, RNF-013 | HU-29, HU-30 | LIM-01 a LIM-04 |

## 5. Definición de terminado

Ninguna historia se da por terminada por existir código o pasar unitarias: exige prueba funcional en LAN con servidor fijo conectado al proyector, laptop docente y al menos dos equipos alumnos, más verificación de autorizaciones y recursos. **Estado actual:** ninguna de HU-20 a HU-30 está validada.
