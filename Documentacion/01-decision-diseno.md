# Registro de decisión de diseño — retroalimentación oral y notas opcionales

- **ID:** ADR-OBS-002
- **Versión:** 0.2
- **Fecha:** 2026-10-21
- **Estado:** decisión de interacción confirmada por el usuario; descarga/copiar pendiente de validación de requisitos.
- **Ámbito:** gestión de observaciones individuales del Sistema local de retroalimentación.

## 1. Contexto

El diseño inicial trata la observación escrita como una acción central: el docente selecciona a un estudiante, redacta una nota y la envía. Esto puede interrumpir la dinámica de una sesión de laboratorio, porque el docente debe cambiar de la explicación o revisión técnica a la redacción de texto.

Además, si la nota solo está disponible durante la sesión y se elimina al cerrarla, su utilidad como recordatorio posterior es limitada. El sistema, sin embargo, debe respetar la restricción de no mantener historial permanente.

## 2. Decisión de interacción

La retroalimentación oral será el flujo normal. El docente podrá explicar directamente al estudiante qué corregir mientras revisa su pantalla. La aplicación no exigirá redactar una observación para continuar la actividad.

Las observaciones escritas permanecen como función opcional. El docente las usará cuando una indicación concreta necesite quedar anotada.

## 3. Conservación de las notas

Se propone que el estudiante pueda consultar sus propias notas y, antes del cierre de la sesión, copiarlas al portapapeles o descargarlas como archivo de texto.

Esta capacidad se considera **pendiente de validación frente al SRS**, en especial frente a RNF-002 (no persistencia). La interpretación que se propone es:

- El servidor no mantiene observaciones después de cerrar la sesión.
- El sistema no proporciona un historial ni una función para recuperar notas en sesiones posteriores.
- La copia/descarga es una exportación iniciada por el estudiante a su propio equipo, no un archivo almacenado por el servidor.
- Una vez exportada, la copia queda bajo el control del estudiante y el sistema no puede garantizar su eliminación ni revocar el acceso.

Si el SRS o las políticas institucionales interpretan la no persistencia como prohibición de cualquier copia local, la descarga no deberá implementarse hasta aprobarse formalmente una modificación del requisito.

## 4. Decisiones confirmadas

1. La comunicación oral es la modalidad principal.
2. La escritura de observaciones no es obligatoria en el flujo normal.
3. Las observaciones individuales siguen disponibles cuando aportan valor.
4. Cada estudiante solo puede consultar las notas que le pertenecen.
5. El estado de la sesión y las notas se mantienen en memoria del servidor.
6. Al cerrar la sesión, el servidor elimina las notas y el resto del estado temporal.
7. No se crea un historial permanente administrado por el sistema.

## 5. Pendientes de validación

1. Aprobar formalmente si copiar/descargar notas propias es compatible con RNF-002.
2. Confirmar si el archivo descargado debe ser `.txt` y si se permite copiar al portapapeles.
3. Definir si la interfaz advierte al estudiante que debe exportar antes del cierre.
4. Definir el comportamiento ante cierre inesperado o pérdida de conexión. No se promete recuperación tras reiniciar el servidor.
5. Actualizar el SRS mediante control de cambios si se aprueba la exportación.

## 6. Alternativas consideradas

| Alternativa | Ventaja | Desventaja | Resultado |
|---|---|---|---|
| Redacción obligatoria | Cada revisión produce un registro | Interrumpe la sesión y añade trabajo | No elegida |
| Solo comunicación oral | Máxima fluidez y simplicidad | No deja recordatorio dentro del sistema | Insuficiente como única opción |
| Oral principal + notas opcionales | Mantiene fluidez y permite anotar lo importante | Requiere diseñar y probar el acceso a notas | Elegida |
| Historial persistente en servidor | Recuperación posterior sencilla | Contradice la restricción actual de no persistencia | Fuera del alcance actual |

## 7. Consecuencias

- La interfaz docente debe priorizar la selección y visualización de estudiantes; el editor de notas no debe bloquear el flujo principal.
- La interfaz estudiantil debe distinguir claramente las notas propias y, si se aprueba, ofrecer copiar/descargar.
- El servidor debe validar rol, sesión activa e identidad temporal del destinatario.
- No se deben registrar los textos de las observaciones en logs.
- La eliminación al cierre y el aislamiento entre estudiantes son criterios obligatorios de prueba.

## 8. Criterio de aceptación de la decisión

El cambio de interacción se considera validado cuando una prueba con usuarios confirma que el docente puede dar retroalimentación sin escribir y que las notas opcionales no ralentizan el flujo normal. La exportación solo se considera aprobada cuando se resuelva formalmente su compatibilidad con RNF-002.
