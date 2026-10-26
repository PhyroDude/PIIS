# Diseño de acceso e identidad visual por rol

## Objetivo

Hacer que el acceso del docente y el del estudiante se entiendan como dos recorridos diferentes, aunque ambos se encuentren en la misma aplicación web local.

## Flujo de navegación

1. La pantalla inicial pregunta cómo desea ingresar la persona.
2. Al elegir **Docente**, se abre el acceso docente. La acción principal crea una sesión temporal.
3. Al elegir **Estudiante**, se abre el acceso estudiantil. La persona introduce el código de sesión y un alias temporal.
4. Antes de enviar el formulario, cada pantalla permite volver al selector de rol.
5. Una vez dentro de la sesión, el panel mantiene la identidad visual del rol activo.

## Paletas adoptadas para este incremento

| Elemento | Docente | Estudiante |
|---|---|---|
| Color de acento | Azul oscuro `#2546A8` | Verde azulado `#087F8C` |
| Acento al interactuar | `#1B3687` | `#066773` |
| Fondo suave de elementos | `#EDF2FF` | `#E7F7F7` |
| Borde suave | `#CCD6F5` | `#A8DDDD` |
| Texto destacado | `#203A80` | `#075B63` |

Los valores son decisiones de diseño de este incremento. No son colores definidos por el SRS. El color se combina con el nombre del rol, encabezados y acciones; nunca se usa como único indicador.

## Contenido de las pantallas

### Acceso docente

- Etiqueta: “Área docente”.
- Título: “Acceso del docente”.
- Explicación breve de que se creará una sesión temporal.
- Acción principal: “Crear sesión temporal”.
- Acción secundaria: “Volver a elegir rol”.
- Mensajes de error dentro de la propia pantalla.

### Acceso estudiantil

- Etiqueta: “Área estudiantil”.
- Título: “Acceso del estudiante”.
- Campo obligatorio: código de sesión.
- Campo obligatorio: alias temporal.
- Acción principal: “Ingresar a la sesión”.
- Acción secundaria: “Volver a elegir rol”.
- Mensajes de error dentro de la propia pantalla.

## Reglas de interacción y accesibilidad

- El selector inicial no envía formularios ni crea sesiones.
- Volver al selector no debe crear, cerrar ni unirse a una sesión.
- Los formularios conservan validación y mensajes de error independientes.
- Las acciones principales deben distinguirse también por texto y posición, no solo por color.
- Los controles deben poder recorrerse con teclado y mostrar el foco.
- La distribución debe adaptarse a pantallas estrechas sin ocultar los campos ni las acciones.

## Límites de seguridad

La separación es de navegación e identidad visual. No añade usuario, contraseña ni identidad institucional. El servidor sigue siendo responsable de validar el rol y el token temporal para las operaciones docentes. El código de sesión y el alias continúan siendo los datos que utiliza el estudiante para incorporarse.

## Estado de validación

La implementación de la navegación y las paletas se incluye en este incremento. La aceptación visual y de usabilidad sigue pendiente de prueba manual en escritorio y móvil.
