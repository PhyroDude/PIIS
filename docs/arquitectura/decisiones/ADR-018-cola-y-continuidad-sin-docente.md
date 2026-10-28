# ADR-018 — Cola y actividades durante ausencia docente

**Estado:** confirmado (producto), implementación pendiente · **Fecha:** 2026-10-28

## Contexto
Se aclaró que la pérdida del docente no debe suspender la sesión ni los servicios de archivos. Solo se suspenden nuevos permisos de proyección.

## Decisión
Alumnos pueden ingresar, subir/bajar/eliminar archivos según rol y solicitar presentar durante los 90 s o después; cola FIFO conserva solicitudes sin docente. Ninguna se concede automáticamente. Docente puede elegir desde cola o priorizar directamente. Estudiante elimina propia solicitud voluntariamente; al confirmar desconexión se retira automáticamente. Una presentación estudiantil ya autorizada sigue aun tras expirar la credencial docente, sin superponer mensajes de espera. Sus transferencias de archivo en curso continúan. Al terminar, si no hay docente se muestra el aviso temporal correspondiente.

## Consecuencias
La suspensión aplica solo al comando **conceder proyección**; permisos y APIs de archivos no dependen de presencia docente. Servidor debe validar estado de presentación independientemente de titular docente.

## Validación
Carga, descarga y alta alumno sin docente; cola A,B,C; expiración durante video de A; retiro por desconexión de B; regreso docente con cola intacta y sin autorizaciones automáticas.
