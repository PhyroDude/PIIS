# Plan de pruebas de arquitectura — archivos compartidos

**Estado:** pruebas **propuestas**, no ejecutadas · **Base:** v0.4.0 · **Fecha:** 2026-10-28

| Caso | Escenario mínimo | Resultado esperado | Historia |
|---|---|---|---|
| T-01 | Cargar 1 archivo de 50 MB y otro que supera el límite | Aceptar el de tamaño permitido; rechazar el excesivo | HU-14 |
| T-02 | Selección >200 MB, aunque archivos individuales sean válidos | Rechazar operación antes de transferir | HU-14 |
| T-03 | Cargas simultáneas cuya suma supera 10 GB | Una reserva es rechazada; suma publicada+reservada nunca excede límite | HU-14 |
| T-04 | Más de dos cargas/descargas solicitadas por un usuario | Máximo dos transferencias activas por usuario; se respeta cola | HU-14/16 |
| T-05 | Abortar red durante carga y después reintentar manualmente | Parcial no visible; reserva liberada; reintento desde cero | HU-14 |
| T-06 | Estudiante intenta eliminar archivo ajeno con petición fabricada | HTTP/Socket.IO rechaza operación | HU-17 |
| T-07 | Dos participantes envían `tarea.pdf` | Ambos archivos persisten con IDs diferentes; propietario correcto | HU-15 |
| T-08 | Buscar `TAR` con orden alias Z→A y alta nueva | Coincidencias por prefijo; orden elegido no se pierde | HU-15 |
| T-09 | Seleccionar varias descargas con nombres duplicados | ZIP válido, entradas diferenciadas, sin rutas inseguras | HU-16 |
| T-10 | Borrar archivo mientras se descarga en Windows | No hay nuevas descargas; la iniciada puede completar; borrado físico posterior | HU-16/17 |
| T-11 | Forzar falta de espacio y liberar después | Un aviso persistente al docente, sin barras; se extingue al recuperar espacio | HU-17 |
| T-12 | Cerrar sesión durante cargas y ZIP | Todas las conexiones se interrumpen, no aparecen archivos tardíos, se limpia disco | HU-18 |
| T-13 | Matar proceso durante carga y reiniciar | No se restaura sesión; se limpian solo residuos propios | HU-18 |
| T-14 | Comenzar WebRTC durante dos transferencias por usuario | Transferencias siguen, velocidad reducida, proyección utilizable | HU-19 |
| T-15 | 1, 10 y 30 alumnos con cargas y descargas | CPU/RAM/red/latencia medidos y documentados; sin saturación no controlada | HU-19 |
| T-16 | Proyectar A, luego B, detener y reconceder | B se visualiza; A deja de transmitir; se documenta defecto separado | Proyección base |
| T-17 | Solicitar descargas con ticket caducado, de otra sesión o ajeno | Rechazo inequívoco, sin fuga de archivos | HU-16/17 |
| T-18 | Confirmación de cierre del docente y prueba de cancelación de confirmación | Sin confirmación no se cierra; con confirmación se interrumpen transferencias | HU-18 |
| T-19 | Recarga manual tras desconexión y mismo alias | Política de propiedad propuesta se cumple; no se infiere identidad por alias | Por aprobar |
| T-20 | Archivo con `../`, caracteres especiales o ZIP malicioso | Se conserva como dato, nombre seguro, no ejecución ni ruta física expuesta | Seguridad |

**Entornos mínimos:** desarrollo Linux/Ubuntu; servidor final en la computadora docente y clientes Windows, sobre LAN sin Internet. Probar también comportamiento de apertura/borrado de archivos en Windows. Asegurar HTTPS de confianza para las pruebas de captura remota (restricción existente de la base), sin asumir que ya viene en v0.4.0.

**Métricas para T-14/T-15:** FPS visible, latencia aproximada de pantalla, congelamientos, uso de red del anfitrión, CPU, RAM, operaciones de disco, caudal de subida y bajada y tiempo hasta aplicar la reducción. Umbrales concretos se establecen después de medir la línea base sin transferencias.

**Criterio de liberación:** los casos críticos de autorización, cuota, cierre y limpieza deben pasar; no declarar validación sin evidencia de ejecución.
