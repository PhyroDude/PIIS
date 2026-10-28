# Archivos incluidos en InterLAB v0.4.0

Este incremento incluye los **dos documentos de alcance v1.1** solicitados por el responsable (`.md` y `.docx`) bajo `docs/producto/`, y los requisitos consolidados de archivos v0.1 bajo `docs/requisitos/` (Markdown/Word).

También incluye diagramas `.png` y fuentes `.dot` en `docs/diseno/`; descripción arquitectónica, ADR-011 a ADR-014, plan y resultado de pruebas, backlog original y el SRS original. No se cambia la estructura de categorías `docs/{requisitos,producto,arquitectura,diseno,pruebas,desarrollo}`.

El ZIP contiene código fuente y `package-lock.json` pero **no** `node_modules/`, `.git/` ni certificados o claves privadas. Ejecuta `npm ci` para instalar dependencias en un equipo con acceso al registro o caché npm apropiada y genera certificados por instalación.
