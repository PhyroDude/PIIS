# Trazabilidad y plan de pruebas — gestión de observaciones v0.2

- **Estado:** plan de verificación propuesto; no implica que las pruebas ya se hayan ejecutado.
- **Objetivo:** comprobar el flujo oral principal, la opcionalidad de las notas, la privacidad individual y la eliminación temporal.

## 1. Matriz de trazabilidad

| Requisito / decisión | Tratamiento propuesto | Pruebas asociadas | Estado |
|---|---|---|---|
| RF-005 — seleccionar participante | Se mantiene | OBS-T01 | Se mantiene |
| RF-006 — visualizar trabajo | Se mantiene | OBS-T01 | Se mantiene |
| RF-007 — registrar observación individual | Se mantiene como función opcional | OBS-T02, T03, T04 | Ajuste de interacción |
| RF-008 — consultar observación individual | Se mantiene durante sesión activa | OBS-T05, T06, T07 | Se mantiene |
| RF-012 — finalizar sesión | Elimina estado temporal | OBS-T08, T09 | Se mantiene |
| RNF-002 — no persistencia | No hay historial del servidor; exportación local pendiente de interpretación formal | OBS-T08, T09, T10 | Exportación por validar |
| RNF-005 — usabilidad | No se exige escribir para atender al estudiante | OBS-T01, prueba de uso | Validar con usuarios |
| RNF-006 — permisos y roles | Validación obligatoria en servidor | OBS-T03 a T07 | Obligatorio |
| RF-009 a RF-011 — compartir/proyectar | No se implementa en este cambio; permanecen en backlog según planificación | No aplica a este incremento | Pospuesto, no eliminado |

## 2. Casos de prueba funcionales

### OBS-T01 — Retroalimentación oral sin nota
**Preparación:** sesión activa con docente y al menos un estudiante.  
**Pasos:** seleccionar al estudiante, revisar su pantalla y continuar a otro participante sin escribir.  
**Resultado esperado:** el sistema permite completar el flujo sin crear ni exigir una observación.

### OBS-T02 — Crear nota válida
**Preparación:** sesión activa y docente autenticado.  
**Pasos:** seleccionar estudiante activo, escribir una nota válida y enviarla.  
**Resultado esperado:** la nota se asocia al destinatario correcto y aparece solo en su panel.

### OBS-T03 — Rechazar nota vacía
**Pasos:** enviar una cadena vacía o compuesta solo por espacios.  
**Resultado esperado:** el servidor rechaza la operación y no crea una observación.

### OBS-T04 — Rechazar nota demasiado larga
**Pasos:** intentar enviar una nota que exceda el límite configurado.  
**Resultado esperado:** el servidor la rechaza; el límite no depende solo de la validación visual del cliente.

### OBS-T05 — Aislamiento entre estudiantes
**Preparación:** dos estudiantes A y B en la misma sesión; nota dirigida a A.  
**Pasos:** consultar las notas desde A y desde B.  
**Resultado esperado:** A ve la nota; B no la ve.

### OBS-T06 — Manipulación de identificador
**Pasos:** desde la sesión de B, intentar cambiar manualmente el identificador del destinatario en la petición para consultar notas de A.  
**Resultado esperado:** el servidor deriva la identidad autenticada y deniega el acceso a notas ajenas.

### OBS-T07 — Operación no autorizada
**Pasos:** intentar crear una observación usando una conexión de estudiante o una sesión/token inválidos.  
**Resultado esperado:** la operación es rechazada por el servidor.

### OBS-T08 — Eliminación al cerrar
**Pasos:** crear observaciones, finalizar la sesión y solicitar de nuevo los datos de la sesión.  
**Resultado esperado:** el código ya no es válido, no se recuperan observaciones y el estado temporal fue eliminado.

### OBS-T09 — Reinicio del servidor
**Pasos:** crear observaciones y reiniciar el proceso del servidor.  
**Resultado esperado:** las notas no se restauran desde almacenamiento persistente.

### OBS-T10 — Copia/descarga (solo si se aprueba)
**Pasos:** con dos estudiantes y notas distintas, ejecutar la exportación desde A.  
**Resultado esperado:** la copia/archivo contiene exclusivamente las notas de A; no se crea un archivo ni historial en el servidor; la acción requiere interacción explícita. Verificar además que la política institucional permite la exportación.

### OBS-T11 — Cierre antes de exportar
**Pasos:** crear una nota, no exportarla y cerrar la sesión.  
**Resultado esperado:** la sesión termina normalmente y la nota ya no está disponible en el sistema.

### OBS-T12 — No registrar contenido en logs
**Pasos:** enviar una nota de prueba y revisar logs del servidor.  
**Resultado esperado:** los logs no contienen el texto de la observación ni datos innecesarios de su contenido.

## 3. Prueba de usabilidad recomendada

Realizar una prueba corta con un docente en un laboratorio representativo:

1. Revisar la pantalla de un estudiante.
2. Comunicar una corrección oral sin redactar.
3. Cambiar a otro estudiante.
4. Crear una nota opcional cuando resulte útil.
5. Pedir al estudiante que localice la nota.
6. Si se aprueba la exportación, probar copiar/descargar antes del cierre.

Registrar si la nota interrumpe la sesión, si el docente entiende que es opcional y si el estudiante comprende que la información temporal desaparece al cerrar.

No declarar un resultado de usabilidad hasta ejecutar la prueba y documentar las observaciones.

## 4. Criterio de salida

El cambio puede considerarse listo para evaluación cuando:
- El flujo oral no depende de una nota escrita.
- Las notas opcionales pasan las pruebas de validación y privacidad.
- La eliminación al cierre está comprobada.
- Los resultados reales de las pruebas están documentados.
- La exportación está aprobada explícitamente o permanece fuera del alcance implementado.
