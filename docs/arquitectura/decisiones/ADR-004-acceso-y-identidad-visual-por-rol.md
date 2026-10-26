# ADR-004: Separación de acceso e identidad visual por rol

- **Estado:** decisión de diseño adoptada para este incremento; requiere validación de usabilidad.
- **Fecha de registro:** 2026-10-24.
- **Ámbito:** entrada a la aplicación e interfaz de docente y estudiante.
- **Base de código:** v0.3.0.

## Contexto

La interfaz inicial presentaba la elección de rol y ambos formularios dentro del mismo panel. Aunque las operaciones del servidor ya distinguen al docente del estudiante, el acceso visual no hacía suficientemente evidente que son dos experiencias distintas. Esto puede provocar confusión al iniciar una sesión o incorporarse a ella.

## Decisión

1. Mantener una pantalla inicial que permita elegir entre **Docente** y **Estudiante**.
2. Al elegir un rol, abrir una pantalla de acceso separada con texto, formulario y acciones propios de ese rol.
3. Incluir una acción para volver a elegir el rol antes de entrar a una sesión.
4. Aplicar una paleta diferenciada en la pantalla de acceso y durante el uso de cada panel:
   - **Docente:** azul oscuro `#2546A8`, con fondo suave `#EDF2FF`.
   - **Estudiante:** verde azulado `#087F8C`, con fondo suave `#E7F7F7`.
5. Mantener etiquetas textuales explícitas para los roles. El color complementa la identificación, pero no es el único indicador.
6. Mantener el comportamiento funcional actual: el docente crea una sesión temporal y el estudiante se incorpora con código y alias temporal.
7. No añadir cuentas institucionales ni contraseñas en este cambio. El acceso docente actual crea una sesión y recibe un token temporal; no equivale a autenticación institucional.
8. Las operaciones sensibles siguen validándose en el servidor. Ocultar o estilizar elementos en el cliente no constituye un control de seguridad.

## Alternativas consideradas

| Alternativa | Ventaja | Inconveniente | Resultado |
|---|---|---|---|
| Mantener ambos formularios en el mismo panel | Menos navegación | Los roles se perciben como opciones de un único formulario | No elegida |
| Crear páginas separadas por URL | Separación visual clara | Añade rutas y complejidad sin necesidad demostrada para el MVP | No elegida por ahora |
| Mantener selector inicial y abrir pantallas de rol separadas | Flujo claro, fácil de volver y menor cambio técnico | No constituye por sí mismo autenticación | Elegida |

## Consecuencias

- La pantalla inicial actúa como selector de rol.
- El formulario de creación de sesión y el de incorporación quedan en paneles distintos.
- Los colores de acento cambian de acuerdo con el rol activo, incluyendo encabezado, botones, elementos destacados y paneles relacionados.
- La aplicación debe conservar contraste, foco visible, etiquetas y mensajes de error accesibles.
- El cambio no modifica el protocolo Socket.IO, el modelo temporal de datos ni el flujo WebRTC.

## Criterios de aceptación

1. Al seleccionar Docente solo se muestra el acceso docente, con paleta azul.
2. Al seleccionar Estudiante solo se muestra el acceso estudiantil, con paleta verde azulado.
3. Desde cualquiera de las pantallas de acceso se puede regresar al selector sin crear o unirse a una sesión.
4. Los errores de cada formulario aparecen en su propia pantalla y no en el formulario del otro rol.
5. Tras entrar, el panel conserva la paleta correspondiente al rol.
6. El docente puede crear una sesión y el estudiante puede incorporarse con código y alias como antes.
7. La separación visual no se presenta como autenticación institucional ni sustituye la autorización del servidor.
8. Se comprueba la legibilidad en escritorio y móvil, incluyendo foco de teclado y contraste.

## Pendientes

- Validar con usuarios si la distinción visual ayuda a identificar rápidamente cada rol.
- Evaluar por separado, antes de un despliegue institucional, si se requiere autenticación real del docente.
