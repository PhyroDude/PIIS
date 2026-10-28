# ADR-010: Distribución de confianza HTTPS en clientes Windows

- **Estado:** Propuesta implementada documentalmente; adopción de GPO pendiente de confirmar con TI.
- **Versión:** 0.3.4 (conteo incremental desde la base 0.3.0).
- **Fecha:** 2026-10-26

## Contexto

El servidor HTTPS de InterLAB usa certificados emitidos por una CA local de `mkcert`. La CA es confiable en el equipo donde se creó, pero esa confianza no se propaga automáticamente a los navegadores de otros equipos. Instalar la raíz manualmente en cada computadora es poco práctico.

## Decisión propuesta

Añadir un script PowerShell idempotente para instalar el certificado público `rootCA.pem` en el almacén de confianza de Windows, y documentar su distribución centralizada mediante GPO cuando las computadoras estén administradas por Active Directory. El script permite `CurrentUser` para pruebas y `LocalMachine` para despliegues administrados.

## Seguridad

- Solo se distribuye `rootCA.pem`.
- `rootCA-key.pem` nunca se copia a los clientes ni se publica.
- La huella de la CA debe verificarse por un canal independiente.
- La política de distribución y la ubicación de los archivos deben ser aprobadas y probadas por TI.

## Consecuencias y asuntos pendientes

- En equipos unidos a un dominio y administrados, TI puede distribuir la raíz a gran escala sin instalarla manualmente equipo por equipo.
- Si los equipos son independientes y no existe una herramienta de administración central, el script por sí solo no elimina la necesidad de instalar la raíz en cada equipo.
- Sigue pendiente confirmar la infraestructura del laboratorio y probar la instalación en Windows, Firefox y Chromium.
- `mkcert` está orientado a desarrollo y pruebas; para un despliegue institucional permanente, TI debe decidir si esta CA local es aceptable.
