# Índice y reglas de documentación

Esta carpeta documenta el Sistema local de retroalimentación. La base histórica adoptada es **PIIS v0.3.4**; la versión actual de código es **InterLAB v0.5.0 beta**, posterior a la beta v0.4.0. Los documentos describen decisiones y estado de validación; no convierten por sí mismos una propuesta en requisito aprobado ni una prueba pendiente en resultado exitoso.

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
- [`arquitectura/decisiones/ADR-004-acceso-y-identidad-visual-por-rol.md`](arquitectura/decisiones/ADR-004-acceso-y-identidad-visual-por-rol.md) — pantallas de acceso e identidad visual por rol.
- [`arquitectura/decisiones/ADR-005-rutas-por-rol.md`](arquitectura/decisiones/ADR-005-rutas-por-rol.md) — rutas directas `/docente` y `/alumno`.
- [`arquitectura/decisiones/ADR-006-apertura-automatica-vista-docente.md`](arquitectura/decisiones/ADR-006-apertura-automatica-vista-docente.md) — apertura automática de la vista docente en el anfitrión.
- [`arquitectura/decisiones/ADR-007-paletas-por-rol.md`](arquitectura/decisiones/ADR-007-paletas-por-rol.md) — estado provisional de la paleta por rol.
- [`diseno/proyeccion-pantalla-y-cola.md`](diseno/proyeccion-pantalla-y-cola.md) — flujo de solicitud, espera, concesión, cambio de estudiante y pantalla completa.
- [`diseno/acceso-y-paletas-por-rol.md`](diseno/acceso-y-paletas-por-rol.md) — navegación, contenido, paletas y accesibilidad de los accesos.
- [`diseno/observaciones-individuales.md`](diseno/observaciones-individuales.md) — reglas y ciclo de vida de notas.
- [`pruebas/trazabilidad-y-pruebas.md`](pruebas/trazabilidad-y-pruebas.md) — matriz y pruebas propuestas.
- [`pruebas/resultados/estado-inicial.md`](pruebas/resultados/estado-inicial.md) — estado de verificación de la versión de referencia.
- [`desarrollo/puesta-en-marcha.md`](desarrollo/puesta-en-marcha.md) — instalación, contexto seguro y pruebas manuales.

## Incorporaciones de v0.4.0

- [Adopción de PIIS como v0.3.4](producto/adopcion-baseline-interlab-034.md).
- [Alcance y Product Backlog v1.1 — Markdown](producto/alcance-MVP-y-product-backlog-base-v1.1.md) y [Word](producto/alcance-MVP-y-product-backlog-base-v1.1.docx).
- [Requisitos del módulo de archivos v0.1](requisitos/InterLAB_Requisitos_Modulo_Archivos_v0.1.md).
- [Arquitectura implementada de archivos](arquitectura/modulo-archivos-v0.4.0.md).
- [ADR-011: almacenamiento](arquitectura/decisiones/ADR-011-almacenamiento-temporal-y-catalogo.md), [ADR-012: HTTP/ZIP](arquitectura/decisiones/ADR-012-transferencias-http-y-zip.md), [ADR-013: prioridad/cierre](arquitectura/decisiones/ADR-013-prioridad-proyeccion-y-cierre.md), [ADR-014: certificados](arquitectura/decisiones/ADR-014-seleccion-generador-certificados.md).
- [Diagramas: componentes](diseno/arquitectura-archivos-componentes.png) y [flujos](diseno/arquitectura-archivos-flujos.png).
- [Plan de pruebas](pruebas/plan-pruebas-arquitectura-archivos.md) y [resultado beta](pruebas/resultado-beta-040.md).
- [Integración documental de v0.4.0](desarrollo/INTEGRACION-v0.4.0.md).


## Implementación beta v0.5.0 — servidor y receptor independientes

- [Arquitectura implementada](arquitectura/implementacion-v0.5.0.md) — sesión independiente de pestaña, credencial docente, recuperación, receptor y permisos exclusivos WebRTC.
- [Arquitectura objetivo del rediseño](arquitectura/arquitectura-objetivo-servidor-y-proyeccion-v0.4.0.md) — referencia del diseño preparado antes de la implementación.
- [Enmienda al SRS](requisitos/SRS-enmienda-modelo-servidor-proyeccion-v0.4.0.md), [alcance v1.2](producto/alcance-MVP-redisenio-v1.2.md) y [backlog de rediseño](producto/backlog-redisenio-v0.4.0.md).
- [Alcance implementado v0.5.0](producto/alcance-implementado-v0.5.0.md) — distingue requisitos, código y validaciones pendientes.
- [ADR-015 a ADR-020](arquitectura/registro-decisiones-redisenio-v0.4.0.md) — decisiones confirmadas de servidor fijo, credenciales, turnos, cola y limpieza.
- [Despliegue y autoarranque](desarrollo/despliegue-servidor-fijo-v0.5.0.md) y [pruebas de v0.5.0](pruebas/resultado-beta-050.md).
- Se conservan en `documentos_word/` el SRS enmendado, el alcance y la arquitectura del rediseño (preparados previamente), además de las referencias del módulo de archivos y alcance v1.1.

Los documentos que describen el *modelo objetivo para futura implementación* se conservan como historial de decisiones; para el estado funcional ver la arquitectura implementada de v0.5.0.

## Cómo actualizar la documentación

| Cambio | Documento principal | Documentos relacionados |
|---|---|---|
| Requisito formal | SRS mediante control de cambios | Alcance, backlog, arquitectura, diseño y pruebas |
| Decisión de plataforma o red | ADR correspondiente | Arquitectura general, README y puesta en marcha |
| Flujo de presentación | ADR-003 y diseño de proyección | Backlog, trazabilidad y resultados de pruebas |
| Flujo de observaciones | ADR-002 y diseño de observaciones | Backlog, trazabilidad y README |
| Acceso por rol y arranque | ADR-005 y ADR-006 | Arquitectura, puesta en marcha, backlog y pruebas |
| HTTPS y certificados LAN | ADR-009 | Arquitectura, puesta en marcha, README, changelog y pruebas |
| Identidad visual | ADR-007 | Diseño de acceso y pruebas de usabilidad |
| Código sin cambio de alcance | `CHANGELOG.md` cuando corresponda | Pruebas y límites conocidos |
| Resultado de prueba | `pruebas/resultados/estado-inicial.md` | Plan de pruebas, si cambia el estado |

## Convención para decisiones

Cada ADR debe indicar estado, contexto, decisión, alternativas, consecuencias, requisitos afectados y cómo se validará. Usa etiquetas explícitas: **Confirmado**, **Implementado sin validar en entorno real**, **Pendiente** o **No aprobado**.

No sobrescribas el SRS para que coincida con el código. No marques WebRTC, pantalla completa o compatibilidad LAN como validados sin ejecutar las pruebas correspondientes. Los cambios de documentación deben permanecer coherentes con la versión de código sobre la que se basan.

- [`arquitectura/decisiones/ADR-008-despliegue-lan-y-rutas.md`](arquitectura/decisiones/ADR-008-despliegue-lan-y-rutas.md): detección de IP local y limitación de la ruta docente al anfitrión.

## Ajuste visual del panel docente v0.5.0

- [Diseño UX/UI docente en escritorio](diseno/ui-docente-escritorio-v0.5.0.md) — distribución aprobada, comportamiento conservado y pruebas manuales.
- [Vista previa estática del panel](diseno/vista-previa-ui-docente.html) — datos de demostración; no se conecta a la sesión.

## Mejora de notas personales — InterLAB v0.5.0

- [Modal de notas personales (1000 caracteres)](desarrollo/modal-notas-personales-v0.5.0.md) — flujo de apertura, cancelación, envío y validación.
- [Vista previa estática del panel docente](diseno/vista-previa-ui-docente.html) — incluye ejemplo interactivo del modal con datos ficticios.
