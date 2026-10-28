# Arquitectura general — versión 0.3.3

- **Estado:** arquitectura de referencia para el MVP; las pruebas de integración entre equipos siguen pendientes.
- **Principio rector:** aplicación local de baja complejidad, sin base de datos ni dependencia funcional de Internet durante una sesión.

## Decisiones de plataforma y despliegue

- Aplicación web accesible desde navegadores.
- El servidor se ejecuta en la computadora del docente.
- Los equipos del docente y los estudiantes se comunican por la LAN del laboratorio.
- Los clientes objetivo son equipos Windows; el entorno de desarrollo actual es Ubuntu/Linux.
- El estudiante se identifica mediante alias temporal y código temporal de sesión, no mediante cuenta institucional.
- No se usa una base de datos: sesión, participantes, cola, permisos temporales y observaciones viven en memoria.
<<<<<<< HEAD
- La versión 0.3.3 sirve HTTPS por defecto mediante certificados generados localmente con `mkcert`. El certificado incluye `localhost`, loopback y las IPv4 LAN detectadas. Cada cliente Windows debe confiar en la CA raíz local para que Firefox permita `getDisplayMedia()` sin advertencias. Véase [ADR-009](decisiones/ADR-009-https-lan.md).
=======
- La versión 0.3.5 sirve HTTPS por defecto mediante un certificado autofirmado generado con OpenSSL. Incluye `localhost`, `127.0.0.1` y las IPv4 LAN detectadas. El navegador mostrará una advertencia; aceptar la excepción no garantiza que `getDisplayMedia()` esté habilitado en todos los clientes. Véase [ADR-009](decisiones/ADR-009-https-lan.md).
>>>>>>> 2f7796c (Integración de credenciales)

La decisión y sus alternativas están registradas en [ADR-001](decisiones/ADR-001-arquitectura-local.md).

## Acceso e identidad visual por rol

La misma aplicación ofrece `/docente` y `/alumno`, que muestran directamente el formulario del rol correspondiente. La ruta `/` conserva el selector general. El comando `npm run start:docente` inicia el servidor e intenta abrir `/docente` en el navegador del anfitrión; los equipos estudiantes usan la dirección LAN del anfitrión y la ruta `/alumno`. La paleta azul para docente y verde azulada para estudiante es provisional y está pendiente de aprobación. Las rutas son navegación, no autenticación. Véanse [ADR-004](decisiones/ADR-004-acceso-y-identidad-visual-por-rol.md), [ADR-005](decisiones/ADR-005-rutas-por-rol.md), [ADR-006](decisiones/ADR-006-apertura-automatica-vista-docente.md) y [ADR-007](decisiones/ADR-007-paletas-por-rol.md).

## Componentes

- **Navegador del docente:** crea/cierra sesión, muestra participantes, concede turnos, selecciona estudiantes directamente, ve la pantalla, da retroalimentación oral y registra notas opcionales.
- **Navegador del estudiante:** se incorpora con código y alias, inicia la acción explícita de captura, espera en la cola y consulta sus notas.
- **Servidor Node.js + Express:** sirve la interfaz y administra una sesión temporal.
- **Socket.IO:** comunica eventos de sesión, participantes, cola, observaciones y señalización WebRTC.
- **WebRTC:** transporta la pantalla del estudiante seleccionado directamente al navegador del docente. El servidor coordina la negociación; no almacena ni graba el vídeo.

## Flujo de captura y transmisión

1. El estudiante pulsa el botón para solicitar turno y el navegador presenta su diálogo de captura/autorización.
2. Cuando la captura queda lista, el cliente registra su disponibilidad ante el servidor.
3. Si el docente no lo ha seleccionado directamente, el estudiante se añade a la cola temporal por orden de llegada.
4. Estar en cola no debe crear un `RTCPeerConnection` ni transmitir vídeo.
5. El docente concede el turno desde la cola o selecciona directamente a cualquier participante, saltándose el orden de espera.
6. El servidor mantiene una sola selección activa y solo reenvía señalización entre el docente y el estudiante seleccionado que autorizó la captura.
7. Al cambiar de estudiante, parar la proyección, detener la captura o cerrar la sesión, se deben cerrar las conexiones y descartar señales pendientes de la negociación anterior.

**Diferencia entre decisión y código actual:** la decisión de producto inicialmente buscaba autorizar la captura al incorporarse a la sesión. En la base 0.3.0, la llamada a `getDisplayMedia()` ocurre al pulsar el botón de solicitar turno, porque el navegador requiere una acción explícita del usuario. Esta diferencia debe revisarse antes de afirmar que el requisito de autorización al incorporarse está cumplido.

## Gestión del estado

`src/session-store.js` administra una sesión activa, el docente, los estudiantes, las observaciones, la selección de pantalla, la cola y el conjunto de estudiantes con captura autorizada. Cerrar la sesión elimina el objeto en memoria. Al desconectarse un estudiante, se elimina su entrada de cola y sus observaciones; al perderse la conexión del docente, se cierra la sesión.

## Autorización y límites de seguridad

- El docente recibe un token temporal al crear la sesión. Las operaciones sensibles validan el token y el socket propietario.
- El estudiante se identifica durante la sesión por su conexión temporal; las observaciones se filtran por ese identificador, no solo por alias.
- La señalización de pantalla se limita al par docente-estudiante seleccionado.
- El token temporal no equivale a autenticación institucional fuerte. No se recomienda desplegar en una LAN compartida sin decidir cómo restringir el rol docente.
- No exponer el servicio directamente a Internet.

## Pantalla completa

La interfaz tiene un control para solicitar pantalla completa de la vista de vídeo o su contenedor, según las capacidades del navegador. La solicitud del usuario es necesaria y puede ser rechazada por el navegador. Debe comprobarse en los navegadores objetivo si cumple la expectativa de ampliar toda la ventana de presentación.

## Observaciones y no persistencia

Las observaciones escritas son opcionales y se guardan solo en memoria. Copiar/descargar está detrás de `ENABLE_NOTE_EXPORT`, deshabilitado por defecto hasta validar la interpretación de RNF-002. Una copia local queda fuera del control del sistema y no se puede borrar desde el servidor.

## Defecto conocido

Se ha reportado que, después de finalizar o cambiar desde la pantalla de A a la de B, la proyección de B no aparece. La arquitectura prevé cerrar la conexión anterior y crear una negociación nueva; no se declara resuelto hasta reproducirlo, corregirlo y validarlo entre dos equipos. Ver ADR-003 y el plan de pruebas.


## Acceso HTTP y publicación en LAN

El servidor Express escucha por defecto en `0.0.0.0:3000`, configurable mediante `HOST` y `PORT`. Al empezar a escuchar, consulta las interfaces IPv4 del sistema y muestra las direcciones candidatas para que los estudiantes abran `/alumno`. Se priorizan las direcciones IPv4 privadas; si existen varias interfaces, el operador debe escoger la que corresponda a la LAN del laboratorio.

<<<<<<< HEAD
La ruta `/docente` solo sirve la aplicación a peticiones locales del anfitrión; las peticiones remotas reciben HTTP 403. `/` y `/index.html` redirigen a `/docente` en loopback y a `/alumno` en conexiones remotas. Esta separación protege la ruta de vista y el evento de creación de sesión docente se rechaza si la conexión Socket.IO no proviene de loopback. No constituye autenticación institucional robusta; la autorización de los demás eventos Socket.IO sigue siendo una responsabilidad independiente. La versión 0.3.3 sirve HTTPS por defecto. La captura remota requiere que los navegadores cliente confíen en la CA y que la dirección usada esté incluida en el certificado.
=======
La ruta `/docente` solo sirve la aplicación a peticiones locales del anfitrión; las peticiones remotas reciben HTTP 403. `/` y `/index.html` redirigen a `/docente` en loopback y a `/alumno` en conexiones remotas. Esta separación protege la ruta de vista y el evento de creación de sesión docente se rechaza si la conexión Socket.IO no proviene de loopback. No constituye autenticación institucional robusta; la autorización de los demás eventos Socket.IO sigue siendo una responsabilidad independiente. La versión 0.3.5 sirve HTTPS por defecto con certificado autofirmado. La captura remota requiere que el navegador considere seguro el contexto y que la dirección usada esté incluida en el certificado.
>>>>>>> 2f7796c (Integración de credenciales)
