# ADR-011 — Almacenamiento temporal y catálogo de archivos

**Fecha:** 2026-10-28 · **Estado:** decisión técnica adoptada para la beta, pendiente de validación en LAN real · **Código:** v0.4.0 (basado en PIIS v0.3.4)

## Contexto
El alcance v1.1 añade archivos hasta 50 MB por elemento, 200 MB por operación y 10 GB por sesión, y la base de InterLAB 0.3.4 guarda únicamente el estado de sesión en memoria. No debe introducir historial persistente ni depender de Internet.

## Decisión adoptada
Guardar **solo metadatos y cuotas en memoria** y **bytes en disco temporal privado del equipo docente**, con extensiones `.part` (incompleto) y `.bin` (publicado), fuera del directorio público. Usar IDs internos aleatorios; publicar solo al completar y validar. Reservar cuota antes de recibir y liberarla al fallar/eliminar. El cierre invalidará la sesión y eliminará directorios. Al reiniciar no se reconstruyen sesiones. Los residuos de un cierre abrupto se gestionarán en un incremento posterior.

## Alternativas

| Opción | Razón para no elegirla por ahora |
|---|---|
| Guardar archivos completos en RAM | Riesgo de consumo excesivo con 10 GB y transferencias simultáneas |
| Base de datos con archivos | Introduce persistencia y operación innecesarias para el MVP |
| Carpeta pública de Express | Permitiría eludir autorización y expone nombres/contenidos |
| Nube | Contradice operación sin Internet |

## Consecuencias y validación
Requiere verificar permisos de directorios, disponibilidad física de disco, compatibilidad Windows/Linux, residuos tras fallos y borrado diferido por lectores. **Decisión aplicada:** MB y GB decimales. Reconectarse con el mismo alias no recupera la propiedad de archivos anteriores. No se restaura el catálogo tras reiniciar. **Implementación beta:** existe código y pruebas automatizadas; quedan pendientes las pruebas de LAN, navegadores Windows y fallos de energía.


> **Control documental:** numeración ajustada porque la base PIIS v0.3.4 ya utiliza ADR-009 y ADR-010 para HTTPS. El documento de preparación anterior usaba IDs distintos; se conserva la trazabilidad sin sobrescribir decisiones históricas.
