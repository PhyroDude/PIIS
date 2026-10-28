# ADR-020 — Control remoto docente, receptor autorizado y operación local

**Estado:** mixto — primeros accesos y uso local confirmados; mecanismos de seguridad propuestos para validación · **Fecha:** 2026-10-28

## Contexto
Permitir `/docente` por LAN elimina la antigua restricción loopback de ADR-008. El primer acceso no demuestra identidad real; la ruta `/proyeccion` expone información de pantalla si no se protege.

## Decisión
Aplicar concesión de primer acceso de forma atómica en servidor, permitir administración remota solo al titular con credencial privada y proteger la vista receptora para que solo el dispositivo fijo reciba video. Proponer cookies `Secure`, `HttpOnly` y `SameSite`, tokens efímeros por negociación, control anti-replay y comando local para liberar rol. Servicio/receptor autoiniciados con el sistema operativo cuando exista entorno gráfico.

## Riesgos y validación
Riesgo **aceptado por el usuario**: un estudiante que llegue primero podría reclamar el rol docente. No presentar este modelo como autenticación robusta. Validar rutas, cookies, token antiguo, origen de Socket.IO, HTTPS y receptor no autorizado desde otra PC. La forma exacta de lanzar GUI, permisos de sistema y política de firewall no quedan decididas aquí.
