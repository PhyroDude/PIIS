# Sistema local de retroalimentación para laboratorios de cómputo

MVP de aplicación web local para apoyar la retroalimentación durante sesiones en laboratorios de cómputo. El docente crea una sesión temporal, los estudiantes se incorporan con un alias y código, y el docente puede revisar la pantalla de un estudiante seleccionado, orientar oralmente y guardar notas individuales opcionales.

> **Versión actual:** 0.3.3. El conteo parte de la base funcional 0.3.0; se mantienen descartados los cambios de las líneas posteriores que el usuario indicó no conservar. La configuración HTTPS de esta versión está implementada, pero aún requiere validación real entre equipos Windows.

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

La aplicación ofrece rutas directas: **`/docente`** muestra el acceso del docente y **`/alumno`** muestra el acceso del estudiante. Ambas rutas sirven la misma aplicación y comparten el servidor y el estado temporal; `/` conserva el selector general. `npm run start:docente` inicia el servidor y trata de abrir automáticamente la vista docente en el equipo anfitrión. Los estudiantes entran con la IP LAN del anfitrión y la ruta `/alumno`.

Las paletas azul oscuro (docente) y verde azulado (estudiante) están implementadas provisionalmente, pero **siguen pendientes de aprobación visual**. La ruta `/docente` se bloquea para solicitudes que llegan desde una dirección remota; `/index.html` y `/` tampoco permiten saltarse la selección de ruta. Esto restringe el acceso HTTP a la vista y el inicio de la sesión docente desde clientes remotos. No equivale a autenticación institucional fuerte: los demás eventos Socket.IO deben seguir protegidos mediante autorización del servidor. No expongas el servicio fuera de la LAN prevista. Las decisiones se registran en [ADR-004](docs/arquitectura/decisiones/ADR-004-acceso-y-identidad-visual-por-rol.md), [ADR-005](docs/arquitectura/decisiones/ADR-005-rutas-por-rol.md), [ADR-006](docs/arquitectura/decisiones/ADR-006-apertura-automatica-vista-docente.md) y [ADR-007](docs/arquitectura/decisiones/ADR-007-paletas-por-rol.md).

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

Desde la carpeta del proyecto:

```bash
npm install
npm test
```

En la computadora anfitriona del docente, inicia el servicio con apertura automática del acceso docente y detección de direcciones LAN:

```bash
npm run start:docente
```

Antes de iniciar por primera vez, prepara el certificado HTTPS:

```bash
npm run setup:https
```

Este comando requiere `mkcert` instalado en la computadora anfitriona. Consulta [`docs/desarrollo/puesta-en-marcha.md`](docs/desarrollo/puesta-en-marcha.md) para instalarlo y confiar la CA en los clientes Windows. Después ejecuta `npm run start:docente`: se abrirá `https://localhost:3000/docente` y la consola imprimirá direcciones `https://IP-LAN-DEL-DOCENTE:3000/alumno`. No uses `localhost` desde equipos cliente. Si cambia la IP LAN, vuelve a generar el certificado. No compartas la clave privada de la CA.

HTTPS está habilitado por defecto. La variable `HTTPS_ENABLED=false` existe únicamente para las pruebas HTTP locales automatizadas; no debe usarse para la proyección desde alumnos remotos.

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
- [`docs/arquitectura/decisiones/ADR-004-acceso-y-identidad-visual-por-rol.md`](docs/arquitectura/decisiones/ADR-004-acceso-y-identidad-visual-por-rol.md): pantallas de acceso por rol.
- [`docs/arquitectura/decisiones/ADR-005-rutas-por-rol.md`](docs/arquitectura/decisiones/ADR-005-rutas-por-rol.md): rutas `/docente` y `/alumno`.
- [`docs/arquitectura/decisiones/ADR-006-apertura-automatica-vista-docente.md`](docs/arquitectura/decisiones/ADR-006-apertura-automatica-vista-docente.md): arranque del anfitrión.
- [`docs/arquitectura/decisiones/ADR-007-paletas-por-rol.md`](docs/arquitectura/decisiones/ADR-007-paletas-por-rol.md): paletas provisionales pendientes de aprobación.
- [`docs/arquitectura/decisiones/ADR-008-despliegue-lan-y-rutas.md`](docs/arquitectura/decisiones/ADR-008-despliegue-lan-y-rutas.md): detección de IP local y restricción de la ruta docente al anfitrión.
- [`docs/diseno/proyeccion-pantalla-y-cola.md`](docs/diseno/proyeccion-pantalla-y-cola.md): flujo detallado de presentación.
- [`docs/diseno/acceso-y-paletas-por-rol.md`](docs/diseno/acceso-y-paletas-por-rol.md): diseño de las pantallas de acceso.
- [`docs/diseno/observaciones-individuales.md`](docs/diseno/observaciones-individuales.md): comportamiento de las notas.
- [`docs/pruebas/trazabilidad-y-pruebas.md`](docs/pruebas/trazabilidad-y-pruebas.md): casos de prueba propuestos.
- [`docs/pruebas/resultados/estado-inicial.md`](docs/pruebas/resultados/estado-inicial.md): estado conocido de validación.
- [`docs/desarrollo/puesta-en-marcha.md`](docs/desarrollo/puesta-en-marcha.md): instalación y pruebas manuales.
- [`docs/arquitectura/decisiones/ADR-009-https-lan.md`](docs/arquitectura/decisiones/ADR-009-https-lan.md): HTTPS confiable para captura desde la LAN.
- [`CHANGELOG.md`](CHANGELOG.md): historial de cambios; versión actual 0.3.3.

## Límites conocidos

- No hay autenticación institucional fuerte del docente; el token de sesión no sustituye una solución de identidad institucional.
- La captura de pantalla depende del navegador, de permisos explícitos y de un contexto seguro.
- HTTPS está habilitado por defecto en la versión 0.3.3; es necesario instalar `mkcert` y confiar la CA raíz en los clientes. La integración real de Firefox/Windows sigue pendiente.
- Se ha reportado un fallo al cambiar de la presentación de un estudiante a la de otro. Sigue pendiente de reproducción y corrección verificada.
- Las rutas de acceso y el descubrimiento de direcciones cuentan con pruebas unitarias básicas; falta probar el bloqueo remoto de `/docente`, la apertura automática en el sistema anfitrión y el acceso real desde equipos cliente en LAN.
- El botón de pantalla completa existe, pero debe validarse en los navegadores objetivo si satisface la expectativa de ampliar la vista de presentación completa, no solamente el elemento de vídeo.
- Las observaciones se eliminan al finalizar la sesión; al desconectarse un estudiante se eliminan también sus notas.
- Copiar/descargar notas queda deshabilitado por defecto hasta resolver formalmente RNF-002.
- No hay base de datos, historial de sesiones ni integración con plataformas académicas.
