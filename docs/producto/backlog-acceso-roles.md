# Backlog: acceso por rol y arranque del anfitrión

**Base:** v0.3.0. Las rutas y el comando de inicio se implementan en este incremento; la aceptación visual continúa pendiente.

| ID | Historia / tarea | Criterio de aceptación | Estado |
|---|---|---|---|
| ACC-01 | Como docente, quiero abrir una ruta directa de acceso docente para iniciar una sesión desde el equipo anfitrión. | `/docente` muestra el acceso docente sin exigir elegir rol. | Implementado; prueba manual pendiente |
| ACC-02 | Como estudiante, quiero una ruta directa de acceso estudiantil desde mi equipo de la LAN. | `/alumno` muestra código y alias sin pasar por el selector. | Implementado; prueba manual pendiente |
| ACC-03 | Como docente, quiero que el inicio del servicio abra el acceso docente en el anfitrión. | `npm run start:docente` inicia el servidor e intenta abrir `localhost` en `/docente`. | Implementado; validar en sistema operativo anfitrión |
| ACC-04 | Como usuario, quiero que la vista correspondiente al rol tenga una identidad visual reconocible. | La ruta fija aplica la clase visual del rol y el texto identifica el área. | Provisional; paleta pendiente de aprobación |
| ACC-05 | Como responsable del producto, quiero evitar confundir navegación con seguridad. | Documentación aclara que la ruta no reemplaza la autorización del servidor. | Documentado |
