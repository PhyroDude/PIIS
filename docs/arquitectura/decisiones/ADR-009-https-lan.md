<<<<<<< HEAD
# ADR-009: HTTPS confiable para captura de pantalla en la LAN

- **Estado:** Aceptada para la siguiente iteración; validación real en equipos cliente pendiente.
- **Versión de implementación:** 0.3.3 (conteo incremental desde la base 0.3.0; no se recuperan cambios descartados).
=======
# ADR-009: HTTPS para captura de pantalla en la LAN

- **Estado:** Aceptada; validación real en equipos cliente pendiente.
- **Versión de adaptación:** 0.3.5.
>>>>>>> 2f7796c (Integración de credenciales)
- **Fecha:** 2026-10-26

## Contexto

<<<<<<< HEAD
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
=======
Los navegadores restringen `getDisplayMedia()` cuando la página no se ejecuta en un contexto seguro. `localhost` suele considerarse seguro, pero una IP LAN servida por HTTP normalmente no. Se necesita HTTPS para probar la captura remota desde los equipos del laboratorio.

## Decisión

InterLAB servirá HTTPS por defecto y generará el certificado del servidor con OpenSSL, sin depender de mkcert ni de una autoridad certificadora local. `npm run setup:https` ejecuta `scripts/setup-https-linux.sh`, que crea `certs/interlab.pem` y `certs/interlab-key.pem`. El certificado incluye `localhost`, `127.0.0.1` y las IPv4 LAN detectadas durante la generación.

El certificado es autofirmado. El navegador mostrará una advertencia y el usuario podrá probar a continuar, pero aceptar una excepción **no garantiza** que todos los navegadores habiliten `window.isSecureContext` o `getDisplayMedia()`. Si el contexto no se considera seguro, se deberá instalar y confiar el certificado en los clientes o usar una CA confiable. La clave privada del servidor nunca debe compartirse.

`HTTPS_ENABLED=false` se reserva para pruebas locales automatizadas y diagnósticos HTTP; no debe usarse para proyectar desde equipos remotos.

## Consecuencias y límites

- La configuración inicial requiere OpenSSL, incluido habitualmente en Linux; no requiere mkcert.
- El certificado dura 365 días y debe regenerarse si cambia la IP LAN o expira.
- Los certificados quedan en `certs/`, excluidos de Git. La clave `certs/interlab-key.pem` tiene permisos restrictivos.
- HTTPS protege el canal web y puede habilitar el contexto seguro, pero no reemplaza la autorización de roles ni corrige defectos de negociación WebRTC.
- Las pruebas automatizadas no sustituyen una prueba real en Firefox/Windows y de la proyección de pantalla.
>>>>>>> 2f7796c (Integración de credenciales)
