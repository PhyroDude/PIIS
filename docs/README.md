# Índice de documentación

## Orden de autoridad

1. **SRS**: fuente aprobada de requisitos. No se modifica indirectamente desde otros documentos.
2. **Alcance del MVP**: define qué se implementa ahora y qué se pospone sin borrar requisitos del SRS.
3. **Decisiones de arquitectura (ADR)**: registran decisiones técnicas o de producto relevantes, su contexto, alternativas y consecuencias.
4. **Diseño funcional**: explica el comportamiento detallado de una función.
5. **Backlog**: convierte el trabajo en historias verificables y priorizadas.
6. **Pruebas**: describen cómo comprobar requisitos y registran resultados reales; un caso diseñado no equivale a una prueba aprobada.
7. **Código**: implementa el diseño. Si contradice un requisito aprobado, no redefine el requisito: debe corregirse el código o tramitarse un cambio formal.

## Mapa

- [`requisitos/SRS-original.pdf`](requisitos/SRS-original.pdf) — copia de referencia del SRS recuperado.
- [`producto/alcance-MVP-y-product-backlog-base.md`](producto/alcance-MVP-y-product-backlog-base.md) — alcance y backlog base previos.
- [`producto/backlog-observaciones.md`](producto/backlog-observaciones.md) — historias específicas de observaciones orales y escritas.
- [`arquitectura/arquitectura-general.md`](arquitectura/arquitectura-general.md) — componentes y comunicación.
- [`arquitectura/decisiones/ADR-002-gestion-observaciones.md`](arquitectura/decisiones/ADR-002-gestion-observaciones.md) — decisión de gestión de observaciones.
- [`diseno/observaciones-individuales.md`](diseno/observaciones-individuales.md) — reglas, datos y flujos.
- [`pruebas/trazabilidad-y-pruebas.md`](pruebas/trazabilidad-y-pruebas.md) — trazabilidad y pruebas propuestas.
- [`desarrollo/puesta-en-marcha.md`](desarrollo/puesta-en-marcha.md) — configuración y limitaciones.

## Dónde registrar un cambio

| Si cambia… | Actualiza… | Además |
|---|---|---|
| Un requisito | SRS mediante control de cambios | Trazabilidad, backlog, pruebas y diseño afectados |
| Qué entra al MVP | Alcance del MVP y backlog | Revisa impacto en requisitos; no los elimines silenciosamente |
| Una decisión importante | Un ADR nuevo o el ADR existente | Arquitectura/diseño y pruebas afectadas |
| El comportamiento de una función | Documento de diseño funcional | Criterios de aceptación y pruebas |
| Código sin cambiar el comportamiento esperado | Código y pruebas automatizadas | `CHANGELOG.md` cuando corresponda |
| Resultado de una prueba | Plan o informe de resultados | Nunca marques como aprobada una prueba no ejecutada |

## Convención para ADR

Cada ADR debe incluir: estado (`Propuesta`, `Aprobada`, `Rechazada` o `Reemplazada`), fecha, contexto, decisión, alternativas, consecuencias, requisitos afectados y pasos de validación. Mantén las decisiones confirmadas separadas de las propuestas.

> **Nota:** `producto/alcance-MVP-y-product-backlog-base.md` conserva una versión previa del alcance/backlog para no perder trazabilidad. Para el flujo de observaciones más reciente, usa el ADR-002 y `producto/backlog-observaciones.md` como documentos de diseño de la actualización. Si se decide que el cambio debe modificar requisitos formales, tramita una revisión del SRS; no lo sustituyas silenciosamente.
