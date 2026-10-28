# Automatizar la confianza HTTPS en clientes Windows

## Objetivo

Evitar la instalación manual de la CA de `mkcert` en cada computadora del laboratorio. El mecanismo preferido, si la universidad administra los equipos mediante Active Directory y directivas de grupo (GPO), es distribuir **solo** `rootCA.pem` mediante una política de TI.

> `mkcert` está orientado a desarrollo y pruebas. Esta solución documenta el despliegue del MVP en una LAN controlada; no convierte `mkcert` en una CA de producción.

## Preparación en el equipo docente

1. Genera los certificados de InterLAB:

   ```bash
   npm run setup:https
   ```

2. Localiza la carpeta de la CA:

   ```bash
   mkcert -CAROOT
   ```

3. Copia únicamente `rootCA.pem` a una ubicación aprobada por TI desde la que los equipos administrados puedan leerlo, por ejemplo un recurso de solo lectura en SYSVOL o una ubicación de distribución gestionada.

**Nunca copies `rootCA-key.pem`, ni la carpeta completa de mkcert, ni la clave privada del servidor.** La persona que administre el despliegue debe verificar la huella de la CA por un canal independiente antes de distribuirla.

## Distribución centralizada con GPO (requiere TI)

Esta opción solo aplica si las computadoras están unidas a un dominio de Active Directory y la universidad permite administrar sus políticas. No es necesario que el desarrollador configure el dominio por su cuenta.

1. El administrador de TI coloca `rootCA.pem` en una ubicación de distribución protegida contra escritura por usuarios comunes.
2. Crea o actualiza una GPO vinculada a la unidad organizativa que contiene los equipos del laboratorio.
3. En **Computer Configuration → Policies → Windows Settings → Scripts (Startup/Shutdown) → Startup**, configura un script de inicio que se ejecute con permisos de sistema.
4. El script debe importar `rootCA.pem` al almacén de equipo **Trusted Root Certification Authorities**. Se puede usar el script incluido `scripts/windows/install-interlab-root-ca.ps1` con `-Scope LocalMachine` y la ruta local o UNC del archivo:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\install-interlab-root-ca.ps1 -RootCaPath \\servidor\recurso-ti\rootCA.pem -Scope LocalMachine
   ```

   La ruta de ejemplo debe sustituirse por la ruta real autorizada. El script de instalación y el certificado deben estar accesibles en la ubicación que use la GPO. TI debe probar primero la política en un equipo piloto.

5. Aplica la política, reinicia o actualiza las directivas en los equipos piloto y confirma que la CA aparece en **Certificates (Local Computer) → Trusted Root Certification Authorities → Certificates**.
6. Reinicia el navegador y accede a `https://IP-LAN-DEL-DOCENTE:3000/alumno`. El certificado del servidor debe coincidir con el nombre o IP usados y no mostrar advertencias.

El comando anterior es un patrón de configuración; la estructura exacta de la GPO y la ubicación de los archivos debe validarla TI según sus políticas. No ejecutes scripts de instalación de certificados de fuentes no verificadas.

## Instalación de prueba en un solo equipo

Para una prueba aislada sin GPO, el script se puede ejecutar en el contexto del usuario actual:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\windows\install-interlab-root-ca.ps1 -RootCaPath .\rootCA.pem -Scope CurrentUser
```

Para `-Scope LocalMachine` se requieren privilegios administrativos. Esta prueba individual no es la estrategia de despliegue final; sirve para verificar el certificado antes de solicitar una distribución centralizada.

## Si no hay dominio o GPO

El script no puede distribuir por sí solo la confianza a todas las computadoras. En ese caso se debe acordar con TI otro mecanismo de administración centralizada (por ejemplo, la herramienta institucional de administración de dispositivos) o aceptar una instalación por dispositivo. No se debe intentar ocultar ni omitir la advertencia del navegador.

## Seguridad y renovación

- Distribuye únicamente el certificado público `rootCA.pem`; nunca `rootCA-key.pem`.
- No publiques la CA en una página HTTP abierta a cualquier usuario de la LAN.
- Limita la lectura/escritura del recurso de distribución y verifica la huella por un canal independiente.
- Regenera el certificado del servidor cuando cambie una IP LAN incluida en sus nombres alternativos. Si se conserva la misma CA de mkcert, no es necesario volver a distribuir la raíz solo por renovar el certificado del servidor.
- Si la CA raíz se pierde o compromete, detén el servicio y coordina con TI una sustitución de CA y retirada de la anterior.
