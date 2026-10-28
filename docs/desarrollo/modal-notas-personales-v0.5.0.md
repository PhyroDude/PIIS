# InterLAB v0.5.0 — modal de notas personales

**Estado:** implementado en la vista docente; pendientes pruebas visuales en el laboratorio.

## Comportamiento

- La acción **Dar nota personal** de la tabla de participantes o del alumno seleccionado abre un cuadro modal centrado.
- Se indica el **destinatario seleccionado**, sin permitir enviar a otro estudiante inadvertidamente.
- Se permite escribir **de 1 a 1000 caracteres** (incluidos espacios, signos y saltos de línea). El contador se actualiza al escribir.
- **Enviar** permanece deshabilitado si la nota está vacía, excede las 1000 caracteres o está en proceso de envío. El servidor aplica el mismo límite de caracteres, como validación obligatoria en el servidor.
- **Cancelar**, la equis y **Esc** cierran el modal sin guardar. Una vez que comienza el envío, la cancelación permanece bloqueada hasta obtener la respuesta del servidor.
- Ante errores, el modal permanece abierto, se conserva el texto y se informa el motivo.
- Cuando el servidor confirma el envío, se cierra el modal y aparece una confirmación en la vista docente.
- Se conserva el evento existente `teacher:add-observation` y la notificación privada `student:observations-updated`; no hay broadcast de la nota al grupo.
- El almacenamiento de las notas sigue siendo temporal y asociado a la sesión. Se elimina al finalizar la sesión.

## Archivos modificados

- `public/index.html` — elemento `<dialog>` de nota individual.
- `public/styles.css` — diseño modal, superposición y estilos responsivos.
- `public/app.js` — apertura, cierre, conteo, control de errores y envío.
- `src/session-store.js` — validación de máximo 1000 caracteres en servidor.
- `tests/teacher-note-modal.test.js` — pruebas de regresión del modal y validación.

## Observación sobre documentos anteriores

Se mantiene el límite original de **1000 caracteres**, ahora aplicado también en el modal y en la validación del servidor.
