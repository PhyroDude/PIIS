# Sistema local de retroalimentación para laboratorios de cómputo

MVP de aplicación web local para apoyar la retroalimentación durante sesiones en laboratorios de cómputo. El docente crea una sesión temporal, los estudiantes se incorporan con un alias y código, y el docente puede revisar la pantalla de un estudiante seleccionado, orientar oralmente y guardar notas individuales opcionales.

> **Base de trabajo:** archivo de referencia v0.3.0. El campo `version` de `package.json` conserva el valor `0.2.0`; esta actualización se limita a documentación y no cambia ese metadato. Las pruebas reales entre equipos siguen pendientes.

## Estado y alcance

### Incluido en la base 0.3.0

- Una sesión activa por proceso del servidor y hasta 30 estudiantes.
- Pantallas de acceso separadas para docente y estudiante, con paletas visuales diferenciadas.
- Incorporación mediante dirección local, código temporal y alias temporal.
- Panel del docente con lista de participantes y selección directa.
- Cola temporal de presentación: el estudiante solicita turno; el docente concede el acceso.
- Selección directa del docente con prioridad sobre la cola.
- Un solo estudiante seleccionado para negociar una transmisión de pantalla a la vez.
- Captura de pantalla con autorización explícita del navegador y transmisión WebRTC bajo demanda.
- Retroalimentación oral como flujo principal y notas individuales opcionales de hasta 1,000 caracteres.
- Consulta de notas propias durante la sesión.
- Control de pantalla completa para la vista de pantalla compartida.
- Estado en memoria; el cierre de sesión elimina participantes, cola y observaciones.

### Decisiones de producto y arquitectura

- **Plataforma:** aplicación web local, servida desde la computadora del docente.
- **Red:** LAN del laboratorio; las funciones principales no deben depender de Internet.
- **Clientes previstos:** navegadores en equipos Windows; el entorno de desarrollo usado por el responsable es Ubuntu/Linux.
- **Identificación:** alias temporal, no identidad académica persistente.
- **Transmisión:** la captura y el permiso dependen del navegador; el estudiante debe realizar una acción explícita para autorizarla. El vídeo no debe enviarse mientras el estudiante espera en la cola.
- **Transporte de pantalla:** WebRTC entre navegadores; Socket.IO coordina la sesión y la señalización. El servidor no actúa como grabador ni almacena vídeo.
- **Datos:** no hay base de datos ni historial permanente.
- **Exportación de notas:** copiar/descargar está deshabilitado por defecto hasta validar su compatibilidad con RNF-002.

La selección de arquitectura y sus límites se explican en [`docs/arquitectura/arquitectura-general.md`](docs/arquitectura/arquitectura-general.md) y los ADR enlazados desde [`docs/README.md`](docs/README.md).

## Acceso e identidad visual por rol

La interfaz distingue dos recorridos: **Docente**, con paleta azul oscuro, crea una sesión temporal; **Estudiante**, con paleta verde azulado, se incorpora mediante código y alias temporal. Cada recorrido tiene su propia pantalla de acceso y permite volver al selector antes de enviar el formulario. La distinción visual no constituye autenticación institucional ni sustituye los controles del servidor.

La decisión se registra en [`docs/arquitectura/decisiones/ADR-004-acceso-y-identidad-visual-por-rol.md`](docs/arquitectura/decisiones/ADR-004-acceso-y-identidad-visual-por-rol.md), con el diseño en [`docs/diseno/acceso-y-paletas-por-rol.md`](docs/diseno/acceso-y-paletas-por-rol.md) y las historias en [`docs/producto/backlog-acceso-roles.md`](docs/producto/backlog-acceso-roles.md).

## Flujo de presentación de pantalla

1. El estudiante entra a la sesión con el código y un alias temporal.
2. Cuando desea solicitar turno, pulsa **Solicitar turno / autorizar pantalla** y acepta la selección de captura en el navegador.
3. La solicitud se añade a la cola por orden de llegada. Mientras espera, no debe existir transmisión de vídeo.
4. El docente concede el turno desde la cola, o selecciona directamente a cualquier participante para darle prioridad.
5. Solo el estudiante seleccionado y que ya autorizó la captura negocia WebRTC con el docente.
6. Al cambiar de estudiante, detener la proyección o terminar la captura, se debe cerrar la conexión anterior y evitar que el estudiante anterior siga transmitiendo.
7. Al terminar su presentación, el estudiante puede volver a solicitar turno si desea presentar otra vez.

**Defecto conocido por validar:** se reportó que, después de mostrar correctamente al estudiante A y pasar al estudiante B, la proyección de B no aparece. La cola y la exclusividad están implementadas en el código, pero ese cambio de turno no debe considerarse resuelto hasta completar una prueba real y corregir el problema si se reproduce. Consulta [`docs/arquitectura/decisiones/ADR-003-cola-presentacion.md`](docs/arquitectura/decisiones/ADR-003-cola-presentacion.md).

## Requisitos y puesta en marcha

- Node.js 20 o posterior recomendado.
- npm.
- Navegador moderno compatible con `getDisplayMedia()` y WebRTC.
- Equipos conectados a la misma LAN.

En Ubuntu/Linux, desde la carpeta del proyecto:

```bash
npm install
npm test
npm start
```

En la computadora que ejecuta el servidor, abre `http://localhost:3000`. En la versión 0.3.0, el servidor incluido escucha por HTTP; los navegadores modernos requieren un contexto seguro para `getDisplayMedia()` en equipos remotos. Por tanto, la captura de pantalla a través de una IP LAN requiere una terminación HTTPS confiable configurada por separado (por ejemplo, un proxy TLS del laboratorio) y un certificado válido y confiable en los clientes. Esta base no incluye un servidor HTTPS propio ni convierte automáticamente HTTP en HTTPS.

La guía detallada está en [`docs/desarrollo/puesta-en-marcha.md`](docs/desarrollo/puesta-en-marcha.md). No expongas el servicio directamente a Internet.

## Pruebas

```bash
npm test
```

Las pruebas unitarias cubren principalmente el estado de sesión y la cola. No sustituyen las pruebas manuales de captura de pantalla, WebRTC, cambio de A a B, permisos del navegador, pantalla completa, desconexiones y funcionamiento real en la LAN.

## Documentación

- [`docs/README.md`](docs/README.md): índice, autoridad documental y reglas de actualización.
- [`docs/requisitos/SRS-original.pdf`](docs/requisitos/SRS-original.pdf): fuente original de requisitos.
- [`docs/producto/alcance-MVP-y-product-backlog-base.md`](docs/producto/alcance-MVP-y-product-backlog-base.md): alcance y trazabilidad con el SRS.
- [`docs/producto/backlog-observaciones.md`](docs/producto/backlog-observaciones.md): historias de retroalimentación oral y notas.
- [`docs/arquitectura/arquitectura-general.md`](docs/arquitectura/arquitectura-general.md): componentes y límites técnicos.
- [`docs/arquitectura/decisiones/ADR-001-arquitectura-local.md`](docs/arquitectura/decisiones/ADR-001-arquitectura-local.md): plataforma y despliegue local.
- [`docs/arquitectura/decisiones/ADR-002-gestion-observaciones.md`](docs/arquitectura/decisiones/ADR-002-gestion-observaciones.md): retroalimentación oral y notas opcionales.
- [`docs/arquitectura/decisiones/ADR-003-cola-presentacion.md`](docs/arquitectura/decisiones/ADR-003-cola-presentacion.md): cola, concesión y exclusividad de presentación.
- [`docs/arquitectura/decisiones/ADR-004-acceso-y-identidad-visual-por-rol.md`](docs/arquitectura/decisiones/ADR-004-acceso-y-identidad-visual-por-rol.md): separación de acceso y paletas por rol.
- [`docs/diseno/proyeccion-pantalla-y-cola.md`](docs/diseno/proyeccion-pantalla-y-cola.md): flujo detallado de presentación.
- [`docs/diseno/acceso-y-paletas-por-rol.md`](docs/diseno/acceso-y-paletas-por-rol.md): diseño de las pantallas de acceso.
- [`docs/diseno/observaciones-individuales.md`](docs/diseno/observaciones-individuales.md): comportamiento de las notas.
- [`docs/pruebas/trazabilidad-y-pruebas.md`](docs/pruebas/trazabilidad-y-pruebas.md): casos de prueba propuestos.
- [`docs/pruebas/resultados/estado-inicial.md`](docs/pruebas/resultados/estado-inicial.md): estado conocido de validación.
- [`docs/desarrollo/puesta-en-marcha.md`](docs/desarrollo/puesta-en-marcha.md): instalación y pruebas manuales.
- [`CHANGELOG.md`](CHANGELOG.md): cambios incluidos en la base 0.3.0.

## Límites conocidos

- No hay autenticación institucional fuerte del docente; el token de sesión no sustituye una solución de identidad institucional.
- La captura de pantalla depende del navegador, de permisos explícitos y de un contexto seguro.
- El servidor 0.3.0 incluido sirve HTTP; HTTPS para clientes remotos requiere infraestructura TLS externa y certificados confiables.
- Se ha reportado un fallo al cambiar de la presentación de un estudiante a la de otro. Sigue pendiente de reproducción y corrección verificada.
- El botón de pantalla completa existe, pero debe validarse en los navegadores objetivo si satisface la expectativa de ampliar la vista de presentación completa, no solamente el elemento de vídeo.
- Las observaciones se eliminan al finalizar la sesión; al desconectarse un estudiante se eliminan también sus notas.
- Copiar/descargar notas queda deshabilitado por defecto hasta resolver formalmente RNF-002.
- No hay base de datos, historial de sesiones ni integración con plataformas académicas.
