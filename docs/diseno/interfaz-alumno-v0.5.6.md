# InterLAB — Especificación de interfaz del alumno (v0.5.6)

**Base de trabajo:** rama estable seleccionada por el usuario y mejoras hasta v0.5.5. **Incremento:** 0.5.6 (beta).  
**Alcance:** acceso de alumno, vista de escritorio, vista móvil, solicitud de proyección, nota personal y archivos. No modifica la arquitectura monolítica ni el receptor WebRTC.

## Propósito visual

Identidad institucional: fondo crema, naranja para participación, turquesa/azul para archivos, verde salvia para retroalimentación y rojo moderado exclusivamente para solicitudes directas que necesitan respuesta. La vista para escritorio usa dos columnas de información; en teléfonos se apilan los módulos de archivos y observaciones.

## Componentes existentes y comportamiento

| Componente | Estado/acción | Resultado |
|---|---|---|
| Entrada `/alumno` | Alias temporal y código de incorporación | Se valida con el servidor; no existe edición del alias dentro de la sesión |
| Encabezado | Alias autorizado y reloj local | Personalización informativa; no expone credenciales administrativas |
| Botón naranja, reposo | Solicitar permiso para proyectar | Se agrega a cola; no solicita captura aún |
| Botón naranja, pendiente | Cancelar solicitud | Se retira la solicitud de la cola |
| Botón naranja, turno concedido | Iniciar proyección | Gesto del alumno que abre el selector de captura del navegador |
| Botón naranja, estableciendo enlace | Preparando proyección… | Todavía no indica video conectado; se puede detener la captura desde el botón principal |
| Botón naranja, enlace conectado | Proyectando | Muestra proyección activa; al pulsarlo termina la captura local y notifica al servidor |
| Alerta replegada | Símbolo de advertencia tenue | Solo indicador visual, sin botones ni interacción |
| Solicitud directa docente | Panel rojo expande con Aceptar / Denegar | Animación de respiración de borde mientras la solicitud esté sin resolver |
| Aceptar o Denegar | Alerta se repliega | Aceptar inicia flujo de captura; Denegar revoca el turno sin captura |
| Permiso desde la cola | Botón pasa a «Iniciar proyección» | Sin falsa alerta roja de solicitud directa |
| Archivos de la clase | Pestañas por remitente, carga, descarga/ZIP | Conserva autorización y límites actuales |
| Observaciones | Lista privada recibida del docente | Conserva notas con máximo 1000 caracteres desde servidor |
| Teléfono | Solo archivos y observaciones | Proyección oculta y bloqueada también desde servidor |

## Animación y accesibilidad

La alerta transita desde símbolo aislado hasta panel completo mediante ancho, opacidad y desplazamiento. El borde alterna suavemente su luminosidad alrededor de 2 segundos. Se elimina la animación con `prefers-reduced-motion: reduce`. La alerta inactiva no recibe foco y sus botones están deshabilitados. Los mensajes de estado incluyen `aria-live`, y todos los controles principales pueden accionarse con teclado.

## Arquitectura funcional conservada

La computadora fija mantiene la sesión en el servidor, y el receptor `/proyeccion` muestra WebRTC. El docente sigue autorizando un solo presentador. La API `student:request-presentation`, `student:withdraw-presentation`, `student:screen-ready` y `student:stop-sharing` permanece vigente. `screen:requested` añade `fromQueue` como dato informativo para seleccionar la interacción adecuada; el servidor sigue siendo autoridad sobre turnos y fuente de video.

## Pruebas y limitaciones

Las pruebas automatizadas locales verifican estados de texto, disponibilidad de controles móviles, presencia de los módulos y distinción cola/solicitud directa. **Pendientes en laboratorio:** animación real, diseño en Firefox/Chrome/Android/iOS, cambio de emisor WebRTC, reproducción efectiva y descargas en navegador.
