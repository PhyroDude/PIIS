# Documentación del cambio de diseño: gestión de observaciones

**Proyecto:** Sistema local de retroalimentación para laboratorios de cómputo  
**Paquete:** propuesta de ajuste funcional v0.2  
**Estado:** propuesta documentada; requiere validación frente al SRS antes de considerar cerrado el cambio.

## Contenido

1. `01-decision-diseno.md`: motivo del cambio, decisiones confirmadas y puntos pendientes.
2. `02-backlog-observaciones.md`: épicas/historias, prioridades, criterios de aceptación y dependencias.
3. `03-diseno-funcional-observaciones-v0.2.md`: flujo funcional, reglas de negocio, modelo temporal y comportamiento al cerrar sesión.
4. `04-trazabilidad-y-pruebas.md`: relación con requisitos del SRS y casos de prueba.

## Resumen de la propuesta

- La comunicación oral es el flujo normal de retroalimentación.
- Redactar una observación es opcional; el docente no necesita escribir para atender a un estudiante.
- Las notas escritas siguen disponibles como apoyo y solo se muestran a su destinatario.
- Se propone permitir copiar o descargar las notas propias antes de cerrar la sesión, sujeto a validar su compatibilidad con RNF-002 y con la política de privacidad del proyecto.
- El servidor mantiene las notas únicamente en memoria durante la sesión y elimina su estado temporal al cerrarla.
- No se introduce historial, cuenta permanente, base de datos ni recuperación de notas desde sesiones anteriores.

## Cómo usar este paquete

Estos documentos describen el cambio y los criterios que debe satisfacer la implementación. **No afirman que el código actual ya implemente o haya superado estas pruebas.** Después de validar el cambio, se deberá actualizar el SRS mediante el proceso de control de cambios del proyecto y ejecutar las pruebas sobre la implementación real.
