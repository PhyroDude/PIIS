# Rediseño de la interfaz docente — InterLAB v0.5.0

**Estado:** propuesta implementada sobre la base estable v0.5.0, pendiente de validación visual y funcional en el laboratorio.  
**Alcance:** exclusivamente `/docente` durante una sesión activa. **No** modifica `/alumno`, `/proyeccion`, `server.js` ni la negociación WebRTC.

## Objetivo

Adaptar el panel docente al uso horizontal en computadoras de escritorio, siguiendo el boceto de referencia aprobado. El panel «Participantes en la sesión» comienza a la misma altura que los controles de proyección y ocupa **toda** la columna derecha de la zona central. A la izquierda se encuentran los botones «Compartir mi pantalla» y «Detener proyección actual», con la cola debajo. La gestión temporal de archivos ocupa el ancho completo de la parte inferior.

## Distribución

1. **Encabezado:** marca InterLAB, fuente actual de proyección, código copiable y finalizar sesión.
2. **Zona central, columna izquierda:** controles de proyección y cola de solicitudes con filtro por alias. La concesión de una solicitud mantiene las reglas del servidor.
3. **Zona central, columna derecha:** participantes conectados, búsqueda, alternancia A–Z / Z–A, dispositivo, estado y acciones.
4. **Alumno seleccionado:** selección visual, aviso de teléfono, solicitud de proyección y nota individual. La selección del alumno no provoca la captura por sí misma.
5. **Notas:** formulario opcional expandible para conservar la retroalimentación individual.
6. **Archivos:** pestañas existentes, búsqueda y orden sobre archivos de alumnos, cargas múltiples, descargas y acciones de eliminación según permisos.

## Reglas preservadas

- El código de incorporación se mantiene visible; no se expone el token administrativo.
- Para alumnos identificados como teléfono, la solicitud de presentación permanece deshabilitada, pero se permite enviar notas.
- Las solicitudes de los alumnos se almacenan en la cola y el docente puede conceder, rechazar o seleccionar directamente.
- Las acciones de proyección siguen usando los mismos eventos Socket.IO y los mismos identificadores HTML; WebRTC y la vista receptora permanecen sin modificar.
- La descarga de archivos continúa usando el mecanismo actual sin abandonar la pestaña docente.
- El cierre de la sesión conserva su diálogo de confirmación.

## Adaptación al tamaño de pantalla

- Escritorio ancho (recomendado): dos columnas, panel derecho de participantes extendido desde arriba.
- Escritorio mediano: los controles y el encabezado se ajustan sin ocultar funcionalidades.
- Espacios estrechos: los paneles se apilan, y las tablas mantienen desplazamiento horizontal dentro de su región.

## Pruebas sugeridas

1. Visualizar el panel en 1920×1080 y 1366×768 sin recortar controles críticos.
2. Seleccionar un alumno de escritorio y solicitar su proyección.
3. Seleccionar un alumno teléfono y comprobar que la solicitud aparece deshabilitada y «Dar nota personal» permanece activo.
4. Filtrar y ordenar participantes sin afectar la lista del servidor.
5. Conceder y rechazar solicitudes desde la cola; comprobar que no se altera WebRTC.
6. Cambiar entre «Mis archivos» y «Archivos de los alumnos», cargar y descargar un archivo.
7. Actualizar `/docente`: verificar que la sesión siga en el servidor y el panel se recupere.
8. Finalizar la sesión y comprobar confirmación y limpieza según el comportamiento existente.

> La imagen de referencia es un boceto visual. El archivo HTML de vista previa incluye datos ficticios y no establece conexiones reales con el servidor.
