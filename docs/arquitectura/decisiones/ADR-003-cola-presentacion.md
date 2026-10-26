# ADR-003: Cola de presentación con concesión exclusiva del docente

- **Estado:** decisión de interacción implementada en la base 0.3.0; transmisión entre equipos y cambio de turno pendientes de validación manual.
- **Fecha de registro:** 2026-10-21.
- **Ámbito:** solicitudes de presentación de pantalla del estudiante al docente.

## Contexto

Sin un mecanismo de turnos, varios estudiantes podrían intentar presentar al mismo tiempo. Se necesita una sola pantalla visible a la vez y una acción explícita del docente para conceder el turno. Además, el docente debe conservar la posibilidad de elegir directamente a un estudiante sin respetar la cola.

Se reportó un fallo importante: A presenta correctamente; el docente cambia a B; la proyección de B no aparece, aunque A deja de proyectarse. Por tanto, la lógica de cola existe en la base de código, pero el ciclo completo de cambio de presentador todavía no está validado.

## Decisión de interacción

1. El estudiante entra a la sesión con un alias temporal.
2. Cuando desea solicitar turno, pulsa el botón de captura y acepta el diálogo del navegador. Esta acción registra que su captura está lista.
3. Si no fue seleccionado directamente por el docente, el estudiante se agrega a la cola por orden de llegada.
4. Esperar en la cola no debe transmitir vídeo ni establecer una conexión WebRTC activa.
5. El docente concede el turno a una solicitud de la cola; el estudiante concedido pasa a ser el único seleccionado.
6. El docente puede elegir directamente a cualquier participante. La selección directa tiene prioridad y puede saltarse la cola.
7. Si el docente elige a un estudiante que aún no autorizó la captura, el sistema espera a que realice la acción explícita en su navegador.
8. Al cambiar de A a B, primero se invalida/cierra la negociación de A y se limpia el vídeo anterior; después se debe iniciar una negociación nueva con B.
9. Si el estudiante detiene la captura, sale de la sesión o se desconecta, se elimina su solicitud. Si era el seleccionado, se libera el turno.
10. El docente puede detener la proyección activa sin finalizar toda la sesión.
11. La cola y la selección son temporales y se eliminan al cerrar la sesión.

## Modelo de estados esperado

- **Sin solicitud:** el estudiante está en la sesión, pero no ha autorizado captura.
- **En cola:** la captura está autorizada y el estudiante espera; no transmite vídeo.
- **Seleccionado / esperando autorización:** el docente eligió al estudiante directamente, pero aún no se ha autorizado la captura.
- **Seleccionado / listo para transmitir:** el docente lo concedió o eligió y la captura está preparada; se negocia WebRTC.
- **Transmitiendo:** el vídeo del estudiante seleccionado se muestra al docente.
- **Turno liberado:** se cerró la conexión anterior; el estudiante puede volver a solicitar turno.

## Alternativas consideradas

| Alternativa | Ventaja | Riesgo | Resultado |
|---|---|---|---|
| Todos pueden transmitir a la vez | No hay espera | Compite por la vista docente y crea conexiones simultáneas | Rechazada |
| Cola estricta sin excepción | Orden sencillo | Impide atender una necesidad urgente | Rechazada |
| Cola por llegada + selección directa prioritaria | Ordena solicitudes y conserva control docente | Requiere gestionar cambios de conexión correctamente | Elegida |

## Consecuencias y reglas técnicas

- El servidor mantiene un único `selectedStudent` por sesión.
- Solo el docente y el estudiante seleccionado que está listo pueden intercambiar señalización WebRTC.
- El cambio de estudiante debe cerrar el peer anterior, borrar el `srcObject` de la vista docente, vaciar candidatos ICE de la negociación previa y aceptar únicamente señales de la nueva pareja.
- Los estudiantes en espera no deben crear un peer ni enviar vídeo.
- La captura local puede seguir autorizada mientras el estudiante espera; esto no debe interpretarse como transmisión activa.
- La implementación actual debe probarse ante cambios rápidos, mensajes retrasados, detención manual, fin de captura y desconexión.

## Defecto conocido y criterio de resolución

**Defecto reportado, aún no resuelto:** después de A, B no se ve al cambiar de presentador. No se debe marcar como corregido porque las pruebas unitarias de estado pasen.

Se considerará verificado cuando una prueba manual con un docente y al menos dos estudiantes confirme, en varias rondas, que:

1. A se ve correctamente.
2. B queda seleccionado y su vídeo aparece después del cambio.
3. A deja de transmitir y sus mensajes atrasados no reemplazan la vista de B.
4. C puede esperar en la cola y recibe el turno cuando el docente se lo concede.
5. La selección directa de C puede saltarse la cola.
6. Detener la proyección libera el turno y no deja un vídeo antiguo congelado.

Los resultados deben anotarse en `../../pruebas/resultados/estado-inicial.md` y no inferirse del código.

## Diferencia de autorización

La decisión inicial de producto buscaba pedir permiso al incorporarse a la sesión. En la implementación 0.3.0, el navegador muestra el diálogo cuando el estudiante pulsa el botón de solicitar turno, por el requisito de acción explícita de `getDisplayMedia()`. Se documenta como una diferencia técnica/funcional pendiente de revisión, no como una equivalencia ya demostrada.
