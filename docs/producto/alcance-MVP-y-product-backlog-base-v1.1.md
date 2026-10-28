# Documento de alcance del MVP
## Sistema local de retroalimentación para laboratorios de cómputo

> **Estado documental (base 0.3.0; alcance actualizado 28-10-2026):** este documento conserva el alcance y backlog base y agrega el módulo de archivos como ampliación funcional del MVP, aún sin implementación ni validación técnica. Para la decisión de plataforma consulta `../arquitectura/decisiones/ADR-001-arquitectura-local.md`; para el flujo de presentación consulta `backlog-proyeccion.md`, `../arquitectura/decisiones/ADR-003-cola-presentacion.md` y `../diseno/proyeccion-pantalla-y-cola.md`. La cola está implementada en el código de referencia, pero el cambio A→B tiene un defecto reportado y no se considera validado. No confundir la revisión de pantalla del estudiante con la proyección grupal de observaciones descrita por separado en el SRS. El SRS original permanece como fuente de requisitos.


**Versión:** 1.1 (revisión del alcance del MVP)  
**Fecha de actualización:** 28 de octubre de 2026  
**Estado:** Alcance ampliado para preparación de arquitectura; módulo de archivos pendiente de implementación y pruebas  
**Base de código de referencia:** v0.3.0  
**Documento de referencia:** Especificación de requisitos de software (SRS) del Sistema local de retroalimentación para laboratorios de cómputo.

---

## 1. Propósito

Este documento define el alcance de la versión mínima viable (*Minimum Viable Product*, MVP) del Sistema local de retroalimentación para laboratorios de cómputo.

Su finalidad es delimitar las funcionalidades que deben implementarse para validar la propuesta de valor del sistema, establecer qué capacidades se posponen para versiones posteriores y proporcionar criterios verificables que orienten la construcción y evaluación del primer incremento funcional.

El documento complementa el SRS existente. No reemplaza sus requisitos, modelos, reglas de negocio ni casos de prueba. La **ampliación de archivos** procede del documento adicional *InterLAB — Requisitos consolidados del módulo de gestión de archivos*, versión 0.1 (28-10-2026); no se atribuye a un RF del SRS original y deberá incorporarse mediante control de cambios si se decide formalizarla en ese documento. El alcance describe **qué debe hacer** el módulo, no presupone **cómo implementarlo**.

## 2. Contexto y problema que se busca resolver

Durante las actividades prácticas en los laboratorios de cómputo, el docente necesita revisar el trabajo realizado por los estudiantes y proporcionarles retroalimentación.

Actualmente, esta actividad puede requerir que el docente se desplace físicamente hasta cada computadora y que las observaciones se comuniquen principalmente de forma verbal. Esto puede dificultar el seguimiento de varios estudiantes y limitar el aprovechamiento de las observaciones durante la sesión.

El sistema busca facilitar la retroalimentación mediante un mecanismo de comunicación local que permita al docente identificar participantes, observar su trabajo y proporcionar observaciones individuales sin depender del desplazamiento físico.

La solución debe operar mediante la red de área local (LAN), sin depender de una conexión a Internet, y utilizar información temporal que no se conserve como información activa una vez finalizada la sesión.

## 3. Objetivo del MVP

Implementar y validar un flujo funcional mediante el cual:

1. El docente inicia una sesión temporal.
2. Los estudiantes se incorporan utilizando la dirección local del servicio y un código temporal.
3. Cada estudiante participa mediante un alias temporal.
4. El docente consulta la lista de participantes y selecciona a un estudiante.
5. El estudiante autoriza el acceso a la captura de pantalla al incorporarse a la sesión.
6. La transmisión de la captura se utiliza cuando el docente selecciona al estudiante.
7. El docente registra una observación individual.
8. El estudiante correspondiente consulta la observación.
9. El docente finaliza la sesión y el sistema elimina el estado temporal asociado.

Como **ampliación del MVP**, durante la sesión el docente y los estudiantes podrán cargar, consultar y descargar archivos temporales según su rol. Su incorporación no reemplaza las nueve acciones del flujo original; requiere un incremento propio y pruebas de coexistencia con la proyección.

La validación de este flujo permitirá determinar si el sistema facilita la revisión del trabajo y la entrega de retroalimentación individual en un entorno real de laboratorio.

## 4. Usuarios y actores involucrados

### 4.1 Docente

Es el responsable de iniciar y finalizar la sesión, consultar los participantes, seleccionar al estudiante cuyo trabajo desea observar y registrar observaciones individuales. En la ampliación, comparte archivos y puede eliminar cualquier archivo de la sesión.

### 4.2 Estudiante

Se incorpora a la sesión con un alias temporal, autoriza la captura de pantalla de acuerdo con el flujo establecido y consulta las observaciones que le corresponden. En la ampliación, comparte archivos, consulta los archivos disponibles y elimina solo los propios.

### 4.3 Sistema de control de sesión

Administra el estado temporal de la sesión, los participantes, las observaciones, las conexiones y la aplicación de las restricciones de acceso. En la ampliación, también administra metadatos y archivos temporales y valida cuotas y permisos de transferencia.

### 4.4 Entorno de operación

Comprende la computadora que ejecuta el servicio local, las computadoras de los participantes y la red LAN del laboratorio. El proyector se considera parte del entorno, pero su integración funcional queda fuera del MVP inicial.

## 5. Alcance funcional incluido

### 5.1 Gestión de sesiones

El sistema deberá permitir al docente:

- Crear una sesión de laboratorio.
- Obtener los datos necesarios para que los estudiantes se incorporen.
- Mantener una sesión activa durante la actividad.
- Finalizar la sesión de forma explícita.

Al finalizar la sesión, el código correspondiente dejará de ser válido y el estado temporal de la sesión deberá eliminarse.

**Trazabilidad:** RF-001, RF-012.

### 5.2 Incorporación e identificación temporal

El sistema deberá permitir a los estudiantes:

- Acceder al servicio mediante una dirección de la red local.
- Incorporarse mediante un código temporal válido.
- Proporcionar un alias temporal para identificarse durante la sesión.

El sistema deberá asociar cada participante con la sesión activa y evitar que la identificación temporal se convierta en un registro permanente de identidad.

**Trazabilidad:** RF-002, RF-003.

### 5.3 Consulta y selección de participantes

El docente deberá disponer de una lista de participantes incorporados a la sesión y poder seleccionar a uno para revisar su trabajo.

El sistema deberá mantener una asociación inequívoca entre el participante seleccionado y la captura de pantalla que se presenta al docente.

**Trazabilidad:** RF-004, RF-005.

### 5.4 Captura y visualización del trabajo

El MVP deberá permitir observar el trabajo del estudiante seleccionado mediante una captura de pantalla autorizada.

El comportamiento previsto es el siguiente:

- Al incorporarse a la sesión, el estudiante autoriza una vez la captura de pantalla.
- El sistema mantiene el mecanismo de captura preparado conforme a las posibilidades del navegador y a la autorización otorgada.
- La transmisión de la captura por la red se utiliza cuando el docente selecciona al estudiante.
- El docente puede identificar de qué participante procede la imagen.
- Al dejar de ser necesario el acceso a la captura, el sistema deberá detener la transmisión y liberar los recursos correspondientes cuando sea técnicamente posible.

La implementación deberá respetar los mecanismos de seguridad y permisos del navegador. Las limitaciones técnicas de estos mecanismos deberán validarse durante el diseño y las pruebas, sin asumir que una autorización del navegador puede mantenerse indefinidamente o reutilizarse sin restricciones.

**Trazabilidad:** RF-006 y decisión de diseño del MVP.

### 5.5 Registro y consulta de observaciones individuales

El docente deberá poder escribir una observación asociada al estudiante seleccionado.

El estudiante deberá poder consultar la observación que le corresponde, sin tener acceso a las observaciones individuales de otros participantes.

Las observaciones se conservarán únicamente durante el periodo de actividad definido para la sesión.

**Trazabilidad:** RF-007, RF-008 y reglas de negocio sobre acceso a observaciones.

### 5.6 Control de acceso y roles

El sistema deberá distinguir entre las capacidades del docente y las del estudiante.

Como mínimo:

- Solo el docente podrá crear y finalizar sesiones.
- Solo el docente podrá seleccionar participantes para revisar su trabajo.
- Solo el docente podrá registrar observaciones.
- Cada estudiante podrá consultar sus propias observaciones individuales.
- El sistema deberá validar las operaciones sensibles en el servicio local y no depender exclusivamente de ocultar controles en la interfaz.

**Trazabilidad:** RNF-006 y reglas de negocio del SRS.

### 5.7 Operación local y eliminación de datos temporales

El sistema deberá operar mediante la LAN del laboratorio sin depender de Internet para sus funciones esenciales.

El estado de la sesión, los participantes y las observaciones se administrarán en memoria, sin implementar una base de datos persistente para conservar esos datos.

Al finalizar la sesión, se deberá eliminar el estado temporal y evitar que permanezca disponible como información activa. También se deberá comprobar el comportamiento del sistema al reiniciarse.

**Trazabilidad:** RNF-001, RNF-002, RNF-007 y RNF-008.

### 5.8 Presentación de pantalla con cola (incremento 0.3.0)

La base de código 0.3.0 incorpora una cola temporal de solicitudes de pantalla. El estudiante autoriza la captura mediante una acción explícita en el navegador; mientras espera no transmite vídeo. El docente concede el turno desde la cola o elige directamente a un participante, con prioridad sobre la cola. Solo un estudiante seleccionado puede negociar la transmisión WebRTC.

Este flujo está descrito en `backlog-proyeccion.md` y en `../diseno/proyeccion-pantalla-y-cola.md`. La transmisión entre equipos no se considera validada: existe un defecto reportado al cambiar de A a B. La implementación también solicita el permiso de captura al pulsar el botón de turno, no automáticamente al incorporarse; esta diferencia debe revisarse frente a la decisión de producto y las limitaciones del navegador.

### 5.9 Gestión temporal de archivos compartidos (ampliación del MVP)

**Estado:** requisitos funcionales definidos para este incremento; sin implementación ni pruebas verificadas en la base v0.3.0.  
**Fuente adicional:** *InterLAB — Requisitos consolidados del módulo de gestión de archivos*, v0.1, 28 de octubre de 2026.  
**Objetivo:** compartir archivos mientras exista una sesión activa, exclusivamente dentro de la LAN, y retirarlos del servidor al finalizar la sesión.

#### 5.9.1 Espacios y permisos por rol

| Rol | Pestaña | Información y acciones |
|---|---|---|
| Docente | **Mis archivos** | Archivos cargados por el docente: icono, nombre, fecha/hora y eliminar. |
| Docente | **Archivos de los alumnos** | Todos los archivos cargados por estudiantes: icono, nombre, alias del estudiante, fecha/hora y eliminar. |
| Estudiante | **Archivos del profesor** | Archivos del docente: icono, nombre, fecha/hora, ver/descargar. |
| Estudiante | **Archivos de los alumnos** | Todos los archivos de estudiantes, incluidos los propios: icono, nombre, alias, fecha/hora, ver/descargar. |
| Estudiante | **Mis archivos** | Solo archivos propios: icono, nombre, fecha/hora y eliminar. |

- El docente puede eliminar **cualquier archivo** de la sesión; cada estudiante puede eliminar **solo los propios**. La validación se realiza en el servidor y no se limita a ocultar botones.
- Los archivos de estudiantes muestran su **alias temporal**, pero la autorización de propiedad no debe depender exclusivamente de que el texto del alias sea único o fiable.
- Se permiten nombres repetidos y tipos de archivo generales, incluidos ZIP; no se editan nombres ni contenidos.
- No se incluye columna de tamaño ni acción de edición de nombre.

#### 5.9.2 Cargas múltiples y límites

| Restricción | Valor acordado |
|---|---:|
| Máximo por archivo | **50 MB** |
| Máximo por operación de carga | **200 MB** |
| Almacenamiento temporal compartido de la sesión | **10 GB** |
| Transferencias simultáneas por participante | **2** |

- Cada usuario tiene una cola temporal e independiente. Puede seleccionar varios archivos; cada uno muestra su progreso y estado, y un fallo no cancela otras cargas que puedan continuar.
- Al terminar, una carga muestra **«Completado»** durante unos segundos y sale de la cola visual; el archivo permanece compartido.
- Una carga fallida permanece en la cola hasta que el usuario elija **«Reintentar»** o **«Eliminar de la cola»**. El reintento es manual y comienza desde el principio; no existe reanudación ni reintento automático.
- No se permite cancelar una carga que ya está en curso mediante la interfaz. El cierre de sesión, las desconexiones y los errores sí pueden interrumpir transferencias.
- Si el almacenamiento es insuficiente, el sistema rechaza la operación sin eliminar archivos automáticamente. El docente recibe una advertencia inmediata y un indicador persistente mientras exista la condición de insuficiencia; no hay cifras de ocupación, barras ni avisos repetitivos por cada intento.
- El indicador cambia o desaparece cuando vuelve a haber espacio suficiente para la operación correspondiente.
- Una carga solo publica el archivo cuando termina correctamente; no deben quedar archivos parciales disponibles.
- Conseguir una carga en aproximadamente un segundo es una **preferencia**, nunca una garantía de rendimiento para todos los tamaños y condiciones de red.

#### 5.9.3 Consulta, búsqueda, orden y sincronización

- El orden inicial de las listas es **más recientes primero**.
- Solo la pestaña **«Archivos de los alumnos»** permite buscar y ordenar: por nombre, alias o fecha/hora.
- Primer clic en nombre o alias: **Z→A**; segundo clic: **A→Z**. En fecha/hora se alterna **más recientes / más antiguos**.
- La búsqueda funciona al escribir, por **prefijo del nombre**, sin distinguir mayúsculas/minúsculas y sin exigir la extensión.
- Si no hay resultados, se mantiene visible la tabla con el mensaje **«No existen coincidencias»**. No hay botón específico para borrar la búsqueda.
- Las altas y eliminaciones se reflejan **sin recargar la página**; los filtros y el orden que el usuario haya elegido no se pierden. El mecanismo de sincronización se resolverá durante arquitectura.

#### 5.9.4 Descargas, eliminación y desconexiones

- Se permite descargar un archivo o seleccionar varios para descargar como **un archivo ZIP**. El navegador gestiona la descarga; InterLAB no añade cola ni indicador específico del progreso de ZIP.
- No se fija límite de tamaño al ZIP adicional a los recursos disponibles; la estrategia de creación y entrega queda pendiente de arquitectura.
- Se permiten descargas simultáneas del mismo archivo respetando los recursos y la prioridad de la proyección.
- Si se elimina un archivo, deja de estar disponible para **nuevas** descargas; una descarga ya iniciada **puede terminar**. Los archivos ya descargados en los equipos no se eliminan.
- Si una transferencia se interrumpe por desconexión, el usuario debe reiniciarla manualmente desde cero si el archivo de origen aún está disponible. No se propone reconexión especial si la LAN deja de ser accesible.

#### 5.9.5 Prioridad de la proyección y cierre de sesión

- La **proyección de pantalla tiene prioridad** frente a cargas y descargas: cuando comienza una proyección, las transferencias en curso continúan pero con velocidad reducida de manera inmediata. No se pausan, cancelan ni se impone un porcentaje fijo previo a las pruebas.
- Solo el docente autorizado puede cerrar la sesión y debe **confirmar explícitamente** la acción.
- Al confirmarse el cierre, se interrumpen inmediatamente las cargas y descargas activas y se **eliminan todos los archivos temporales del servidor** asociados a la sesión. Ninguna carga que termine tardíamente puede volver a publicar archivos.
- Se mantienen las copias ya descargadas por los usuarios. El comportamiento de limpieza de residuos tras un reinicio inesperado debe definirse y probarse en arquitectura.

#### 5.9.6 Límites de este incremento

No se incluyen edición de nombre, historial permanente, restablecimiento o reanudación automática de transferencias, borrado automático para recuperar espacio, estadísticas de capacidad, progreso interno del ZIP ni un sistema especial de reconexión LAN. La incorporación del módulo no implica corregir automáticamente el defecto previamente reportado en el cambio de presentador A→B.

## 6. Funcionalidades excluidas del MVP

Las siguientes capacidades permanecen en el alcance general del producto definido en el SRS, pero no se consideran necesarias para validar el primer flujo funcional.

| Funcionalidad | Motivo de exclusión inicial | Requisitos relacionados |
|---|---|---|
| Compartir observaciones con todo el grupo | El MVP valida primero la retroalimentación individual. | RF-009, RF-010 |
| Solicitar la proyección de observaciones | Depende del flujo de compartición grupal y de la integración con el proyector. | RF-011 |
| Historial permanente de sesiones y observaciones | Contradice el enfoque de información temporal establecido para el producto. | Restricción de no persistencia |
| Acceso remoto mediante Internet | El sistema se orienta a la operación dentro de la LAN. | RNF-001 |
| Administración de calificaciones o expedientes académicos | No forma parte del problema que se pretende resolver. | Fuera del alcance general del SRS |
| Integración con plataformas académicas externas | No es necesaria para validar el flujo principal. | Fuera del alcance inicial |

La exclusión de una funcionalidad del MVP no implica su eliminación del SRS. Su incorporación futura deberá planificarse como parte de un incremento posterior y mantener la trazabilidad con los requisitos originales.

## 7. Requisitos no funcionales y restricciones

El MVP deberá respetar las siguientes condiciones.

### 7.1 Operación sin Internet

Las funciones incluidas deberán operar en la LAN aunque la conexión a Internet esté ausente.

**Referencia:** RNF-001.

### 7.2 No persistencia

El sistema no deberá mantener como información activa los datos de la sesión una vez finalizada. En el módulo ampliado, **también deberán eliminarse los archivos temporales del servidor**. La implementación y las pruebas deberán considerar el cierre normal y el reinicio inesperado del servicio; el almacenamiento de archivos en disco durante la sesión no se confunde con un historial permanente.

**Referencia:** RNF-002.

### 7.3 Rendimiento y capacidad

El SRS establece una carga de referencia de hasta 30 participantes simultáneos. El diseño deberá considerar esta carga desde el inicio. En el alcance ampliado, se deberán verificar las cuotas de archivos, la concurrencia de transferencias y la **prioridad de la proyección** frente a tráfico de archivos.

La meta de que el 95 % de las observaciones compartidas sean visibles en un máximo de dos segundos corresponde a la funcionalidad de compartición definida en el SRS. Como la compartición grupal se pospone en este MVP, su validación integral queda pendiente para el incremento que incorpore esa capacidad.

**Referencia:** RNF-003 y carga prevista en el SRS.

### 7.4 Interrupciones temporales

El sistema deberá contemplar las desconexiones temporales de los participantes y definir un comportamiento observable para la recuperación de la conexión.

**Referencia:** RNF-004.

### 7.5 Usabilidad

Las interfaces deberán facilitar que el docente identifique participantes, seleccione al estudiante correcto y registre observaciones sin pasos innecesarios.

La evaluación deberá comprobarse mediante pruebas con usuarios o participantes representativos del contexto de laboratorio.

**Referencia:** RNF-005.

### 7.6 Autorización y permisos

Las operaciones deberán respetar los roles definidos y evitar el acceso no autorizado a las observaciones o a la información de otros participantes.

**Referencia:** RNF-006.

### 7.7 Compatibilidad y comunicación local

La solución deberá funcionar en las computadoras y navegadores seleccionados para el laboratorio y comunicarse mediante la red local.

La compatibilidad concreta deberá verificarse con los equipos disponibles antes de considerar terminado el MVP.

**Referencia:** RNF-007, RNF-008.

## 8. Criterios de aceptación del MVP

El MVP se considerará apto para una primera validación cuando se cumplan los siguientes criterios:

1. El docente puede iniciar una sesión y obtener los datos de incorporación.
2. Un estudiante puede incorporarse con un código válido y un alias temporal.
3. El docente puede identificar y seleccionar al participante incorporado.
4. El estudiante puede otorgar la autorización requerida para la captura de pantalla.
5. La captura presentada corresponde al estudiante seleccionado y su transmisión se utiliza conforme al flujo establecido.
6. El docente puede registrar una observación individual.
7. El estudiante puede consultar su observación y no puede consultar las observaciones individuales ajenas.
8. Las operaciones restringidas están protegidas por el servicio local y los roles definidos.
9. El flujo principal funciona sin conexión a Internet cuando las computadoras permanecen conectadas a la LAN.
10. Al finalizar la sesión, el código deja de ser válido y los datos temporales dejan de estar disponibles.
11. El comportamiento ante una desconexión temporal se ha probado y documentado.
12. Se ha realizado una prueba de carga representativa de la cantidad de participantes prevista, registrando los resultados y las limitaciones encontradas.

**Criterios adicionales para el módulo de archivos (incremento ampliado, pendientes de ejecución):**

13. Cada rol ve las pestañas correspondientes y el servidor protege el acceso y las eliminaciones, incluidos intentos de manipular solicitudes.
14. Se respetan 50 MB por archivo, 200 MB por operación, 10 GB por sesión y dos transferencias simultáneas por participante.
15. Se cargan varios archivos con estado independiente y los incompletos no se muestran como disponibles.
16. La cola visual, el estado «Completado» y los reintentos manuales funcionan sin reanudación automática.
17. Una falta de espacio rechaza la operación, sin borrado automático, y produce una advertencia persistente única al docente.
18. Las listas se actualizan sin recarga y conservan búsquedas y órdenes; las reglas de prefijo, alternancia y «No existen coincidencias» se verifican.
19. Funcionan descargas individuales y múltiples en ZIP; el navegador conserva el control del progreso de descarga.
20. La eliminación de archivos impide nuevas descargas sin obligar a cortar las ya iniciadas.
21. El cierre confirmado por el docente interrumpe todas las transferencias y elimina los archivos temporales; no pueden reaparecer cargas tardías.
22. Ante desconexión, el reintento de transferencia comienza manualmente desde cero.
23. La proyección reduce de forma observable el consumo de recursos de las transferencias sin detenerlas ni degradar indebidamente la visualización.
24. Las pruebas consideran archivos parciales, nombres duplicados, distintos formatos, acceso no autorizado y concurrencia.

Los criterios anteriores deberán vincularse con casos de prueba concretos antes de cerrar la validación. Una prueba diseñada no se considerará aprobada hasta que se ejecute y se registren sus resultados.

## 9. Primer incremento funcional

Se propone construir el MVP en incrementos pequeños, cada uno ejecutable y verificable.

### Incremento 1: sesión y participantes

- Inicio y cierre de sesión.
- Código temporal.
- Incorporación de estudiantes con alias.
- Lista de participantes.

**Resultado esperado:** el docente puede crear una sesión y reconocer a los estudiantes conectados.

### Incremento 2: observación de pantalla

- Selección de un participante.
- Autorización de captura.
- Transmisión de pantalla bajo demanda del docente.
- Identificación de la captura recibida.

**Resultado esperado:** el docente puede observar el trabajo del estudiante seleccionado.

### Incremento 3: retroalimentación individual

- Registro de observaciones.
- Consulta de observaciones por el estudiante correspondiente.
- Validación de permisos.

**Resultado esperado:** se completa el ciclo de retroalimentación individual.

### Incremento 4: cierre y validación técnica

- Eliminación del estado temporal.
- Pruebas sin Internet.
- Pruebas de roles, desconexión y recuperación.
- Pruebas de carga y compatibilidad.

**Resultado esperado:** existe una versión funcional evaluable frente al alcance y las restricciones establecidos.

### Incremento 5 (ampliación): archivos compartidos temporales

- Pestañas y permisos diferenciados por rol.
- Carga múltiple, colas temporales y límites de tamaño, capacidad y concurrencia.
- Descargas individuales y ZIP, búsqueda/orden de archivos de alumnos y actualizaciones sin recarga.
- Eliminación y cierre con limpieza de archivos temporales.
- Integración y pruebas de prioridad de proyección durante transferencias.

**Resultado esperado:** docente y estudiantes intercambian archivos durante la sesión sin persistencia posterior y sin comprometer el mecanismo existente de proyección. **Estado:** alcance definido; diseño arquitectónico, implementación y validación pendientes.

La compartición grupal de observaciones y su proyección mediante proyector continúan planificadas para una etapa posterior; son distintas de la presentación de pantalla del estudiante que ya existe en la base v0.3.0.

## 10. Indicadores para evaluar el MVP

La evaluación inicial deberá centrarse en evidencias observables:

- **Finalización del flujo:** proporción de pruebas en las que se completa el recorrido desde la incorporación hasta la consulta de la observación.
- **Correspondencia de participantes:** número de pruebas en las que la captura y la observación corresponden al estudiante seleccionado.
- **Control de acceso:** resultados de las pruebas que verifican que los estudiantes no acceden a observaciones individuales ajenas.
- **Operación local:** resultado de las pruebas realizadas sin conexión a Internet.
- **No persistencia:** resultado de las comprobaciones posteriores al cierre y reinicio.
- **Rendimiento y estabilidad:** tiempos observados, errores, desconexiones y resultados de las pruebas con varios participantes.
- **Utilidad percibida:** comentarios del docente y los estudiantes sobre la facilidad para revisar el trabajo y recibir retroalimentación.
- **Archivos temporales (ampliación):** éxito y errores de transferencias, validación de cuotas y permisos, limpieza efectiva al finalizar y coexistencia con la proyección.

Los resultados deberán documentarse con las condiciones de prueba utilizadas. No se afirmará que el MVP cumple un indicador hasta disponer de evidencia.

## 11. Supuestos y decisiones pendientes

Para iniciar el desarrollo se consideran los siguientes supuestos:

- Las computadoras participantes pueden comunicarse mediante la LAN.
- El equipo docente puede ejecutar el servicio local y aceptar conexiones de los participantes.
- Las computadoras de los estudiantes disponen de un navegador compatible con los mecanismos de captura seleccionados.
- La red y las políticas de seguridad del laboratorio permiten el tráfico necesario para la comunicación y la transmisión de pantalla.
- La información de sesión se administrará en memoria.

Antes de implementar el flujo de captura deberán resolverse y documentarse, como mínimo, las siguientes decisiones:

1. Tecnología del cliente y del servicio local.
2. Protocolo para las operaciones ordinarias y las actualizaciones en tiempo real.
3. Mecanismo de transmisión de pantalla.
4. Tratamiento de la autorización, cancelación y finalización de la captura.
5. Estrategia de recuperación ante desconexiones.
6. Medidas para proteger el código temporal y validar las operaciones por rol.
7. Forma de liberar las capturas y el estado temporal al finalizar la sesión.
8. Navegadores y equipos que se utilizarán en las pruebas de compatibilidad.

**Decisiones adicionales pendientes, exclusivas del módulo de archivos:**

9. Ubicación, estrategia y seguridad del almacenamiento temporal, incluidos residuos tras fallos/reinicio.
10. Interpretación exacta de MB/GB y reserva de cuota para cargas simultáneas, así como contabilidad del límite por operación.
11. Tratamiento de archivos parciales y publicación atómica al finalizar la carga.
12. Generación y entrega de ZIP y tratamiento de archivos eliminados durante la descarga.
13. Sincronización en tiempo real de listas y estado de capacidad.
14. Control de red, CPU y disco para reducir la velocidad de transferencia sin afectar la proyección.
15. Protección ante nombres y tipos de archivo inseguros y ante operaciones no autorizadas.
16. Impedir escrituras/publicaciones tardías después del cierre de la sesión; decidir cómo contabilizar temporales de ZIP en las cuotas.

Ninguna de estas opciones arquitectónicas queda aprobada por su mera inclusión como pendiente.

Estas decisiones deberán registrarse en el documento de arquitectura. El presente documento no presupone que una tecnología concreta sea obligatoria.

## 12. Relación con el SRS

La siguiente matriz resume la relación entre el alcance del MVP y los requisitos existentes.

| Requisito | Tratamiento en el MVP |
|---|---|
| RF-001 | Incluido: iniciar sesión |
| RF-002 | Incluido: identificación temporal |
| RF-003 | Incluido: incorporación a sesión |
| RF-004 | Incluido: consulta de participantes |
| RF-005 | Incluido: selección de estudiante |
| RF-006 | Incluido: visualización del trabajo |
| RF-007 | Incluido: registro de observación individual |
| RF-008 | Incluido: consulta de observación individual |
| RF-009 | Pospuesto: compartir observación |
| RF-010 | Pospuesto: visualización de observación compartida |
| RF-011 | Pospuesto: solicitud de proyección |
| RF-012 | Incluido: finalizar sesión |
| RNF-001 | Obligatorio: operación sin Internet |
| RNF-002 | Obligatorio: no persistencia |
| RNF-003 | Parcial en esta etapa: carga de referencia; rendimiento de compartición grupal por validar al incorporar esa función |
| RNF-004 | Obligatorio: comportamiento ante desconexión temporal |
| RNF-005 | Obligatorio: usabilidad |
| RNF-006 | Obligatorio: permisos y roles |
| RNF-007 | Obligatorio: compatibilidad con los equipos previstos |
| RNF-008 | Obligatorio: comunicación local |

La ampliación de archivos **no corresponde a una fila RF nueva del SRS original**: su fuente es el documento adicional *InterLAB — Requisitos consolidados del módulo de gestión de archivos* v0.1, y su trazabilidad se registra en las historias HU-14 a HU-19 de este backlog.

La clasificación anterior delimita la implementación del MVP, pero no modifica el estado normativo del SRS. Los requisitos pospuestos deberán seguir registrados para su planificación posterior.

## 13. Definición de terminado

El MVP se considerará terminado para su primera evaluación cuando:

- Las funcionalidades incluidas estén implementadas e integradas.
- Los criterios de aceptación tengan pruebas asociadas.
- Las pruebas se hayan ejecutado y sus resultados estén documentados.
- Los defectos conocidos y las limitaciones estén registrados.
- Se haya comprobado el funcionamiento esencial en la LAN sin Internet.
- Se haya verificado la aplicación de permisos y el aislamiento de las observaciones individuales.
- Se haya comprobado la eliminación del estado temporal.
- Para considerar **terminado el MVP ampliado**, se haya comprobado también la eliminación de archivos temporales, permisos, límites, descarga ZIP y prioridad de la proyección; mientras esas pruebas falten, el incremento de archivos permanece **no validado**.
- Exista documentación suficiente para instalar, iniciar, utilizar y finalizar una sesión de prueba.
- Las funcionalidades pospuestas permanezcan identificadas en el Product Backlog.

La finalización del desarrollo no equivale automáticamente a demostrar la utilidad del producto. La validación con un docente y estudiantes en un contexto representativo permitirá determinar si la solución responde al problema planteado y qué cambios deben priorizarse en el siguiente incremento.

## 14. Resultado esperado

Al concluir el MVP se espera disponer de una aplicación funcional que permita realizar una sesión local de retroalimentación individual, desde la incorporación del estudiante hasta la entrega de una observación, respetando las restricciones de operación local, control de acceso y no persistencia.

Este resultado constituirá la base para evaluar la solución con usuarios reales. La ampliación añade un segundo resultado esperado: intercambio **temporal de archivos** con separación de roles y respeto a la proyección. Su implementación y pruebas no deben darse por concluidas solo por actualizar este documento. La compartición grupal de observaciones y su proyección con el proyector quedan para decisiones posteriores.

---

**Documento relacionado:** SRS — Sistema local de retroalimentación para laboratorios de cómputo.

**Continuación:** a continuación se conserva el Product Backlog base y se añaden las historias necesarias para la ampliación de archivos.

# Product Backlog — base y ampliación del MVP

## Sistema local de retroalimentación para laboratorios de cómputo

Este backlog se construye a partir del SRS de tu proyecto y del alcance del MVP que definimos. Su propósito es convertir los requisitos en unidades de trabajo implementables, ordenadas por prioridad y con criterios que permitan comprobar cuándo cada funcionalidad está terminada.

El backlog será un artefacto vivo: no necesitas especificar todo el sistema al mismo nivel de detalle antes de comenzar a desarrollar. Sí necesitas suficiente claridad sobre las primeras historias para construir un flujo funcional de principio a fin.

## 1. Criterios de priorización

- P0 — Imprescindible: necesario para completar y validar el flujo principal del MVP.
    
- P1 — Importante: necesario para mejorar la robustez, seguridad o calidad de la primera versión.
    
- P2 — Posterior: funcionalidad del producto que se pospone para un incremento posterior.
    

Las prioridades representan una propuesta inicial, no modifican los requisitos del SRS.

## 2. Épicas del producto

Las épicas agrupan historias de usuario que contribuyen a una misma capacidad del sistema.

| Épica | Nombre | Objetivo |
|---|---|---|
|EP-01|Gestión de sesiones|Controlar el ciclo de vida de la sesión.|
|EP-02|Incorporación de participantes|Permitir el acceso temporal de estudiantes.|
|EP-03|Revisión del trabajo|Seleccionar estudiantes y visualizar sus pantallas.|
|EP-04|Retroalimentación individual|Registrar y consultar observaciones.|
|EP-05|Control y seguridad|Proteger roles, datos y comunicaciones.|
|EP-06|Operación y calidad|Garantizar operación local, estabilidad y no persistencia.|
|EP-07|Retroalimentación grupal|Compartir observaciones y proyectarlas en futuras versiones.|
|EP-08|Archivos temporales compartidos|Compartir archivos durante la sesión con límites, permisos y prioridad de proyección.|

## 3. Backlog de historias de usuario

Las historias se presentan en el orden recomendado de implementación. Las dependencias indican qué trabajo debe estar disponible antes de completar cada historia.

Las estimaciones de esfuerzo se dejan pendientes porque deben calcularse con el equipo y la tecnología seleccionada.

P0

### HU-01 — Iniciar una sesión

Épica: EP-01 · SRS: RF-001

Historia de usuario

Como docente, quiero iniciar una sesión de laboratorio para habilitar la incorporación temporal de los estudiantes.

Criterios de aceptación

- Dado que el docente está autorizado y no existe una sesión activa, cuando inicia una sesión, entonces el sistema crea una sesión temporal activa.
    
- El sistema proporciona un código temporal y la dirección local necesaria para incorporarse.
    
- Una persona no autorizada no puede iniciar una sesión mediante una petición directa al servicio.
    
- La sesión funciona sin conexión a Internet, siempre que la LAN esté disponible.
    

Dependencias: arquitectura mínima del servicio local.

P0

### HU-02 — Incorporarse con un alias temporal

Épica: EP-02 · SRS: RF-002, RF-003

Historia de usuario

Como estudiante, quiero incorporarme a una sesión con un código válido y un alias temporal para participar sin crear una cuenta permanente.

Criterios de aceptación

- Dado que existe una sesión activa, cuando el estudiante introduce un código válido y un alias, entonces el sistema lo incorpora.
    
- Un código inválido o una sesión finalizada impiden la incorporación.
    
- El alias identifica al estudiante dentro de la sesión y no necesita ser único globalmente.
    
- El sistema registra al participante en el estado temporal de la sesión.
    
- El estudiante recibe confirmación de incorporación o un mensaje comprensible de error.
    

Dependencias: HU-01.

P0

### HU-03 — Consultar participantes

Épica: EP-02 · SRS: RF-004

Historia de usuario

Como docente, quiero consultar los participantes de la sesión para identificar a quién puedo proporcionar retroalimentación.

Criterios de aceptación

- El docente puede consultar los alias de los participantes incorporados.
    
- La lista se actualiza cuando se incorpora un estudiante.
    
- El sistema distingue a los participantes desconectados según el comportamiento definido para la sesión.
    
- Un estudiante no puede acceder a la interfaz de administración del docente.
    

Dependencias: HU-01, HU-02.

P0

### HU-04 — Seleccionar un estudiante

Épica: EP-03 · SRS: RF-005

Historia de usuario

Como docente, quiero seleccionar un participante para indicar de quién deseo revisar el trabajo.

Criterios de aceptación

- El docente puede seleccionar un participante de la lista.
    
- El sistema identifica inequívocamente al participante seleccionado.
    
- La selección de un participante no permite acceder a los datos privados de otro.
    
- Si el participante se desconecta, el sistema informa de la situación y no presenta una captura nueva como si estuviera actualizada.
    

Dependencias: HU-03.

P0

### HU-05 — Autorizar y transmitir una captura de pantalla

Épica: EP-03 · SRS: RF-006 y decisión de diseño del MVP

Historia de usuario

Como estudiante, quiero autorizar la captura de mi pantalla al incorporarme para que el docente pueda revisar mi trabajo cuando me seleccione.

Criterios de aceptación

- Al incorporarse, el estudiante recibe una solicitud clara de autorización para compartir la pantalla.
    
- Sin autorización, el sistema no transmite la captura.
    
- Cuando el docente selecciona al estudiante autorizado, se habilita la transmisión conforme al mecanismo implementado.
    
- El docente puede reconocer a qué participante corresponde la captura recibida.
    
- Cuando el docente deja de revisar al estudiante, la transmisión se detiene o deja de enviarse por la red, según el diseño acordado.
    
- Si el estudiante revoca el permiso o el navegador finaliza la captura, el sistema informa que ya no está disponible.
    
- No se permite eludir los controles de privacidad del navegador.
    

Dependencias: HU-02, HU-04 y decisión técnica sobre captura y transmisión.

Nota técnica: la autorización del navegador no garantiza que una captura pueda mantenerse activa indefinidamente. Esta historia debe validarse con el navegador y el mecanismo de captura elegidos.

P0

### HU-06 — Registrar una observación individual

Épica: EP-04 · SRS: RF-007

Historia de usuario

Como docente, quiero registrar una observación para el estudiante seleccionado para darle retroalimentación concreta sobre su trabajo.

Criterios de aceptación

- El docente puede redactar y enviar una observación asociada al participante seleccionado.
    
- El sistema verifica que el docente esté autorizado y que la sesión continúe activa.
    
- La observación queda asociada al participante correcto.
    
- Una petición no autorizada o una sesión finalizada impiden registrar nuevas observaciones.
    
- La observación se mantiene únicamente en el estado temporal de la sesión.
    

Dependencias: HU-01, HU-02, HU-04.

P0

### HU-07 — Consultar mi retroalimentación

Épica: EP-04 · SRS: RF-008

Historia de usuario

Como estudiante, quiero consultar las observaciones que el docente registró para mí para comprender qué debo corregir o mejorar.

Criterios de aceptación

- El estudiante puede consultar las observaciones asociadas a su participación.
    
- El sistema verifica la asociación entre la conexión del estudiante y el participante correspondiente.
    
- El estudiante no puede consultar observaciones individuales de otros participantes modificando la dirección de una petición o su identificador.
    
- Las observaciones se muestran mientras la sesión y sus datos temporales estén vigentes.
    

Dependencias: HU-02, HU-06.

P0

### HU-08 — Finalizar una sesión y eliminar su estado temporal

Épica: EP-01 / EP-06 · SRS: RF-012, RNF-002

Historia de usuario

Como docente, quiero finalizar la sesión para cerrar la actividad y evitar que sus datos continúen disponibles.

Criterios de aceptación

- Solo el docente autorizado puede finalizar la sesión.
    
- El código de incorporación deja de ser válido.
    
- El sistema elimina el estado temporal de participantes y observaciones.
    
- Las operaciones que requieren una sesión activa dejan de estar disponibles.
    
- El sistema libera los recursos asociados a las capturas y conexiones cuando sea técnicamente posible.
    
- Después de reiniciar el servicio, los datos de la sesión anterior no están disponibles como estado activo.
    

Dependencias: HU-01 a HU-07, con integración progresiva desde el inicio.

P1

### HU-09 — Recuperarse de una desconexión temporal

Épica: EP-06 · SRS: RNF-004

Historia de usuario

Como usuario, quiero recibir información clara cuando pierdo la conexión para conocer el estado de mi participación y poder recuperarme si es posible.

Criterios de aceptación

- El sistema detecta o identifica una conexión interrumpida.
    
- El docente no confunde a un participante desconectado con uno que está transmitiendo correctamente.
    
- Si la conexión se recupera dentro del comportamiento definido, el participante puede continuar o reincorporarse de manera controlada.
    
- No se crean participantes duplicados accidentalmente.
    
- Se documenta y prueba el comportamiento ante una interrupción de hasta 10 segundos, de acuerdo con el SRS.
    

Dependencias: HU-02, HU-03, HU-05.

P1

### HU-10 — Validar el funcionamiento sin Internet

Épica: EP-06 · SRS: RNF-001, RNF-007, RNF-008

Historia de usuario

Como responsable de la sesión, quiero que el sistema funcione dentro de la LAN sin depender de Internet para poder utilizarlo en laboratorios con conectividad limitada.

Criterios de aceptación

- El servicio y los clientes pueden comunicarse dentro de la LAN.
    
- El flujo principal funciona cuando se deshabilita el acceso a Internet, manteniendo operativa la LAN.
    
- La solución no necesita consultar servicios externos para iniciar la sesión, incorporar participantes o registrar observaciones.
    
- Los resultados se registran en una prueba reproducible.
    

Dependencias: HU-01 a HU-08.

P1

### HU-11 — Verificar capacidad, rendimiento y compatibilidad

Épica: EP-06 · SRS: RNF-003, RNF-005, RNF-007

Historia de usuario

Como responsable del producto, quiero medir el comportamiento del sistema con varios participantes y los equipos previstos para comprobar que resulta viable en el laboratorio.

Criterios de aceptación

- Se realizan pruebas con una carga representativa de hasta 30 participantes.
    
- Se registran tiempos de respuesta, errores y problemas de conexión.
    
- Se prueba la interfaz con los navegadores y equipos seleccionados.
    
- Se registran defectos, limitaciones y resultados; no se declara cumplimiento sin evidencia.
    
- La meta del 95 % de observaciones visibles en dos segundos se prueba cuando se implemente la funcionalidad de compartición correspondiente.
    

Dependencias: flujo principal integrado y entorno de pruebas disponible.

P2

### HU-12 — Compartir una observación con el grupo

Épica: EP-07 · SRS: RF-009, RF-010

Historia de usuario

Como docente, quiero compartir explícitamente una observación con el grupo para que otros estudiantes puedan aprovecharla.

Criterios de aceptación

- El docente selecciona expresamente una observación para compartir.
    
- Una observación individual no se comparte automáticamente.
    
- Los estudiantes pueden consultar las observaciones compartidas mientras la sesión está activa.
    
- El sistema diferencia la retroalimentación individual de la compartida.
    
- La compartición respeta la meta de rendimiento establecida en el SRS.
    

Dependencias: HU-06, HU-08 y diseño de la distribución grupal.

P2

### HU-13 — Proyectar observaciones

Épica: EP-07 · SRS: RF-011

Historia de usuario

Como docente, quiero solicitar la proyección de una observación compartida para presentarla al grupo utilizando el proyector del laboratorio.

Criterios de aceptación

- El docente puede solicitar la proyección de una observación compartida.
    
- La proyección muestra la información seleccionada por el docente.
    
- El sistema no proyecta observaciones individuales automáticamente.
    
- El docente puede finalizar la proyección.
    
- La función opera localmente.
    

Dependencias: HU-12 y disponibilidad del proyector.

### HU-14 — Cargar archivos temporales con límites

**Épica:** EP-08 · **Fuente:** requisitos del módulo de archivos v0.1 · **Prioridad de la ampliación:** P0

**Como** participante, **quiero** cargar varios archivos dentro de una sesión **para** compartir material con el grupo sin almacenamiento permanente.

**Criterios de aceptación:** no se exceden 50 MB por archivo, 200 MB por operación ni 10 GB por sesión; máximo dos transferencias simultáneas por usuario; progresos y fallos independientes; archivo disponible solo tras carga completa; reintento manual desde cero; «Completado» temporal en la cola; sin cancelación manual de carga ya iniciada.

**Dependencias:** HU-01, HU-02, HU-08, permisos de sesión y decisiones sobre cuotas/temporales.

### HU-15 — Consultar archivos por rol y actualizar listas

**Épica:** EP-08 · **Fuente:** requisitos del módulo v0.1 · **Prioridad:** P0

**Como** docente o estudiante, **quiero** consultar las pestañas de archivos autorizadas **para** encontrar los documentos de la sesión.

**Criterios:** pestañas y columnas de 5.9.1; nombre duplicado permitido; en «Archivos de los alumnos» buscar por prefijo sin distinción de mayúsculas y alternar orden según 5.9.3; listas actualizadas sin recarga y filtros conservados; sin coincidencias, mostrar texto convenido.

**Dependencias:** HU-14, validación de roles y mecanismo de sincronización.

### HU-16 — Descargar archivos y selección múltiple ZIP

**Épica:** EP-08 · **Fuente:** requisitos del módulo v0.1 · **Prioridad:** P0

**Como** participante autorizado, **quiero** descargar un archivo o varios reunidos en ZIP **para** conservar una copia local del material.

**Criterios:** descarga individual o ZIP; navegador a cargo del progreso; concurrencia de descargas del mismo archivo; si el archivo es eliminado, no admite nuevas descargas pero las iniciadas pueden concluir; desconexión exige descarga nueva desde el inicio.

**Dependencias:** HU-14, HU-15 y definición técnica del ZIP.

### HU-17 — Eliminar archivos según permisos y avisar falta de espacio

**Épica:** EP-08 · **Fuente:** requisitos del módulo v0.1 · **Prioridad:** P0

**Como** usuario, **quiero** gestionar mis archivos según mi rol; **como docente**, quiero conocer si falta almacenamiento.

**Criterios:** docente elimina cualquiera; estudiante solo propios; autorización comprobada en servidor; falta de espacio rechaza cargas sin borrado automático; aviso inmediato e indicador persistente sin repetición ni cifras; el estado se actualiza cuando deja de faltar espacio.

**Dependencias:** HU-14 y controles de roles; cálculo de capacidad consistente.

### HU-18 — Cerrar sesión y borrar archivos de forma segura

**Épica:** EP-08 · **Fuente:** requisitos del módulo v0.1 · **Prioridad:** P0

**Como** docente, **quiero** confirmar el cierre de la sesión **para** interrumpir operaciones y eliminar todos los archivos del servidor.

**Criterios:** confirmación expresa; cargas y descargas se interrumpen; archivos parciales y completos del servidor eliminados; ninguna operación tardía repone archivos; las copias ya descargadas permanecen intactas; limpieza tras fallo/reinicio probada conforme a la solución técnica acordada.

**Dependencias:** HU-08, HU-14 y mecanismo de limpieza/transacciones de sesión.

### HU-19 — Dar prioridad a la proyección mientras se transfieren archivos

**Épica:** EP-08 · **Fuente:** requisitos del módulo v0.1 · **Prioridad:** P0

**Como** docente, **quiero** que la proyección tenga prioridad cuando se comparten archivos **para** que el seguimiento del trabajo no se vea interrumpido.

**Criterios:** cuando se inicia la proyección se reduce inmediatamente el ritmo de transferencias activas sin pausarlas ni cancelarlas; se comprueba el comportamiento con cargas y descargas simultáneas; se documentan métricas y límites reales y se prueba el cambio de presentador sin declarar corregido el defecto A→B por anticipado.

**Dependencias:** flujo de proyección v0.3.0 y decisiones de control de recursos y pruebas de red.

## 4. Trabajo técnico habilitador

Además de las historias visibles para los usuarios, el backlog debe contemplar tareas técnicas que permitan implementarlas de forma segura y mantenible. Estas tareas no sustituyen las historias funcionales.

| ID | Tarea técnica | Prioridad | Resultado esperado |
|---|---|---|---|
|TEC-01|Definir arquitectura y tecnologías|P0|Componentes, protocolos y despliegue documentados.|
|TEC-02|Definir modelo de datos temporal|P0|Estructuras para sesión, participantes y observaciones.|
|TEC-03|Implementar validación de roles en el servidor|P0|Operaciones protegidas por autorización.|
|TEC-04|Definir comunicación en tiempo real|P0|Actualización de participantes y observaciones.|
|TEC-05|Probar viabilidad de captura de pantalla|P0|Prototipo que valida permisos y transmisión bajo demanda.|
|TEC-06|Definir estrategia de limpieza de estado|P0|Eliminación verificable al cerrar o reiniciar.|
|TEC-07|Configurar entorno de pruebas LAN|P1|Pruebas desde varios equipos.|
|TEC-08|Documentar instalación y ejecución|P1|Instrucciones reproducibles para desplegar el MVP.|
|TEC-09|Diseñar cuotas, almacenamiento y limpieza segura de archivos|P0 (ampliación)|Decisiones documentadas y pruebas de concurrencia, fallo y cierre.|
|TEC-10|Diseñar generación de ZIP y actualizaciones de listas|P0 (ampliación)|Arquitectura y controles de recursos definidos.|
|TEC-11|Proteger la proyección frente a transferencias|P0 (ampliación)|Regulación y pruebas de LAN/CPU/disco con casos de aceptación.|
|TEC-12|Validar seguridad de carga/descarga y propiedad|P0 (ampliación)|Riesgos documentados y pruebas de roles, nombres, tipos y acceso directo.|

Importante: TEC-05 debe validarse temprano. La captura de pantalla es uno de los riesgos técnicos más importantes del proyecto; conviene comprobar su viabilidad antes de construir toda la interfaz.

## 5. Trazabilidad entre historias y SRS

Esta matriz ayuda a verificar que el backlog no pierda requisitos del documento original.

| Requisito del SRS | Historia o tarea asociada | Tratamiento |
|---|---|---|
|RF-001|HU-01|MVP|
|RF-002|HU-02|MVP|
|RF-003|HU-02|MVP|
|RF-004|HU-03|MVP|
|RF-005|HU-04|MVP|
|RF-006|HU-05|MVP|
|RF-007|HU-06|MVP|
|RF-008|HU-07|MVP|
|RF-009|HU-12|Posterior|
|RF-010|HU-12|Posterior|
|RF-011|HU-13|Posterior|
|RF-012|HU-08|MVP|
|RNF-001|HU-10|MVP|
|RNF-002|HU-08, TEC-06|MVP|
|RNF-003|HU-11; HU-12 para compartición|Parcial / posterior|
|RNF-004|HU-09|MVP|
|RNF-005|HU-11|Validación del MVP|
|RNF-006|TEC-03, HU-06, HU-07|MVP|
|RNF-007|HU-10, HU-11|MVP|
|RNF-008|HU-10|MVP|

**Trazabilidad de la ampliación, separada del SRS original:**

| Fuente complementaria | Historia / tarea | Tratamiento |
|---|---|---|
| Módulo archivos v0.1, §§ 1–3 | HU-14, HU-15, TEC-09 | Ampliación del MVP; no implementada |
| Módulo archivos v0.1, §§ 4–5 | HU-15, HU-17, TEC-10 | Ampliación del MVP; no implementada |
| Módulo archivos v0.1, § 6 | HU-16, TEC-10 | Ampliación del MVP; no implementada |
| Módulo archivos v0.1, §§ 7–8 | HU-18, HU-19, TEC-09, TEC-11 | Ampliación del MVP; no implementada |
| Módulo archivos v0.1, §§ 9–12 | HU-14–HU-19, TEC-09–TEC-12 | Aceptación, pendientes y exclusiones |

## 6. Orden recomendado de ejecución

### 1

Reducir incertidumbre técnica

Completar TEC-01 y TEC-05: definir la arquitectura inicial y validar la captura de pantalla en el navegador elegido.

### 2

Construir la sesión local

Implementar HU-01, HU-02 y HU-03 junto con TEC-02 y TEC-03.

### 3

Completar la revisión del trabajo

Implementar HU-04 y HU-05. Probar la correspondencia entre participante seleccionado y captura recibida.

### 4

Cerrar el ciclo de retroalimentación

Implementar HU-06, HU-07 y HU-08. Al final de este incremento ya debería ser posible realizar el flujo principal completo.

### 5

Validar calidad y operación

Ejecutar HU-09, HU-10 y HU-11. Para ampliar el MVP con archivos, planificar primero TEC-09 a TEC-12; después HU-14 a HU-19; finalizar con pruebas conjuntas de proyección y transferencias. HU-12 y HU-13 (observaciones grupales) se mantienen para un incremento posterior.

### 6 — Preparar arquitectura del módulo de archivos (siguiente fase)

Realizar un diseño de componentes y flujos de subida, publicación, descarga, eliminación y cierre; resolver cuotas con concurrencia, manejo de ZIP y archivos parciales, políticas de seguridad y prioridad frente a WebRTC. Registrar las decisiones aprobadas en ADR antes de implementar. **Este documento no selecciona tecnologías ni mecanismos concretos para esas decisiones.**
