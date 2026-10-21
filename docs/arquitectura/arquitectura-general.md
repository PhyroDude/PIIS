# Arquitectura general — MVP

**Estado:** diseño de referencia para implementación y validación; no equivale a aprobación de despliegue productivo.

## Componentes

- **Navegador del docente:** crear/cerrar sesión, listar participantes, seleccionar estudiante, revisar pantalla, registrar nota opcional.
- **Navegador del estudiante:** unirse por código y alias, autorizar captura explícitamente, consultar notas propias.
- **Servidor Node.js + Express:** sirve la interfaz web y conserva la sesión temporal en memoria.
- **Socket.IO:** eventos de sesión, participantes, observaciones y señalización para WebRTC.
- **WebRTC:** transporta la pantalla compartida directamente entre estudiante y docente una vez seleccionada. La señalización pasa por Socket.IO; el contenido de pantalla no se almacena en el servidor.

## Estado temporal

`src/session-store.js` concentra las reglas de sesión, participantes y observaciones. No usa base de datos ni escribe las observaciones a disco. Cerrar la sesión elimina el objeto en memoria. La desconexión de un estudiante elimina sus notas; la desconexión del docente cierra la sesión.

## Autorización

- El docente recibe un token temporal al crear la sesión. Las operaciones de creación de notas, selección de participante y cierre verifican ese token y el socket que creó la sesión.
- El estudiante se identifica por su socket durante la sesión. El servidor filtra las observaciones por el identificador del socket; no ofrece una operación para consultar notas ajenas.
- La señalización de pantalla solo se reenvía entre el docente y el estudiante seleccionado.

**Limitación importante:** el token temporal no es autenticación institucional fuerte. Antes de desplegar en una LAN compartida, debe definirse cómo se restringe la creación del rol docente y cómo se protegen las conexiones.

## Captura de pantalla

El navegador solicita autorización mediante `getDisplayMedia()` tras una acción explícita del estudiante. El servidor no puede aceptar silenciosamente ese permiso. La aplicación mantiene la captura local y establece WebRTC cuando el docente selecciona al estudiante. Al detener captura o cerrar la sesión, se cierran pistas/conexiones.

`getDisplayMedia()` requiere contexto seguro en navegadores modernos. `localhost` es apto para pruebas locales; para usar la IP LAN se debe configurar HTTPS y confiar el certificado en los clientes. WebRTC debe probarse en la LAN de destino.

## No persistencia y exportación

Las observaciones se guardan solo en memoria durante la sesión. Copiar/descargar está detrás de `ENABLE_NOTE_EXPORT`, deshabilitado por defecto hasta validar la interpretación de RNF-002 y aprobar la decisión. Una copia exportada queda fuera del control del sistema y no puede borrarse al finalizar la sesión.
