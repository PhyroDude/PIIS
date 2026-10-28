# ADR-013 — Prioridad de proyección y cierre seguro de sesión

**Fecha:** 2026-10-28 · **Estado:** decisión técnica adoptada para la beta, pendiente de validación en LAN real · **Código:** v0.4.0 (basado en PIIS v0.3.4)

## Contexto
La pantalla WebRTC tiene prioridad. Las transferencias activas no se pausan ni cancelan al comenzar la proyección: deben reducir su velocidad. Al cerrar sesión sí deben interrumpirse todas y eliminarse archivos y parciales.

## Decisión adoptada
1. Un planificador aplica límites de caudal a streams HTTP entrantes y salientes y actualiza flujos activos al detectarse proyección; el valor inicial del caudal es provisional y debe calibrarse en la LAN.
2. El límite implementado es de dos transferencias simultáneas por usuario; el caudal compartido bajo proyección tiene un máximo configurable en bytes/s, cuyo valor inicial es experimental.
3. Cerrar sesión requiere confirmación docente, marca `CLOSING`, invalida tickets y el estado de sesión, aborta streams/ZIP, espera liberación de recursos, limpia el directorio de sesión y termina el estado. Una operación tardía no puede publicar.
4. No se reconstruyen sesiones tras reiniciar. El cierre normal elimina los temporales; si el proceso termina de forma abrupta pueden quedar residuos en la carpeta temporal del proceso, por lo que falta limpieza de huérfanos tras un fallo severo.

## Alternativas
- Pausar/cancelar transferencias durante proyección: contradice el requisito.
- Fijar 20 %, 30 % u otra reducción sin medición: no ofrece garantía y no fue acordado.
- Borrar solo el catálogo en memoria: no elimina archivos del disco ni interrumpe descargas.

## Consecuencias y validación
Requiere métricas reales de rendimiento WebRTC, WAN/LAN no extrapolables, manejo de streams HTTP y prueba de cierre concurrente en Windows. La limpieza se ejecuta asíncronamente y las nuevas operaciones quedan invalidadas antes de borrar el directorio. El defecto conocido A→B se valida y corrige por separado. **Implementación beta:** existe código y pruebas automatizadas; quedan pendientes las pruebas de LAN, navegadores Windows y fallos de energía.


> **Control documental:** numeración ajustada porque la base PIIS v0.3.4 ya utiliza ADR-009 y ADR-010 para HTTPS. El documento de preparación anterior usaba IDs distintos; se conserva la trazabilidad sin sobrescribir decisiones históricas.
