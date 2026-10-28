# Diseño funcional — vista receptora y estados de proyección

**Versión objetivo:** InterLAB 0.4.0 · **Estado:** especificación de interfaz y transiciones (no implementada).

## 1. Composición

La computadora fija abre automáticamente `/proyeccion` en pantalla completa en el proyector. No contiene controles docentes ni archivos. Muestra **una** fuente a la vez, sin grabar video.

## 2. Estados visibles

| Estado | Contenido del proyector | Condición |
|---|---|---|
| Sin sesión ni docente | «Esperando al docente» | Servicio iniciado; sin sesión/admin/captura disponible |
| Docente transmitiendo | Video remoto de pantalla docente | Docente autorizado y WebRTC activo |
| Alumno transmitiendo | Video remoto del alumno | Turno docente concedido y alumno aceptó/capturó |
| Docente desconectado 0–29 s, sin video alumno | «Esperando conexión» | Docente reservado, WebRTC docente inactivo |
| Docente desconectado 30–89 s, sin video alumno | «Esperando conexión» y cronómetro restante 01:00→00:00 | Docente reservado; reloj controlado por servidor |
| Plazo vencido ≥90 s, sin video alumno | «Tiempo de espera concluido, esperando nuevo docente» | Credencial invalidada |
| Alumno transmitiendo durante desconexión/expiración | Video del alumno **sin superposición** de espera | Concesión previa del alumno sigue activa |
| Docente nuevo recupera control y no hay captura activa | Mensaje neutral de espera (texto exacto por definir) | Debe pulsar compartir pantalla si no hay MediaStream |

## 3. Flujo temporal de ausencia docente

![Máquina de estados temporal](interlab-v040-reconexion.png)

**No reiniciar temporizador** por fin de presentación estudiantil, recarga de receptor ni llegada de nuevas solicitudes; solo una reconexión válida del titular cancela plazo antes de vencer.

## 4. Proyección estudiantil

![Flujo de turno](interlab-v040-flujo-presentacion.png)

El alumno siempre puede finalizar su presentación; docente puede detenerla. La desconexión confirmada del alumno también la termina. La fuente de retorno es docente si existe conexión/captura; si no, mensaje según reloj/ausencia.

## 5. Criterios de accesibilidad y uso

Texto legible a distancia; alto contraste; contador actualizado como texto visible pero sin anuncios excesivos del lector de pantalla; estados diferenciables sin depender exclusivamente de color; no mostrar tokens privados, alias de alumno si no son necesarios, ni rutas de archivos. Evitar abrir nuevas pestañas en el equipo docente para descargas; ese fix previo deberá incorporarse a implementación del frontend, no se declara ya integrado.

## 6. Pendiente de UX

Definir texto exacto cuando el docente está presente pero aún no ha iniciado captura; comportamiento de fullscreen si el SO de la máquina fija cierra/reinicia la sesión gráfica; relación visual entre cambio de docente y pantalla de proyección durante la negociación WebRTC.
