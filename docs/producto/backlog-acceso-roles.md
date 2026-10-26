# Backlog: separación de acceso por rol

## ACC-01 — Elegir un rol y abrir su pantalla de acceso

**Prioridad:** P1 · **Tipo:** interfaz / usabilidad

**Como** participante, **quiero** elegir si ingreso como docente o estudiante y ver únicamente el acceso correspondiente, **para** no confundir la creación de una sesión con la incorporación a una sesión existente.

### Criterios de aceptación

- La pantalla inicial muestra dos opciones explícitas: Docente y Estudiante.
- Elegir una opción abre una pantalla propia para ese rol.
- Cada pantalla tiene una acción para regresar al selector.
- Regresar no genera solicitudes de creación o incorporación.

## ACC-02 — Diferenciar visualmente los roles

**Prioridad:** P1 · **Tipo:** diseño visual / accesibilidad

**Como** participante, **quiero** reconocer el rol activo mediante una paleta coherente y etiquetas explícitas, **para** orientarme rápidamente en la aplicación.

### Criterios de aceptación

- La interfaz docente utiliza azul oscuro `#2546A8` y fondos suaves azules.
- La interfaz estudiantil utiliza verde azulado `#087F8C` y fondos suaves verde-azulados.
- La paleta correspondiente se conserva al entrar al panel de cada rol.
- El nombre del rol y las etiquetas siguen siendo visibles; el color no es el único indicador.
- Se revisan contraste, foco de teclado y diseño adaptable.

## ACC-03 — Mantener la autorización del servidor

**Prioridad:** P0 · **Tipo:** seguridad

**Como** responsable del sistema, **quiero** que la separación visual no sustituya la validación de permisos, **para** que las operaciones restringidas continúen protegidas por el servidor.

### Criterios de aceptación

- El servidor continúa validando el token docente para las operaciones protegidas.
- Las operaciones de estudiante siguen asociadas a su conexión y sesión temporal.
- No se afirma que los colores o la pantalla separada sean autenticación institucional.
- Las pruebas automatizadas existentes siguen pasando.

## Estado

La navegación y las paletas se implementaron en el código. Los criterios de usabilidad, contraste y navegación en dispositivos reales están pendientes de validación manual. Este incremento no añade autenticación institucional.
