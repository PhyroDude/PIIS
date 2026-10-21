# Documento de alcance del MVP
## Sistema local de retroalimentación para laboratorios de cómputo

**Versión:** 1.0  
**Fecha:** 14 de octubre de 2026  
**Estado:** Propuesta inicial para Product Delivery  
**Documento de referencia:** Especificación de requisitos de software (SRS) del Sistema local de retroalimentación para laboratorios de cómputo.

## Índice

- [Documento de alcance del MVP](#documento-de-alcance-del-mvp)
  - [Sistema local de retroalimentación para laboratorios de cómputo](#sistema-local-de-retroalimentación-para-laboratorios-de-cómputo)
  - [Índice](#índice)
  - [Estructura documental](#estructura-documental)
  - [1. Propósito](#1-propósito)
  - [2. Contexto y problema que se busca resolver](#2-contexto-y-problema-que-se-busca-resolver)
  - [3. Objetivo del MVP](#3-objetivo-del-mvp)
  - [4. Usuarios y actores involucrados](#4-usuarios-y-actores-involucrados)
    - [4.1 Docente](#41-docente)
    - [4.2 Estudiante](#42-estudiante)
    - [4.3 Sistema de control de sesión](#43-sistema-de-control-de-sesión)
    - [4.4 Entorno de operación](#44-entorno-de-operación)
  - [5. Alcance funcional incluido](#5-alcance-funcional-incluido)
    - [5.1 Gestión de sesiones](#51-gestión-de-sesiones)
    - [5.2 Incorporación e identificación temporal](#52-incorporación-e-identificación-temporal)
    - [5.3 Consulta y selección de participantes](#53-consulta-y-selección-de-participantes)
    - [5.4 Captura y visualización del trabajo](#54-captura-y-visualización-del-trabajo)
    - [5.5 Registro y consulta de observaciones individuales](#55-registro-y-consulta-de-observaciones-individuales)
    - [5.6 Control de acceso y roles](#56-control-de-acceso-y-roles)
    - [5.7 Operación local y eliminación de datos temporales](#57-operación-local-y-eliminación-de-datos-temporales)
  - [6. Funcionalidades excluidas del MVP](#6-funcionalidades-excluidas-del-mvp)
  - [7. Requisitos no funcionales y restricciones](#7-requisitos-no-funcionales-y-restricciones)
    - [7.1 Operación sin Internet](#71-operación-sin-internet)
    - [7.2 No persistencia](#72-no-persistencia)
    - [7.3 Rendimiento y capacidad](#73-rendimiento-y-capacidad)
    - [7.4 Interrupciones temporales](#74-interrupciones-temporales)
    - [7.5 Usabilidad](#75-usabilidad)
    - [7.6 Autorización y permisos](#76-autorización-y-permisos)
    - [7.7 Compatibilidad y comunicación local](#77-compatibilidad-y-comunicación-local)
  - [8. Criterios de aceptación del MVP](#8-criterios-de-aceptación-del-mvp)
  - [9. Primer incremento funcional](#9-primer-incremento-funcional)
    - [Incremento 1: sesión y participantes](#incremento-1-sesión-y-participantes)
    - [Incremento 2: observación de pantalla](#incremento-2-observación-de-pantalla)
    - [Incremento 3: retroalimentación individual](#incremento-3-retroalimentación-individual)
    - [Incremento 4: cierre y validación técnica](#incremento-4-cierre-y-validación-técnica)
  - [10. Indicadores para evaluar el MVP](#10-indicadores-para-evaluar-el-mvp)
  - [11. Supuestos y decisiones pendientes](#11-supuestos-y-decisiones-pendientes)
  - [12. Relación con el SRS](#12-relación-con-el-srs)
  - [13. Definición de terminado](#13-definición-de-terminado)
  - [14. Resultado esperado](#14-resultado-esperado)
- [Product Backlog inicial](#product-backlog-inicial)
  - [Sistema local de retroalimentación para laboratorios de cómputo](#sistema-local-de-retroalimentación-para-laboratorios-de-cómputo-1)
  - [1. Criterios de priorización](#1-criterios-de-priorización)
  - [2. Épicas del producto](#2-épicas-del-producto)
  - [3. Backlog de historias de usuario](#3-backlog-de-historias-de-usuario)
    - [HU-01 — Iniciar una sesión](#hu-01--iniciar-una-sesión)
    - [HU-02 — Incorporarse con un alias temporal](#hu-02--incorporarse-con-un-alias-temporal)
    - [HU-03 — Consultar participantes](#hu-03--consultar-participantes)
    - [HU-04 — Seleccionar un estudiante](#hu-04--seleccionar-un-estudiante)
    - [HU-05 — Autorizar y transmitir una captura de pantalla](#hu-05--autorizar-y-transmitir-una-captura-de-pantalla)
    - [HU-06 — Registrar una observación individual](#hu-06--registrar-una-observación-individual)
    - [HU-07 — Consultar mi retroalimentación](#hu-07--consultar-mi-retroalimentación)
    - [HU-08 — Finalizar una sesión y eliminar su estado temporal](#hu-08--finalizar-una-sesión-y-eliminar-su-estado-temporal)
    - [HU-09 — Recuperarse de una desconexión temporal](#hu-09--recuperarse-de-una-desconexión-temporal)
    - [HU-10 — Validar el funcionamiento sin Internet](#hu-10--validar-el-funcionamiento-sin-internet)
    - [HU-11 — Verificar capacidad, rendimiento y compatibilidad](#hu-11--verificar-capacidad-rendimiento-y-compatibilidad)
    - [HU-12 — Compartir una observación con el grupo](#hu-12--compartir-una-observación-con-el-grupo)
    - [HU-13 — Proyectar observaciones](#hu-13--proyectar-observaciones)
  - [4. Trabajo técnico habilitador](#4-trabajo-técnico-habilitador)
  - [5. Trazabilidad entre historias y SRS](#5-trazabilidad-entre-historias-y-srs)
  - [6. Orden recomendado de ejecución](#6-orden-recomendado-de-ejecución)
    - [1](#1)
    - [2](#2)
    - [3](#3)
    - [4](#4)
    - [5](#5)

---
## Estructura documental

- [`docs/README.md`](docs/README.md): índice y reglas para mantener documentos.
- [`docs/requisitos/`](docs/requisitos/): SRS original y referencias de requisitos.
- [`docs/producto/`](docs/producto/): alcance del MVP y backlog base.
- [`docs/arquitectura/`](docs/arquitectura/): arquitectura y decisiones (ADR).
- [`docs/diseno/`](docs/diseno/): comportamiento detallado de las observaciones.
- [`docs/pruebas/`](docs/pruebas/): trazabilidad, casos de prueba y resultados pendientes.
- [`docs/desarrollo/`](docs/desarrollo/): puesta en marcha y limitaciones técnicas.

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

# Product Backlog inicial

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

|   |   |   |
|---|---|---|
  
|Épica|Nombre|Objetivo|
|EP-01|Gestión de sesiones|Controlar el ciclo de vida de la sesión.|
|EP-02|Incorporación de participantes|Permitir el acceso temporal de estudiantes.|
|EP-03|Revisión del trabajo|Seleccionar estudiantes y visualizar sus pantallas.|
|EP-04|Retroalimentación individual|Registrar y consultar observaciones.|
|EP-05|Control y seguridad|Proteger roles, datos y comunicaciones.|
|EP-06|Operación y calidad|Garantizar operación local, estabilidad y no persistencia.|
|EP-07|Retroalimentación grupal|Compartir observaciones y proyectarlas en futuras versiones.|

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

## 4. Trabajo técnico habilitador

Además de las historias visibles para los usuarios, el backlog debe contemplar tareas técnicas que permitan implementarlas de forma segura y mantenible. Estas tareas no sustituyen las historias funcionales.

|   |   |   |   |
|---|---|---|---|
   
|ID|Tarea técnica|Prioridad|Resultado esperado|
|TEC-01|Definir arquitectura y tecnologías|P0|Componentes, protocolos y despliegue documentados.|
|TEC-02|Definir modelo de datos temporal|P0|Estructuras para sesión, participantes y observaciones.|
|TEC-03|Implementar validación de roles en el servidor|P0|Operaciones protegidas por autorización.|
|TEC-04|Definir comunicación en tiempo real|P0|Actualización de participantes y observaciones.|
|TEC-05|Probar viabilidad de captura de pantalla|P0|Prototipo que valida permisos y transmisión bajo demanda.|
|TEC-06|Definir estrategia de limpieza de estado|P0|Eliminación verificable al cerrar o reiniciar.|
|TEC-07|Configurar entorno de pruebas LAN|P1|Pruebas desde varios equipos.|
|TEC-08|Documentar instalación y ejecución|P1|Instrucciones reproducibles para desplegar el MVP.|

Importante: TEC-05 debe validarse temprano. La captura de pantalla es uno de los riesgos técnicos más importantes del proyecto; conviene comprobar su viabilidad antes de construir toda la interfaz.

## 5. Trazabilidad entre historias y SRS

Esta matriz ayuda a verificar que el backlog no pierda requisitos del documento original.

|   |   |   |
|---|---|---|
  
|Requisito del SRS|Historia o tarea asociada|Tratamiento|
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

Ejecutar HU-09, HU-10 y HU-11. Después de validar el MVP, abordar HU-12 y HU-13.