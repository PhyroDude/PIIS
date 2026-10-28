# ADR-001: Aplicación web local alojada en la computadora del docente

- **Estado:** decisión de plataforma confirmada; despliegue real y seguridad pendientes de validación.
- **Fecha de registro:** 2026-10-21.
- **Ámbito:** arquitectura de ejecución del Sistema local de retroalimentación.

## Contexto

El sistema debe apoyar sesiones de laboratorio dentro de una red local, funcionar sin depender de Internet durante su uso y permitir que el docente revise el trabajo de estudiantes. El desarrollo se realiza en Ubuntu/Linux, mientras que los equipos cliente previstos son Windows. El responsable está aprendiendo arquitectura de software, por lo que se prioriza una solución comprensible y verificable antes de añadir infraestructura.

## Decisión confirmada

1. La interfaz será una aplicación web local.
2. El servicio se ejecutará en la computadora del docente.
3. Los equipos se comunicarán por la LAN; Internet no será una dependencia funcional de la sesión.
4. Los estudiantes entrarán con una dirección local, un código temporal y un alias temporal.
5. El servidor mantendrá estado temporal en memoria y no usará una base de datos para el MVP.
6. La revisión de pantalla usará captura explícita del navegador y WebRTC entre el estudiante seleccionado y el docente.
7. La autorización de captura y la transmisión son conceptos distintos: tener captura preparada o estar en cola no significa que el vídeo se esté transmitiendo.

## Alternativas consideradas

| Alternativa | Ventaja | Desventaja | Resultado |
|---|---|---|---|
| Aplicación web local en equipo docente | No requiere instalar una aplicación cliente dedicada; distribución centralizada | Depende de navegador, permisos y configuración de red | Elegida |
| Aplicación nativa instalada en cada equipo | Mayor control del sistema operativo | Requiere instalación y mantenimiento por equipo | No elegida para este MVP |
| Servicio remoto en Internet | Acceso fuera del laboratorio | Contradice el enfoque local y añade dependencia de conectividad externa | Fuera del alcance |
| Base de datos e historial permanente | Facilita recuperar sesiones | Añade persistencia no necesaria para validar el flujo inicial | Fuera del alcance actual |

## Consecuencias

- La computadora del docente debe permanecer encendida y conectada durante la sesión.
- Debe definirse la dirección local que usarán los estudiantes y permitir el puerto del servicio únicamente en la red necesaria.
<<<<<<< HEAD
- La versión 0.3.3 incluye servidor HTTPS por defecto con certificado local generado mediante `mkcert`. Cada cliente debe confiar en la CA raíz; véase ADR-009.
=======
- La versión 0.3.5 incluye servidor HTTPS por defecto con certificado autofirmado generado mediante OpenSSL; véase ADR-009.
>>>>>>> 2f7796c (Integración de credenciales)
- La compatibilidad de captura, WebRTC y pantalla completa depende de navegador, permisos, certificado y configuración de red.
- El alias y el código temporal no son autenticación institucional fuerte.

## Pendientes de validación

- Confirmar el sistema operativo de despliegue definitivo del equipo docente.
- Definir cómo se distribuirá y confiará el certificado HTTPS para la dirección LAN.
- Validar conexión entre al menos un equipo docente y dos clientes Windows sin Internet.
- Evaluar el mecanismo de autenticación del docente antes de usar una LAN compartida.
- Registrar los resultados de pruebas de captura, cambio de presentador y pantalla completa.

## Requisitos relacionados

La trazabilidad exacta debe comprobarse contra el SRS original; este ADR no reemplaza ni modifica el SRS.
