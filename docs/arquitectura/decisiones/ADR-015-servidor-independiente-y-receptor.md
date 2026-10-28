# ADR-015 — Servidor independiente y receptor conectado al proyector

**Estado:** confirmado (producto), implementación pendiente · **Fecha:** 2026-10-28

## Contexto
El proyecto beta colocaba servidor y vista docente en un mismo host. El nuevo entorno tiene una computadora fija y laptop personal docente. El receptor debe mostrar video remoto por WebRTC y la sesión no depender de una pestaña.

## Decisión
La computadora fija ejecuta el servicio InterLAB, almacena sesión/temporales y está conectada al proyector. Abre automáticamente la vista receptora `/proyeccion` en pantalla completa. La laptop docente accede remotamente a `/docente` y las estaciones a `/alumno`. El servicio y receptor tienen ciclos de vida independientes. Se conserva WebRTC, con señalización por Socket.IO y streaming hacia el receptor.

## Reemplaza
ADR-001 (host docente), ADR-006 (autoapertura `/docente`) y ADR-008 (bloqueo remoto `/docente`) **solo en los puntos incompatibles**; no se borran los históricos. La ruta docente pasa a ser remota por LAN.

## Alternativas y consecuencias
- Proyectar solo por cable desde laptop docente: rechazado, debe preservarse video remoto WebRTC.
- Ejecutar receptor dentro del proceso Node: no se requiere si se emplea navegador receptor; diseño técnico por confirmar.
- Requiere servicio autoarrancable, sesión gráfica de proyección, protección del receptor y pruebas LAN reales.

## Validación
Arranque sin docente, proyección desde laptop por WebRTC, cierre de la ventana receptora sin cierre de sesión, reinicio del receptor sin pérdida de estado.
