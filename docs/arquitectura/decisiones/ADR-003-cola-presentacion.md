# ADR-003: Cola de presentación con concesión exclusiva del docente

- **Estado:** propuesta implementada en el MVP; pendiente de validación manual con dos o más navegadores/equipos.
- **Contexto:** la negociación de pantalla no debe comenzar automáticamente cuando un estudiante autoriza la captura. El docente debe controlar qué estudiante transmite y evitar conexiones simultáneas.

## Decisión

1. El estudiante autoriza la captura de pantalla mediante la acción explícita requerida por el navegador.
2. Al quedar lista la captura, la aplicación registra una solicitud temporal en una cola ordenada por llegada. Estar en la cola no crea una conexión WebRTC ni transmite video por la red.
3. El docente puede conceder el turno desde la cola. La concesión retira al estudiante de la cola y lo convierte en el único estudiante seleccionado.
4. El docente también puede seleccionar directamente a cualquier participante. Esta selección tiene prioridad sobre la cola y retira al participante elegido de ella si estaba esperando.
5. Si el docente selecciona directamente a un estudiante que aún no autorizó la captura, la selección queda pendiente hasta que el estudiante autorice desde su navegador.
6. Cambiar de estudiante o detener la proyección cierra la conexión WebRTC anterior y bloquea la señalización para estudiantes no seleccionados.
7. Detener la captura elimina al estudiante de la cola; si era el seleccionado, libera el turno.
8. La cola y el turno son temporales y se eliminan al cerrar la sesión.

## Consecuencias

- Solo un estudiante a la vez puede establecer una conexión de transmisión autorizada hacia el docente.
- Los estudiantes en espera pueden tener una captura local autorizada por el navegador, pero no deben crear un peer connection ni enviar video.
- El servidor coordina señalización y autorización; la implementación WebRTC actual envía el video directamente entre navegador del estudiante y navegador del docente dentro de la LAN, no a través del servidor como retransmisor.
- Es necesario validar manualmente los cambios rápidos de selección, detención de captura, desconexión y autorización tardía. Las pruebas unitarias de estado no sustituyen una prueba real de WebRTC.
