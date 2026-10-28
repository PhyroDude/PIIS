# Alcance implementado de InterLAB 0.5.0 beta

La [enmienda formal al SRS](../requisitos/SRS-enmienda-modelo-servidor-proyeccion-v0.4.0.md), el [alcance revisado v1.2](alcance-MVP-redisenio-v1.2.md), el [backlog incremental](backlog-redisenio-v0.4.0.md) y los ADR-015 a ADR-020 son las **fuentes del cambio**; este documento identifica lo que ya se ha programado, sin atribuir resultados no probados.

| Componente | Implementación en 0.5.0 | Evidencia o pendiente |
|---|---|---|
| Titular docente independiente de la pestaña | Sí: cookie privada y `teacher:attach` | Test unitario e integración Socket.IO |
| Sesión en memoria del servidor hasta cierre/reinicio | Sí | Test unitario; corte de energía real pendiente |
| Espera docente de 90 s (aviso 30 s + cuenta regresiva 60 s) | Sí, cálculo servidor/receptor | Test de estados; revisión visual pendiente |
| Continuidad de proyección estudiantil sin docente | Sí, exclusividad del turno y condición de estado | Test unitario e integración; WebRTC físico pendiente |
| Cola durante ausencia docente sin nuevos permisos | Sí | Test de integración |
| Proyección receptor local `/proyeccion` | Sí, HTML/JS con peer receptor | Prueba física LAN/proyector pendiente |
| Captura predeterminada docente con gesto explícito | Sí | Navegador real pendiente |
| Solicitud alumno sin captura | Sí | Test de Socket.IO; navegador real pendiente |
| Aviso al alumno con aceptar/rechazar | Sí | Revisión visual pendiente |
| Archivos de v0.4.0 | Conservados, sin base de datos | Tests HTTP y unitarios |
| Descarga sin abandonar `/docente` | Sí, `iframe` oculto | Validar en navegador Windows |
| Inicio automático servidor+receptor | Script Linux y guía | Instalación real pendiente |
| Claves/certificados locales | No distribuidos | Preparación HTTPS requerida |

**Pendientes deliberados:** verificaciones físicas de WebRTC A→B, rendimiento con tráfico de archivos, soporte de autoarranque Windows para la máquina fija si aplica, recuperación de identidad del alumno tras desconexión, revisión de seguridad del primer acceso sin contraseña y respaldo operativo del proyector.

**Historial documental:** SRS original y documentación de v0.4.0 permanecen disponibles como fuentes de requisitos y decisiones anteriores; no fueron sobrescritos.
