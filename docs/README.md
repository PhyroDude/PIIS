# Índice y reglas de documentación

Esta carpeta documenta el Sistema local de retroalimentación. La base de código de referencia es **v0.3.0**. Los documentos describen decisiones y estado de validación; no convierten por sí mismos una propuesta en requisito aprobado ni una prueba pendiente en resultado exitoso.

## Orden de autoridad

1. **SRS original:** fuente de los requisitos aprobados. No se modifica indirectamente desde otros documentos.
2. **Alcance del MVP y backlog:** organizan lo que se construye y prioriza sin eliminar requisitos del SRS.
3. **ADR:** registran decisiones de arquitectura o producto, alternativas, consecuencias y pendientes.
4. **Diseño funcional:** describe el comportamiento esperado con mayor detalle.
5. **Pruebas y resultados:** definen cómo verificar y registran únicamente resultados realmente obtenidos.
6. **Código:** implementa el comportamiento. Si contradice un requisito aprobado o una decisión confirmada, se debe revisar la implementación o tramitar el cambio formal.

## Mapa documental

- [`requisitos/SRS-original.pdf`](requisitos/SRS-original.pdf) — documento original de requisitos.
- [`producto/alcance-MVP-y-product-backlog-base.md`](producto/alcance-MVP-y-product-backlog-base.md) — alcance base y relación con el SRS.
- [`producto/backlog-observaciones.md`](producto/backlog-observaciones.md) — historias de retroalimentación oral y notas opcionales.
- [`producto/backlog-proyeccion.md`](producto/backlog-proyeccion.md) — historias de cola, concesión, cambio de presentador y pantalla completa.
- [`producto/backlog-acceso-roles.md`](producto/backlog-acceso-roles.md) — historias de separación de acceso y distinción visual de roles.
- [`arquitectura/arquitectura-general.md`](arquitectura/arquitectura-general.md) — componentes, datos, red y permisos.
- [`arquitectura/decisiones/ADR-001-arquitectura-local.md`](arquitectura/decisiones/ADR-001-arquitectura-local.md) — aplicación web local, equipo docente y LAN.
- [`arquitectura/decisiones/ADR-002-gestion-observaciones.md`](arquitectura/decisiones/ADR-002-gestion-observaciones.md) — oral como flujo normal y notas opcionales.
- [`arquitectura/decisiones/ADR-003-cola-presentacion.md`](arquitectura/decisiones/ADR-003-cola-presentacion.md) — cola de presentación, selección directa y exclusividad.
- [`arquitectura/decisiones/ADR-004-acceso-y-identidad-visual-por-rol.md`](arquitectura/decisiones/ADR-004-acceso-y-identidad-visual-por-rol.md) — separación de pantallas de acceso y paletas por rol.
- [`diseno/proyeccion-pantalla-y-cola.md`](diseno/proyeccion-pantalla-y-cola.md) — flujo de solicitud, espera, concesión, cambio de estudiante y pantalla completa.
- [`diseno/acceso-y-paletas-por-rol.md`](diseno/acceso-y-paletas-por-rol.md) — navegación, contenido, paletas y accesibilidad de los accesos.
- [`diseno/observaciones-individuales.md`](diseno/observaciones-individuales.md) — reglas y ciclo de vida de notas.
- [`pruebas/trazabilidad-y-pruebas.md`](pruebas/trazabilidad-y-pruebas.md) — matriz y pruebas propuestas.
- [`pruebas/resultados/estado-inicial.md`](pruebas/resultados/estado-inicial.md) — estado de verificación de la versión de referencia.
- [`desarrollo/puesta-en-marcha.md`](desarrollo/puesta-en-marcha.md) — instalación, contexto seguro y pruebas manuales.

## Cómo actualizar la documentación

| Cambio | Documento principal | Documentos relacionados |
|---|---|---|
| Requisito formal | SRS mediante control de cambios | Alcance, backlog, arquitectura, diseño y pruebas |
| Decisión de plataforma o red | ADR correspondiente | Arquitectura general, README y puesta en marcha |
| Flujo de presentación | ADR-003 y diseño de proyección | Backlog, trazabilidad y resultados de pruebas |
| Flujo de observaciones | ADR-002 y diseño de observaciones | Backlog, trazabilidad y README |
| Código sin cambio de alcance | `CHANGELOG.md` cuando corresponda | Pruebas y límites conocidos |
| Resultado de prueba | `pruebas/resultados/estado-inicial.md` | Plan de pruebas, si cambia el estado |

## Convención para decisiones

Cada ADR debe indicar estado, contexto, decisión, alternativas, consecuencias, requisitos afectados y cómo se validará. Usa etiquetas explícitas: **Confirmado**, **Implementado sin validar en entorno real**, **Pendiente** o **No aprobado**.

No sobrescribas el SRS para que coincida con el código. No marques WebRTC, pantalla completa o compatibilidad LAN como validados sin ejecutar las pruebas correspondientes. Los cambios de documentación deben permanecer coherentes con la versión de código sobre la que se basan.
