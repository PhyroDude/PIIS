# InterLAB v0.5.9 — Iconografía por estado del botón de proyección

Actualización exclusivamente visual del botón principal en `/alumno`. El sistema de autorización y WebRTC conserva la implementación v0.5.8.

| Estado interno | Etiqueta | Icono | Estilo de v0.5.8 |
|---|---|---|---|
| `idle` | Solicitar permiso para proyectar | Megáfono original | Naranja, fijo |
| `pending` | Cancelar solicitud | Mano alzada (PNG del usuario) | Naranja atenuado / ámbar grisáceo, fijo |
| `granted` | Iniciar proyección | Mano alzada (PNG del usuario) | Azul brillante, animación respirante cada 2 s |
| `starting` | Preparando proyección… | Mano alzada (PNG del usuario) | Azul brillante, animación respirante cada 2 s |
| `active` | Proyectando | Proyector (PNG del usuario) | Verde, fijo |

La palomita enviada por el usuario se conserva como referencia conceptual para futuros usos y **no** se inserta en el botón.

## Ubicación de archivos

- `public/assets/megafono-marron.png`: recurso previamente existente, sin cambios.
- `public/assets/alumno-mano-alzada.png`: imagen aportada por el usuario.
- `public/assets/alumno-proyector.png`: imagen aportada por el usuario.
- `public/index.html`: elemento `<img>` del botón recibe un identificador.
- `public/app.js`: mapeo de los estados a las imágenes.
- `public/styles.css`: iconos blancos cuando el fondo es azul o verde.

## Criterios de aceptación

1. No se añade animación al estado `pending`.
2. No cambia ningún color ni animación del botón respecto a v0.5.8.
3. En `granted` y `starting` se conserva la respiración azul.
4. La imagen de proyector aparece únicamente cuando el estado real pasa a `active`.
5. El acceso móvil no habilita controles de captura y el efecto azul respeta `prefers-reduced-motion`.
