# Inicio automático de la sesión docente — InterLAB v0.5.0

**Estado:** implementado como ajuste funcional de v0.5.0.

## Flujo confirmado

1. El profesor abre `https://IP:3000/docente` desde su laptop.
2. Si todavía no existe un docente autorizado, el servidor asigna al navegador una credencial privada mediante una cookie segura; si el control ya pertenece a otro navegador, rechaza el acceso.
3. Al establecer el socket del docente, InterLAB crea automáticamente la sesión **solo si no existe una**. El servidor genera el código de incorporación y prepara el almacenamiento temporal.
4. La UI muestra el panel docente y su código; ya no se presenta un formulario «Crear sesión».
5. Una recarga o cierre y reapertura del mismo navegador recupera la sesión, dentro del plazo de reconexión, sin cambiar el código ni borrar archivos.
6. La captura de pantalla **no** se inicia automáticamente: el profesor sigue pulsando «Compartir mi pantalla» y autoriza la captura del navegador.
7. Finalizar sesión sigue siendo una operación explícita con confirmación y limpieza de recursos. Para crear otra sesión se navega nuevamente a `/docente`.

## Consideraciones

- El ciclo de vida de la sesión pertenece al proceso servidor, no a la pestaña docente.
- La sesión no sobrevive a un reinicio del servicio, según la decisión de alcance vigente.
- La política de primer navegador que accede a `/docente` se mantiene; esta no garantiza la identidad real del profesor.
- Tras un cambio de credencial docente, la sesión existente permanece, pero se entrega el token administrativo vigente al navegador autorizado.
- La creación automática ocurre cuando el cliente se conecta y se autoriza por Socket.IO, inmediatamente después de cargar la ruta; no se crea una sesión únicamente por solicitar el HTML sin completar el acceso.
