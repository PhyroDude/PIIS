# ADR-014 — Resolución del generador HTTPS heredado de PIIS

**Estado:** decisión técnica para la beta v0.4.0; validación real pendiente. **Fecha:** 2026-10-28.

## Contexto
`PIIS(1).zip`, designado por el responsable como **InterLAB v0.3.4**, incluía conflictos de Git entre un script con `mkcert` y otro con OpenSSL, así como documentación para ambos. No era posible ejecutar `npm run setup:https` sin resolverlos.

## Decisión
Mantener HTTPS predeterminado en la aplicación. `npm run setup:https` usa en Linux el script OpenSSL heredado del ZIP; se conserva la alternativa `INTERLAB_CERT_PROVIDER=mkcert npm run setup:https` para quien ya haya preparado una CA confiable. No se distribuyen certificados ni claves privadas del ZIP de origen. La clave debe regenerarse en el anfitrión y mantenerse privada.

## Consecuencias
Los certificados autofirmados de OpenSSL pueden provocar advertencias en Firefox/Windows y no habilitar `getDisplayMedia` si el contexto no se considera seguro. Es necesario probar realmente la confianza del certificado en los clientes. ADR-009 y ADR-010 describen decisiones y contexto histórico y no se eliminan.
