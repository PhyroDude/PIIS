# Backlog — mejora de gestión de observaciones

> **Base de referencia:** versión 0.3.0. La cola y transmisión de pantalla se documentan por separado en [`backlog-proyeccion.md`](backlog-proyeccion.md); compartir la pantalla de un estudiante no equivale a proyectar observaciones escritas al grupo.

- **Versión:** 0.2
- **Estado:** propuesta de backlog derivada de ADR-OBS-002.
- **Nota:** las prioridades son propuestas para planificar el incremento; no alteran por sí mismas los requisitos normativos del SRS.

## Épica OBS-E01 — Retroalimentación de baja fricción

### OBS-01 — Dar retroalimentación oral sin registrar una nota

**Como** docente, **quiero** revisar la pantalla del estudiante y comunicarle oralmente qué debe corregir sin tener que redactar una observación, **para** mantener el ritmo de la sesión.

**Prioridad propuesta:** alta.  
**Tipo:** mejora del flujo principal.  
**Trazabilidad:** RF-005, RF-006; alineación con RNF-005 (usabilidad).

**Criterios de aceptación**
- Dado que el docente ha seleccionado un participante activo, cuando le explica oralmente una corrección, el sistema no exige crear una observación escrita.
- La ausencia de una nota no bloquea la selección de otro participante ni la continuación de la sesión.
- No se crea una observación vacía automáticamente.
- La interfaz no presenta la escritura como paso obligatorio del flujo principal.

### OBS-02 — Crear una observación individual opcional

**Como** docente, **quiero** redactar una nota breve cuando una indicación necesite conservarse durante la sesión, **para** complementar la explicación oral sin convertir la escritura en una obligación.

**Prioridad propuesta:** alta.  
**Trazabilidad:** RF-007.

**Criterios de aceptación**
- El docente puede seleccionar un participante activo y escribir una nota individual.
- Se rechazan textos vacíos o compuestos únicamente por espacios.
- Se mantiene el límite de 1,000 caracteres del diseño actual, salvo que el SRS aprobado establezca otro.
- Solo el docente autorizado de la sesión activa puede crear la observación.
- El destinatario debe pertenecer a la sesión activa.
- La nota se envía exclusivamente al destinatario previsto.
- La nota queda en memoria del servidor, no en una base de datos ni en un historial.

### OBS-03 — Consultar las observaciones propias

**Como** estudiante, **quiero** consultar las observaciones dirigidas a mi alias temporal, **para** revisar la indicación escrita mientras la sesión está activa.

**Prioridad propuesta:** alta.  
**Trazabilidad:** RF-008, RNF-006.

**Criterios de aceptación**
- El estudiante ve únicamente las observaciones asociadas a su identidad temporal autenticada.
- El servidor deriva la identidad del contexto de sesión autenticado; no confía exclusivamente en un `studentId` enviado por el navegador.
- Cambiar manualmente un identificador en una petición no permite consultar las notas de otro estudiante.
- Las notas no se emiten a todos los participantes ni se proyectan automáticamente.
- Al cerrar la sesión, el estudiante ya no puede consultar las notas temporales desde el sistema.

## Épica OBS-E02 — Copia personal antes del cierre (pendiente de validación)

### OBS-04 — Copiar una observación propia

**Como** estudiante, **quiero** copiar una de mis observaciones antes de que termine la sesión, **para** conservar una referencia personal si la necesito.

**Prioridad propuesta:** media.  
**Estado:** pendiente de aprobación de requisitos.  
**Trazabilidad propuesta:** extensión de RF-008; revisar RNF-002.

**Criterios de aceptación propuestos**
- La acción aparece solo cuando existen observaciones propias.
- La copia incluye el texto seleccionado y, si se decide, fecha/hora y alias de origen; no incluye datos de otros estudiantes.
- La acción ocurre por una interacción explícita del usuario.
- No se guarda una copia adicional en el servidor.
- La implementación informa claramente que el contenido copiado queda fuera del control del sistema.
- Si la validación de RNF-002 no aprueba la copia, esta historia permanece fuera del incremento.

### OBS-05 — Descargar observaciones propias como texto

**Como** estudiante, **quiero** descargar mis observaciones antes de cerrar la sesión, **para** tener un recordatorio personal sin que el sistema mantenga un historial.

**Prioridad propuesta:** media.  
**Estado:** pendiente de aprobación de requisitos.  
**Trazabilidad propuesta:** extensión de RF-008; revisar RNF-002.

**Criterios de aceptación propuestos**
- La descarga solo contiene observaciones asociadas al estudiante autenticado.
- El archivo se genera en el cliente a partir de los datos visibles/autorizados; el servidor no crea ni almacena un archivo de historial.
- El formato inicial propuesto es `.txt`, sujeto a confirmación.
- La interfaz advierte que la descarga debe hacerse antes del cierre.
- La sesión se puede cerrar aunque el estudiante no descargue nada.
- Después del cierre, el servidor elimina el estado temporal y no ofrece recuperación.
- Esta historia no se implementa hasta resolver formalmente su compatibilidad con RNF-002.

## Épica OBS-E03 — Protección y ciclo de vida

### OBS-06 — Eliminar las notas al finalizar la sesión

**Como** responsable del sistema, **quiero** eliminar todas las observaciones temporales al cerrar la sesión, **para** respetar la no persistencia.

**Prioridad propuesta:** alta; requisito de cumplimiento.  
**Trazabilidad:** RF-012, RNF-002.

**Criterios de aceptación**
- Al finalizar una sesión, se eliminan las observaciones en memoria junto con el estado de esa sesión.
- El código de sesión deja de ser válido.
- No existe una ruta de consulta posterior que recupere las notas.
- Reiniciar el proceso del servidor no restaura las observaciones.
- Los logs técnicos no contienen el texto de las observaciones.

### OBS-07 — Aislar las observaciones por destinatario

**Como** participante, **quiero** que mis observaciones sean privadas respecto de otros estudiantes, **para** evitar divulgación accidental.

**Prioridad propuesta:** alta; requisito de seguridad.  
**Trazabilidad:** RNF-006 y reglas de acceso de RF-007/RF-008.

**Criterios de aceptación**
- Una solicitud sin autorización válida es rechazada.
- Un estudiante no puede crear observaciones como si fuera el docente.
- Un estudiante no puede leer observaciones de otro participante.
- El servidor valida permisos; ocultar botones en la interfaz no se considera control de seguridad suficiente.

## Dependencias y orden sugerido

1. OBS-01: cambiar el flujo de interfaz para que escribir sea opcional.
2. OBS-02 y OBS-03: conservar creación y consulta individual con validación en servidor.
3. OBS-06 y OBS-07: verificar ciclo de vida y aislamiento mediante pruebas.
4. Resolver la compatibilidad con RNF-002.
5. Solo si se aprueba, implementar OBS-04 y OBS-05.

## Definición de terminado

Una historia no se considera terminada solo porque el código se haya escrito. Debe tener pruebas ejecutadas, resultados documentados, control de acceso validado y comportamiento de cierre comprobado. Las historias OBS-04 y OBS-05 no deben marcarse como incluidas hasta la aprobación explícita de la exportación.
