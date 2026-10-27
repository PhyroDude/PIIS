# Diseño de acceso por rol

## Objetivo

Distinguir el acceso docente del acceso estudiantil y ofrecer una ruta directa para cada rol sin duplicar la aplicación.

## Rutas

- `/docente`: presenta el formulario para crear una sesión temporal.
- `/alumno`: presenta los campos de código de sesión y alias temporal.
- `/`: mantiene el selector de rol para una entrada general.

En las rutas fijas se oculta el botón para volver al selector, evitando que el usuario pierda el contexto de acceso. La vista activa conserva la identidad visual de su rol después de entrar.

## Paleta provisional — pendiente de aprobación

| Elemento | Docente | Estudiante |
|---|---|---|
| Color de acento | Azul oscuro `#2546A8` | Verde azulado `#087F8C` |
| Acento al interactuar | `#1B3687` | `#066773` |
| Fondo suave | `#EDF2FF` | `#E7F7F7` |
| Borde suave | `#CCD6F5` | `#A8DDDD` |
| Texto destacado | `#203A80` | `#075B63` |

Estos colores son una propuesta aplicada provisionalmente en la interfaz; no están definidos por el SRS ni se consideran aprobados. Deben revisarse contraste, legibilidad y apariencia en escritorio y móvil.

## Límites de seguridad

Las rutas separan recorridos de interfaz, no privilegios de seguridad. Los eventos del servidor deben seguir verificando el rol, la sesión y el token docente. No se añade autenticación institucional.
