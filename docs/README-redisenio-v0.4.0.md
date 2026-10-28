# Índice documental — Rediseño del servidor y la proyección de InterLAB 0.4.0

**Estado:** paquete de documentación, sin modificaciones del código ni de los README históricos.  
**Base funcional:** InterLAB 0.4.0 beta; **línea de origen:** PIIS(1).zip → v0.3.4.

## Documentos nuevos

- [Enmienda SRS: requisitos nuevos RF-013…RF-036](requisitos/SRS-enmienda-modelo-servidor-proyeccion-v0.4.0.md)
- [Alcance del MVP revisado v1.2](producto/alcance-MVP-redisenio-v1.2.md)
- [Product Backlog HU-20…HU-30](producto/backlog-redisenio-v0.4.0.md)
- [Arquitectura objetivo](arquitectura/arquitectura-objetivo-servidor-y-proyeccion-v0.4.0.md)
- [Registro de decisiones confirmadas y revisadas](arquitectura/registro-decisiones-redisenio-v0.4.0.md)
- [ADR-015 a ADR-020](arquitectura/decisiones/ADR-015-servidor-independiente-y-receptor.md)
- [Diseño de estados de proyección](diseno/estados-pantalla-proyeccion-v0.4.0.md)
- [Plan de pruebas](pruebas/plan-redisenio-servidor-proyeccion-v0.4.0.md)
- [Preparación de implementación](desarrollo/preparacion-implementacion-redisenio-v0.4.0.md)

## Documentos anteriores que se preservan

- `requisitos/SRS-original.pdf` — referencia del SRS, sin cambios.
- `requisitos/InterLAB_Requisitos_Modulo_Archivos_v0.1.md` — requisitos de archivos, mismos límites y permisos.
- `producto/alcance-MVP-y-product-backlog-base-v1.1.md` y `.docx` — histórico del alcance anterior.
- `arquitectura/arquitectura-general.md` y `decisiones/ADR-001…ADR-014` — decisiones históricas; cuando contradigan el nuevo destino `/proyeccion`, se aplica el rediseño **solo después de implementarlo**, nunca como descripción de código existente.

## Regla para integrar

Añadir estos documentos a sus carpetas respetando la estructura acordada. No borrar ni renombrar README principal sin aprobación. Actualizar el índice `docs/README.md` con enlaces después de revisar el paquete. **No afirmar que el nuevo modelo esté implementado.**
