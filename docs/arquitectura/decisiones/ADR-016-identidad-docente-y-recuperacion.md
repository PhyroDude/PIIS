# ADR-016 — Primer acceso docente, recuperación y caducidad

**Estado:** confirmado (producto); diseño de credencial por validar · **Fecha:** 2026-10-28

## Contexto
El docente no está físicamente en el servidor y debe poder cerrar/actualizar su navegador sin terminar una sesión. No se utilizará contraseña inicial (elección explícita C).

## Decisión
El primer navegador que acceda a `/docente` cuando el rol está libre obtiene control exclusivo. Se entrega una credencial privada persistible en el mismo perfil, distinta del código público para alumnos. La desconexión confirmada inicia 90 segundos de recuperación: 0–30 s «Esperando conexión», 30–90 s mismo texto y cronómetro de 60 s; transcurridos 90 s, invalidar la credencial y liberar rol. No termina sesión ni archivos. Liberación local por profesor es excepcional, con revocación inmediata del video anterior.

## Riesgo y alternativas
La elección de primer acceso permite que cualquier equipo de la LAN se adelante. La credencial en cookie segura es propuesta: implementación debe impedir robo/reutilización y carreras concurrentes. Se descartó solicitud de contraseña inicial por decisión del usuario. Borrar cookies impide reconocimiento antes de expirar la reserva; no existe promesa de recuperación mágica.

## Validación
Primer acceso concurrente; reload/cierre/reapertura mismo navegador; cookie perdida; expiración 30/90 s; nuevo docente; rechazo del titular revocado; liberación solo local.
