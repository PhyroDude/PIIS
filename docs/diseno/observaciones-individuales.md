# Diseño funcional — gestión de observaciones v0.2

> **Base de código para la integración:** 0.3.0. La pantalla compartida y la cola se describen en [`proyeccion-pantalla-y-cola.md`](proyeccion-pantalla-y-cola.md). La retroalimentación oral es el flujo normal; la nota escrita sigue siendo opcional.

- **Proyecto:** Sistema local de retroalimentación para laboratorios de cómputo
- **Estado:** propuesta de ajuste funcional; validar contra el SRS completo.
- **Relacionado con:** ADR-OBS-002 y OBS-01 a OBS-07.

## 1. Objetivo

Reducir la fricción durante una sesión de laboratorio al hacer de la comunicación oral la modalidad normal de retroalimentación y mantener las observaciones escritas como una herramienta opcional. Se propone evaluar la copia o descarga de las notas propias antes del cierre sin introducir persistencia del lado del servidor.

## 2. Alcance

### Incluido en el diseño base
- Seleccionar un estudiante activo y revisar su pantalla, conforme al flujo de captura del MVP.
- Dar retroalimentación oral sin necesidad de registrar una nota en la aplicación.
- Crear una observación individual opcional.
- Mostrar al estudiante únicamente sus propias observaciones durante la sesión.
- Mantener las notas en memoria del servidor.
- Eliminar el estado temporal al finalizar la sesión.

### Propuesto y pendiente de aprobación
- Copiar observaciones propias al portapapeles.
- Descargar observaciones propias como archivo `.txt`.
- Mensaje preventivo antes del cierre que recuerde al estudiante que puede exportar sus notas.

### Fuera de este diseño
- Historial permanente o recuperación en sesiones posteriores.
- Base de datos de observaciones.
- Envío automático a otros estudiantes o proyección automática.
- Edición, borrado individual, adjuntos, confirmación de lectura.
- Garantizar el borrado de archivos descargados o de contenido copiado fuera del sistema.

## 3. Flujo principal

1. El docente selecciona a un participante activo.
2. El docente revisa su trabajo.
3. El docente le comunica oralmente la corrección o recomendación.
4. Si hace falta conservar una indicación, el docente redacta una observación opcional.
5. El servidor valida rol, sesión, destinatario y contenido.
6. El servidor guarda la observación en la estructura temporal de la sesión y la entrega exclusivamente al estudiante correspondiente.
7. El estudiante puede consultarla mientras la sesión está activa.
8. Si se aprueba la exportación, el estudiante puede copiar o descargar sus propias notas antes del cierre.
9. El docente finaliza la sesión; el servidor invalida el código y elimina las observaciones y demás datos temporales.

## 4. Reglas de negocio

1. La observación escrita no es requisito para dar retroalimentación oral ni para continuar el flujo.
2. Solo el docente autenticado de la sesión activa puede crear observaciones.
3. El destinatario debe ser un participante activo de esa sesión.
4. El texto no puede estar vacío y tiene un límite de 1,000 caracteres en esta propuesta.
5. Cada nota se asocia a un identificador temporal del estudiante, no únicamente al alias visible.
6. El alias no debe usarse como única clave de autorización porque podría repetirse.
7. El estudiante solo puede consultar notas cuyo destinatario coincide con su identidad temporal autenticada.
8. La autorización se valida en el servidor; la interfaz no es una frontera de seguridad.
9. La visibilidad por defecto es individual.
10. Una nota individual no se difunde al grupo ni se proyecta automáticamente.
11. Las notas se mantienen en memoria; no se escribe su contenido en logs.
12. Al cerrar la sesión, el servidor elimina todas las notas temporales.
13. La exportación local, si se aprueba, no debe crear un historial administrado por el servidor.
14. No se promete recuperación tras el cierre, reinicio del servidor o pérdida de los datos en memoria.

## 5. Modelo temporal propuesto

Cada observación contiene:

| Campo | Tipo lógico | Propósito |
|---|---|---|
| `id` | UUID | Identificador temporal de la observación |
| `studentId` | UUID | Identidad temporal del destinatario |
| `studentAlias` | Texto | Alias mostrado durante la sesión |
| `text` | Texto, máximo 1,000 caracteres | Contenido de la nota |
| `createdAt` | Fecha/hora ISO 8601 | Momento de creación |
| `visibility` | Enumeración | `individual` en este incremento |

La estructura se almacena en memoria dentro del estado de la sesión. No se incorpora una base de datos.

## 6. Exportación propuesta

La exportación debe considerarse un comportamiento adicional sujeto a aprobación. Si se aprueba:

- La interfaz mostrará únicamente notas propias.
- La copia o descarga requerirá una acción explícita del estudiante.
- El archivo se generará en el cliente; el servidor no mantendrá una copia.
- El nombre de archivo no incluirá datos personales innecesarios.
- El contenido incluirá solo las notas propias, sin listas de participantes ni observaciones ajenas.
- La interfaz advertirá que la copia exportada queda fuera del control del sistema.
- El estudiante debe exportar antes del cierre; el sistema no mantendrá una copia de respaldo.

### Límite de la garantía

La no persistencia del servidor no implica que el contenido no pueda permanecer en el portapapeles, en la carpeta de descargas, en copias de seguridad del equipo o en otro software del estudiante. El sistema no puede garantizar la eliminación de esas copias.

## 7. Manejo del cierre y de errores

- Si el docente cierra la sesión antes de la exportación, el servidor elimina el estado y no ofrece recuperación.
- La exportación no debe bloquear ni impedir el cierre de la sesión.
- Si la conexión se interrumpe, no se garantiza que las notas estén disponibles tras reconectar; la implementación debe seguir la política general de recuperación temporal definida para la sesión.
- Las operaciones deben validar que la sesión sigue activa.
- Las peticiones posteriores al cierre se rechazan.

## 8. Cambios de interfaz propuestos

### Panel del docente
- La selección de participantes y la revisión de pantalla son acciones principales.
- La sección “Observación escrita (opcional)” queda secundaria y no bloquea la navegación.
- La acción “Enviar observación” se habilita solo con texto válido.
- No se obliga a escribir al cambiar de estudiante.

### Panel del estudiante
- Mostrar la lista de observaciones propias durante la sesión.
- Si se aprueba exportación, ofrecer “Copiar” y “Descargar mis observaciones”.
- Mostrar un aviso discreto de que las notas temporales se eliminan al finalizar la sesión.
- No mostrar ni permitir solicitar observaciones de otros estudiantes.

## 9. Seguridad y privacidad

- Validar en servidor el rol docente, el token de sesión y la pertenencia del destinatario.
- Derivar la identidad del estudiante desde el contexto autenticado, no confiar en identificadores arbitrarios enviados por el cliente.
- No exponer un evento general que difunda observaciones individuales a todos los sockets.
- No registrar contenido de notas en logs.
- No incluir observaciones en URLs, métricas o mensajes de error.
- Vaciar las estructuras temporales al cerrar sesión.

## 10. Condición de aprobación

Antes de implementar la copia/descarga, el responsable del SRS debe confirmar si RNF-002 permite exportaciones iniciadas por el estudiante. Si no se aprueba, OBS-04 y OBS-05 se mantienen en backlog y no forman parte del incremento. El flujo oral y las notas opcionales pueden evaluarse independientemente.
