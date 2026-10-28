# InterLAB — Requisitos consolidados del módulo de gestión de archivos

**Baseline del proyecto:** v0.3.0  
**Versión del documento:** 0.1  
**Estado:** borrador consolidado para revisión  
**Fecha:** 28 de octubre de 2026

## 1. Alcance y principios
- Compartir archivos durante una sesión activa en la LAN.
- Almacenamiento temporal en el servidor de sesión.
- La proyección de pantalla tiene prioridad sobre las transferencias.
- Se aceptan formatos generales, incluidos ZIP, conservando el contenido original.
- No se permite editar nombres; se permiten nombres duplicados.

## 2. Espacios y permisos

### Docente
| Pestaña | Contenido | Columnas y acciones |
|---|---|---|
| Mis archivos | Archivos del docente | Icono, nombre, fecha/hora, eliminar |
| Archivos de los alumnos | Todos los archivos de alumnos | Icono, nombre, alias, fecha/hora, eliminar |

### Alumno
| Pestaña | Contenido | Columnas y acciones |
|---|---|---|
| Archivos del profesor | Archivos del docente | Icono, nombre, fecha/hora; ver/descargar |
| Archivos de los alumnos | Todos los archivos de alumnos, incluido el propio | Icono, nombre, alias, fecha/hora; ver/descargar |
| Mis archivos | Solo archivos propios | Icono, nombre, fecha/hora, eliminar |

- El docente puede eliminar cualquier archivo; el alumno solo sus propios archivos.
- Los permisos se validan en el servidor.
- Los archivos de alumnos se asocian al alias temporal.
- No hay columna de tamaño ni acción Editar. Los nombres duplicados se permiten.

## 3. Cargas y cola
| Regla | Límite |
|---|---:|
| Máximo por archivo | 50 MB |
| Máximo por operación de carga | 200 MB |
| Almacenamiento temporal por sesión | 10 GB compartidos |
| Transferencias simultáneas por usuario | 2 |

- Se permiten cargas múltiples; cada archivo tiene estado/progreso independiente y un fallo no detiene los demás que puedan continuar.
- Cada participante tiene cola independiente. No es historial permanente.
- Al completar: mostrar «Completado» unos segundos y retirar el elemento de la cola, conservando el archivo compartido.
- Si falla: mantenerlo hasta «Reintentar» o «Eliminar de la cola». Quitar de la cola no borra archivos exitosos.
- No se pueden cancelar cargas en curso; no hay reintentos automáticos ni reanudación.
- Una carga interrumpida por desconexión queda fallida y solo se reintenta manualmente desde el principio.
- Si no hay espacio, se rechaza la carga y no se borran otros archivos automáticamente.
- La meta aproximada de un segundo es preferencia, no garantía.

## 4. Falta de almacenamiento
- Advertencia inmediata al docente e indicador persistente mientras el espacio sea insuficiente para la operación que originó el aviso.
- Sin cifras ni barra de capacidad.
- Una sola advertencia persistente; no repetir notificaciones por cada intento.
- El indicador se actualiza/desaparece cuando haya espacio suficiente. Sin borrado automático.

## 5. Búsqueda, orden y actualización
- Orden inicial: más recientes primero.
- Solo «Archivos de los alumnos» tiene búsqueda y ordenamiento.
- Nombre y alias: primer clic Z→A; segundo A→Z. Fecha/hora: más recientes y luego más antiguos.
- El orden activo persiste al llegar archivos nuevos.
- Búsqueda por prefijo, insensible a mayúsculas/minúsculas; no exige extensión y actualiza al escribir.
- Sin resultados: tabla visible con «No existen coincidencias». Sin botón de limpiar; borrar el texto.
- Altas y eliminaciones actualizan tablas sin recarga. El mecanismo técnico queda pendiente de arquitectura.

## 6. Descargas
- Descarga individual o selección múltiple como un ZIP.
- Sin límite fijo de tamaño total del ZIP, sujeto a recursos disponibles.
- Sin cola ni progreso ZIP propios de InterLAB; el navegador gestiona la descarga.
- La estrategia de generación del ZIP queda pendiente de arquitectura.
- Si se interrumpe una descarga, reiniciarla manualmente desde el principio si el archivo sigue disponible.
- Si se elimina un archivo durante una descarga, la ya iniciada puede terminar; no se permiten nuevas.
- Descargas simultáneas del mismo archivo permitidas, controlando recursos para proteger la proyección.
- Cerrar sesión interrumpe las descargas activas.

## 7. Proyección
- Las transferencias siguen activas durante la proyección, pero reducen su velocidad.
- Si la proyección empieza durante transferencias activas, se reduce su velocidad inmediatamente; no se pausan ni cancelan.
- No se fijan porcentajes arbitrarios. El mecanismo se define con arquitectura y pruebas.

## 8. Eliminación y cierre de sesión
- Eliminación individual: el archivo deja de estar disponible para nuevas descargas; las ya iniciadas pueden terminar; copias locales no se afectan.
- Cierre de sesión requiere confirmación del docente.
- Al confirmar, se interrumpen inmediatamente todas las cargas y descargas activas y se eliminan todos los archivos temporales del servidor.
- Las copias ya descargadas permanecen en los dispositivos.
- No se implementa reconexión especial: si el navegador no alcanza el servidor LAN, muestra el error habitual; al recuperar acceso, el usuario vuelve a cargar la página.
- Las cargas interrumpidas quedan fallidas; las descargas deben iniciarse de nuevo si el archivo sigue disponible.

## 9. Criterios de aceptación
- Permisos validados en servidor.
- Límites de 50 MB por archivo, 200 MB por operación y 10 GB por sesión respetados.
- Máximo dos transferencias simultáneas por usuario.
- Un archivo solo se publica tras completarse la carga.
- Fallos aislados; cola y reintentos manuales funcionan como se definió.
- Búsqueda y ordenamiento respetan las reglas acordadas.
- Altas y eliminaciones se reflejan sin recarga.
- Eliminación individual no interrumpe descargas ya iniciadas.
- Cierre de sesión interrumpe transferencias y elimina temporales.
- La reducción de velocidad protege la proyección en pruebas.
- Falta de almacenamiento genera una única advertencia persistente.

## 10. Pendientes de arquitectura
1. Generación y entrega de ZIP.
2. Actualización de tablas en tiempo real.
3. Límites concretos de red/CPU/disco durante la proyección.
4. Limpieza de cargas parciales.
5. Contabilidad del límite de 200 MB y reserva de espacio en cargas concurrentes.
6. Tratamiento seguro de tipos y nombres de archivo.
7. Evitar que cargas finalicen y creen archivos tras el cierre y borrado de sesión.

## 11. Fuera de alcance
- Edición de nombres, historial permanente, reanudación y reintentos automáticos.
- Borrado automático para liberar espacio.
- Columna de tamaño o estadísticas de capacidad.
- Límite fijo del ZIP fuera de los recursos disponibles.
- Reconexión especial tras perder acceso a la LAN.

## 12. Trazabilidad
Antes de implementar, contrastar con el SRS y el alcance del MVP vigentes. Registrar diferencias relevantes en backlog, pruebas y ADR cuando corresponda. Las reglas funcionales se consideran confirmadas salvo los puntos explícitamente pendientes de arquitectura.
