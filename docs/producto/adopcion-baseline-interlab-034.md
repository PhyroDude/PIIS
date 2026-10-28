# Adopción del ZIP PIIS como línea base oficial

**Confirmación del responsable:** `PIIS(1).zip` es la base oficial del proyecto denominada **InterLAB v0.3.4**. La implementación del módulo de archivos, sin retirar los componentes de esa base, recibe la versión **InterLAB v0.4.0**.

El ZIP PIIS contenía conflictos de Git en archivos de código y documentación. Para construir v0.4.0 se resolvieron esos conflictos. La rama de certificados quedó compatible con OpenSSL en Linux (predeterminado) y mkcert opcional; ambas rutas de autenticación HTTPS no se presentarán como validadas con Windows hasta disponer de pruebas de LAN.

El archivo `PIIS(1).zip` también incluía un certificado y su clave privada, que fueron **omitidos deliberadamente** de v0.4.0; cada instalación debe generar sus propios certificados. Se excluyeron asimismo `.git/` y `node_modules/` del artefacto de entrega.

Los documentos originales de alcance y requisitos adjuntados se incorporan sin modificarlos, aunque los encabezados mencionen la línea base anterior. La adopción v0.3.4 queda registrada aquí y tiene prioridad para el trabajo de código futuro.
