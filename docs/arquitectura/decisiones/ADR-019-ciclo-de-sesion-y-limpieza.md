# ADR-019 — Ciclo de sesión separado de navegador y limpieza al reiniciar

**Estado:** confirmado (producto), implementación pendiente · **Fecha:** 2026-10-28

## Contexto
En la beta actual, desconectar al docente finaliza sesión. El usuario requiere continuidad mientras viva el servicio, pero no recuperación de sesión tras reinicio.

## Decisión
El servidor es titular de la sesión en memoria; cerrar/recargar pestaña docente o receptora no la destruye. Expiración docente revoca rol, no sesión. Solo cierre explícito confirmado o reinicio del servicio finalizan sesión, invalidan código, tokens, cola, WebRTC, archivos y transferencias. En inicio después de caída imprevista, limpiar directorios temporales **delimitados al servicio** antes de aceptar nuevas sesiones.

## Consecuencias
El tiempo de vida de credenciales no equivale al tiempo de vida del contenido de clase. Si el proceso muere abruptamente, solo al siguiente arranque puede garantizarse limpieza de residuos. No restaurar alumnos/sesión desde disco.

## Validación
Refresh y cierre de navegador; renovación de control; sesión sobrevive; `SIGKILL` y relanzamiento limpieza de archivos `.part`; cierre con ZIP/PUT activos; no se crean archivos posteriores al cierre.
