# Documento de alcance del MVP
## Sistema local de retroalimentación para laboratorios de cómputo

**Versión:** 1.0  
**Fecha:** 14 de octubre de 2026  
**Estado:** Propuesta inicial para Product Delivery  
**Documento de referencia:** Especificación de requisitos de software (SRS) del Sistema local de retroalimentación para laboratorios de cómputo.

---

## 1. Propósito

Este documento define el alcance de la versión mínima viable (*Minimum Viable Product*, MVP) del Sistema local de retroalimentación para laboratorios de cómputo.

Su finalidad es delimitar las funcionalidades que deben implementarse para validar la propuesta de valor del sistema, establecer qué capacidades se posponen para versiones posteriores y proporcionar criterios verificables que orienten la construcción y evaluación del primer incremento funcional.

El documento complementa el SRS existente. No reemplaza sus requisitos, modelos, reglas de negocio ni casos de prueba.

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

La validación de este flujo permitirá determinar si el sistema facilita la revisión del trabajo y la entrega de retroalimentación individual en un entorno real de laboratorio.

## 4. Usuarios y actores involucrados

### 4.1 Docente

Es el responsable de iniciar y finalizar la sesión, consultar los participantes, seleccionar al estudiante cuyo trabajo desea observar y registrar observaciones individuales.

### 4.2 Estudiante

Se incorpora a la sesión con un alias temporal, autoriza la captura de pantalla de acuerdo con el flujo establecido y consulta las observaciones que le corresponden.

### 4.3 Sistema de control de sesión

Administra el estado temporal de la sesión, los participantes, las observaciones, las conexiones y la aplicación de las restricciones de acceso.

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

El sistema no deberá mantener como información activa los datos de la sesión una vez finalizada. La implementación y las pruebas deberán considerar también el reinicio del servicio.

**Referencia:** RNF-002.

### 7.3 Rendimiento y capacidad

El SRS establece una carga de referencia de hasta 30 participantes simultáneos. El diseño deberá considerar esta carga desde el inicio.

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

La compartición grupal y la proyección podrán planificarse después de validar este flujo.

## 10. Indicadores para evaluar el MVP

La evaluación inicial deberá centrarse en evidencias observables:

- **Finalización del flujo:** proporción de pruebas en las que se completa el recorrido desde la incorporación hasta la consulta de la observación.
- **Correspondencia de participantes:** número de pruebas en las que la captura y la observación corresponden al estudiante seleccionado.
- **Control de acceso:** resultados de las pruebas que verifican que los estudiantes no acceden a observaciones individuales ajenas.
- **Operación local:** resultado de las pruebas realizadas sin conexión a Internet.
- **No persistencia:** resultado de las comprobaciones posteriores al cierre y reinicio.
- **Rendimiento y estabilidad:** tiempos observados, errores, desconexiones y resultados de las pruebas con varios participantes.
- **Utilidad percibida:** comentarios del docente y los estudiantes sobre la facilidad para revisar el trabajo y recibir retroalimentación.

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
- Exista documentación suficiente para instalar, iniciar, utilizar y finalizar una sesión de prueba.
- Las funcionalidades pospuestas permanezcan identificadas en el Product Backlog.

La finalización del desarrollo no equivale automáticamente a demostrar la utilidad del producto. La validación con un docente y estudiantes en un contexto representativo permitirá determinar si la solución responde al problema planteado y qué cambios deben priorizarse en el siguiente incremento.

## 14. Resultado esperado

Al concluir el MVP se espera disponer de una aplicación funcional que permita realizar una sesión local de retroalimentación individual, desde la incorporación del estudiante hasta la entrega de una observación, respetando las restricciones de operación local, control de acceso y no persistencia.

Este resultado constituirá la base para evaluar la solución con usuarios reales y decidir la incorporación posterior de la compartición grupal, la proyección y otras funcionalidades contempladas en el SRS.

---

**Documento relacionado:** SRS — Sistema local de retroalimentación para laboratorios de cómputo.

**Siguiente artefacto recomendado:** Product Backlog priorizado con historias de usuario, criterios de aceptación, prioridad y trazabilidad hacia los requisitos del SRS.