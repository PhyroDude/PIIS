# Diseño funcional — proyección de pantalla y cola de presentación

- **Versión de referencia:** 0.3.0.
- **Estado:** flujo de interacción implementado parcialmente; validación real de WebRTC y cambio de turno pendiente.
- **Relacionado con:** ADR-001, ADR-003 y `docs/pruebas/trazabilidad-y-pruebas.md`.

## 1. Propósito

Permitir que el docente revise la pantalla de un estudiante a la vez. Los estudiantes solicitan turno y esperan; el docente decide quién presenta. La selección directa debe conservar prioridad para atender una necesidad inmediata.

## 2. Flujo del estudiante

1. Abrir la dirección local de la aplicación.
2. Elegir el rol de estudiante.
3. Introducir el código temporal de sesión y un alias no utilizado.
4. Pulsar **Solicitar turno / autorizar pantalla** cuando esté preparado para presentar.
5. Elegir la pantalla o ventana en el diálogo del navegador y conceder el permiso solicitado.
6. Esperar en la cola. El mensaje debe dejar claro que no se está transmitiendo vídeo hasta recibir acceso del docente.
7. Cuando el docente conceda el turno, permitir que se negocie la conexión WebRTC.
8. Si desea detener la captura, usar **Detener captura** o detenerla desde el navegador. La solicitud debe desaparecer de la cola y, si tenía el turno activo, este debe liberarse.

### Restricción importante del navegador

La decisión de producto inicialmente proponía solicitar autorización al incorporarse a la sesión. La base 0.3.0 solicita `getDisplayMedia()` al pulsar el botón, porque los navegadores exigen una acción explícita del usuario. No documentar el permiso como concedido automáticamente al entrar. Debe revisarse si esta diferencia satisface el objetivo funcional y las limitaciones de la plataforma.

## 3. Flujo del docente

1. Crear una sesión y compartir la dirección local y el código con el grupo.
2. Revisar la lista de participantes.
3. Esperar solicitudes en **Cola de presentación**.
4. Pulsar **Conceder acceso** en la solicitud deseada; la cola sigue el orden de llegada.
5. Como alternativa, usar **Elegir directamente** en la lista de participantes para saltarse la cola.
6. Verificar que el alias de la vista corresponde al estudiante seleccionado.
7. Dar retroalimentación oral. Si se necesita un recordatorio, guardar una nota opcional.
8. Usar **Detener proyección actual** para liberar el turno sin finalizar la sesión.
9. Usar el control **Pantalla completa** para ampliar la vista compartida, según el soporte del navegador.
10. Finalizar la sesión cuando termine la actividad.

## 4. Reglas de exclusividad

- Solo puede haber un estudiante seleccionado para transmisión por sesión.
- La selección directa del docente tiene prioridad sobre la cola.
- Una captura autorizada no implica que el vídeo se esté transmitiendo.
- Estar en cola no crea un peer connection activo ni permite enviar vídeo.
- Al pasar de A a B, A deja de transmitir y B debe iniciar una negociación nueva; no se reutiliza una conexión ni candidatos ICE de A.
- Las señales tardías de A no deben alterar la vista activa de B.
- Si B aún no ha autorizado captura, la vista debe mostrar que está esperando; no se debe presentar el vídeo anterior como si fuera el de B.
- Al detener la captura o desconectarse el estudiante seleccionado, se libera el turno.

## 5. Pantalla completa

La interfaz actual tiene un botón que solicita pantalla completa para el elemento de vídeo o su contenedor, según soporte del navegador. La solicitud puede fallar por permisos o políticas del navegador. La intención funcional es que el docente pueda ampliar la vista de proyección para observar el trabajo; la validación debe confirmar si el área que entra a pantalla completa satisface el requerimiento de “la ventana en pantalla completa”. Si se requiere pantalla completa de toda la aplicación y no solo de la vista, documentar ese ajuste como pendiente de implementación.

## 6. Defecto conocido: cambio A → B

Se reportó el siguiente comportamiento: A se proyecta correctamente; al cambiar al estudiante B, A deja de proyectarse, pero la pantalla de B no aparece. La implementación debe investigarse con registros de eventos y pruebas reales de navegador. No asumir que la cola por sí sola corrige el problema.

Hipótesis a comprobar, no causas confirmadas:

- La conexión anterior o los candidatos ICE de A interfieren con la nueva negociación.
- La selección y el evento de inicio de la negociación llegan en un orden distinto entre sockets.
- El cliente estudiante no recibe o no procesa la solicitud de nueva negociación.
- La autorización de captura está lista, pero la conexión de B no llega a establecerse.

## 7. Criterios de aceptación

- El estudiante puede solicitar turno y aparece una sola vez en la cola.
- Tres estudiantes A, B y C pueden solicitar turno sin transmitir mientras esperan.
- El docente puede conceder a A, luego a B y luego a C; cada pantalla aparece y corresponde al alias correcto.
- Al cambiar de estudiante, el vídeo anterior se limpia y la conexión anterior se cierra.
- La selección directa puede saltarse la cola y elimina la solicitud duplicada del participante elegido.
- Detener captura elimina la solicitud o libera el turno según el estado.
- Un estudiante no seleccionado no puede intercambiar señalización de pantalla con el docente.
- La pantalla completa se verifica en los navegadores objetivo y se documenta qué elemento ocupa la pantalla.
- La prueba se repite con equipos Windows en la LAN, con y sin acceso a Internet, sin exponer el servicio a Internet.

## 8. Fuera de alcance de este flujo

- Grabación o almacenamiento de vídeo.
- Transmisión simultánea de varios estudiantes.
- Proyección de observaciones escritas a todo el grupo. Esa capacidad es distinta de compartir la pantalla de un estudiante y debe trazarse por separado con el SRS.
- Recuperación de sesiones o grabaciones después del cierre.
