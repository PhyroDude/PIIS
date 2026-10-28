# ADR-009: HTTPS confiable para captura de pantalla en la LAN

- **Estado:** Aceptada para la siguiente iteración; validación real en equipos cliente pendiente.
- **Versión de implementación:** 0.3.3 (conteo incremental desde la base 0.3.0; no se recuperan cambios descartados).
- **Fecha:** 2026-10-26

## Contexto

Los navegadores bloquean `getDisplayMedia()` cuando la página no se ejecuta en un contexto seguro. `localhost` se trata como contexto seguro, pero una IP LAN servida por HTTP normalmente no. El acceso remoto a `/alumno` por HTTP no permite iniciar la captura de pantalla.

## Decisión

InterLAB servirá HTTPS por defecto usando un certificado local generado con `mkcert`. El certificado incluye `localhost`, direcciones loopback y las IPv4 LAN detectadas durante la generación. La CA raíz de `mkcert` debe instalarse como confiable en cada equipo cliente Windows. El comando `npm run setup:https` prepara los archivos de certificado en `certs/`, directorio excluido de Git.

El servidor admite `HTTPS_ENABLED=false` solo para pruebas locales automatizadas y diagnósticos HTTP; no debe usarse para proyectar desde equipos remotos.

## Consecuencias y límites

- La configuración inicial requiere instalar `mkcert` en el host y confiar su `rootCA.pem` en los clientes.
- No se debe distribuir `rootCA-key.pem` bajo ninguna circunstancia.
- Si cambia la IP LAN, hay que volver a generar el certificado y volver a confiar en la CA solo si se cambió la instalación de `mkcert`.
- HTTPS protege el canal web y habilita el contexto seguro, pero no reemplaza la autorización de roles ni corrige por sí mismo defectos de negociación WebRTC.
- Las pruebas automatizadas no sustituyen una prueba real de Firefox/Windows y de la proyección de pantalla.
