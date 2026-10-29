# InterLAB v0.5.8 — Indicador visual de permiso de proyección

## Objetivo

Diferenciar visualmente la autorización para proyectar del estado de reposo, sobre todo durante el selector de pantalla del navegador, que puede permanecer abierto sin un indicador externo de avance.

## Estados y reglas

| Estado | Botón principal | Estilo |
|---|---|---|
| `idle` | Solicitar permiso para proyectar | Naranja fijo |
| `pending` | Cancelar solicitud | Naranja ámbar, sin animación |
| `granted` | Iniciar proyección | Azul intenso con respiración de 2 s |
| `starting` | Preparando proyección… | Mismo azul y respiración hasta confirmar WebRTC |
| `active` | Proyectando | Verde fijo |

El estado `granted` se activa al recibir la autorización de una solicitud en cola y también inmediatamente después de aceptar una petición directa y abrir `getDisplayMedia()`. Así permanece visible el efecto mientras se selecciona la ventana o pantalla. El estado `starting` aparece después de obtener la captura, mientras se establece el enlace con el receptor. **Solo** se indica `active` cuando WebRTC comunica que la conexión está establecida.

Al revocar el turno, detener la captura o desconectarse se retira la clase `is-ready` y termina la animación; un rechazo del selector conserva la posibilidad de reintentarlo si sigue concedido el turno. El botón continúa siendo la única acción principal y no se alteran los eventos ni permisos del servidor.

## Accesibilidad

La respiración alterna luminosidad de fondo, borde y sombra, sin parpadeos rápidos (periodo de 2 s). `prefers-reduced-motion: reduce` desactiva la animación y deja un azul estático. La etiqueta visible y accesible se mantiene conforme a cada estado.

## Validación pendiente

Comprobar el pulso visual y el comportamiento con el selector de pantallas en Firefox y Chrome, además del flujo completo de autorización con el docente y recepción en el proyector físico.
