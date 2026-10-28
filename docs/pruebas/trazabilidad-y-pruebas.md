# Trazabilidad y plan de pruebas — base 0.3.0

> **Actualización de la UI en v0.5.0:** las notas personales mantienen el límite original de **1000 caracteres**, con [modal y validación en cliente y servidor](../desarrollo/modal-notas-personales-v0.5.0.md).

- **Estado:** plan de verificación. Los casos no se consideran aprobados hasta ejecutarse y registrarse.
- **Objetivo:** comprobar sesión temporal, roles, retroalimentación oral, notas individuales y cola exclusiva de presentación.

## 1. Matriz de trazabilidad

| Área / requisito o decisión | Tratamiento en la base 0.3.0 | Pruebas asociadas | Estado |
|---|---|---|---|
| Sesión, código y alias temporal | Incluido | SES-T01 a SES-T04 | Automatización parcial; validar manualmente |
| Selección y revisión del estudiante | Incluido | PRO-T01, PRO-T03 | Integración pendiente |
| Captura y transmisión de pantalla | Incluido en el código | PRO-T02 a PRO-T09 | WebRTC real pendiente |
| Cola de presentación y concesión del docente | Incluido en el código | PRO-T01, PRO-T03 a PRO-T08 | Cambio A→B reportado como defectuoso |
| Selección directa prioritaria | Incluida en el código | PRO-T05 | Pendiente de prueba manual |
| Pantalla completa | Control incluido | PRO-T10 | Pendiente de validar el área que se amplía |
| RF-007 — registrar observación individual | Nota opcional | OBS-T01 a OBS-T04 | Pruebas propuestas |
| RF-008 — consultar observación individual | Solo notas propias durante la sesión | OBS-T05 a OBS-T07 | Pruebas propuestas |
| RF-012 — finalizar sesión | Elimina estado temporal | OBS-T08 y OBS-T09 | Pruebas propuestas |
| RNF-002 — no persistencia | No hay historial del servidor; exportación local pendiente de aprobación | OBS-T08 a OBS-T11 | Exportación por validar |
| RNF-005 — usabilidad | La retroalimentación oral no exige escribir | OBS-T01 y prueba de uso | Validar con usuarios |
| RNF-006 — permisos y roles | Validación del lado del servidor | OBS-T06, OBS-T07, PRO-T08 | Validación de seguridad pendiente |
| Requisito de operación local | Diseñado para LAN sin dependencia funcional de Internet | NET-T01, NET-T02 | Prueba de laboratorio pendiente |

La numeración RF/RNF debe verificarse contra el SRS original. Esta tabla no modifica su significado. Compartir pantalla del estudiante para revisión no es lo mismo que proyectar observaciones escritas al grupo; esa última función debe trazarse de forma independiente.

## 2. Pruebas de proyección

### PRO-T01 — Cola FIFO con tres estudiantes
**Preparación:** docente y estudiantes A, B y C conectados a la misma sesión.  
**Pasos:** A, B y C solicitan turno, en ese orden.  
**Esperado:** aparecen una sola vez y en orden de llegada; ninguno transmite vídeo mientras espera.

### PRO-T02 — Autorización de captura
**Pasos:** el estudiante pulsa el botón y responde al diálogo del navegador.  
**Esperado:** la captura queda preparada solo tras la acción explícita; la autorización no inicia por sí misma la transmisión.

### PRO-T03 — Conceder turno a A
**Pasos:** el docente concede el acceso a A.  
**Esperado:** la vista muestra la pantalla de A y el alias correcto; B y C siguen sin transmitir.

### PRO-T04 — Cambio de A a B (caso crítico)
**Pasos:** con A visible, el docente concede o selecciona a B.  
**Esperado:** se cierra la conexión de A, se limpia la vista anterior y se establece una nueva conexión con B. Las señales tardías de A no alteran la vista de B.  
**Estado:** pendiente; existe un reporte del usuario de que B no aparece tras el cambio.

### PRO-T05 — Selección directa prioritaria
**Pasos:** con B y C en cola, el docente elige directamente a C desde la lista.  
**Esperado:** C pasa a ser el seleccionado, su solicitud se elimina de la cola y no hay dos transmisiones activas.

### PRO-T06 — Detener proyección del docente
**Pasos:** detener la proyección mientras A transmite.  
**Esperado:** se cierra la conexión activa, se limpia el vídeo y se libera la selección; la sesión permanece activa.

### PRO-T07 — Detener captura desde el estudiante
**Pasos:** el estudiante seleccionado detiene la captura o cierra el selector del navegador.  
**Esperado:** se detiene la transmisión y se libera el turno; si estaba en cola, se elimina su solicitud.

### PRO-T08 — Señalización no autorizada
**Pasos:** intentar emitir ofertas/candidatos hacia un estudiante no seleccionado o desde un participante de otra sesión.  
**Esperado:** el servidor no reenvía esos mensajes.

### PRO-T09 — Reconexión y mensajes tardíos
**Pasos:** cambiar de presentador rápidamente, detener y reiniciar captura, desconectar y reconectar un estudiante.  
**Esperado:** no se reutiliza la negociación anterior ni se muestra el vídeo del participante equivocado.

### PRO-T10 — Pantalla completa
**Pasos:** pulsar el control de pantalla completa en cada navegador objetivo.  
**Esperado:** la vista de presentación ocupa el área esperada; registrar si se amplía el vídeo o el contenedor y si se cumple el requerimiento de ventana completa.

## 3. Pruebas de observaciones

### OBS-T01 — Retroalimentación oral sin nota
El docente revisa una pantalla, explica una corrección oralmente y cambia de estudiante sin escribir. El sistema no debe exigir ni crear una nota automáticamente.

### OBS-T02 — Crear nota válida
El docente registra una nota no vacía de hasta 1,000 caracteres. La nota se asocia al destinatario correcto y aparece solo en su panel.

### OBS-T03 — Rechazar nota vacía
Enviar una cadena vacía o compuesta solo por espacios. El servidor rechaza la operación.

### OBS-T04 — Rechazar nota demasiado larga
Intentar enviar más de 1,000 caracteres. El servidor rechaza la operación.

### OBS-T05 — Aislamiento entre estudiantes
Crear una nota para A y consultar desde A y B. A la ve; B no.

### OBS-T06 — Manipulación de identificador
Desde B, intentar consultar notas de A cambiando identificadores del cliente. El servidor no revela notas ajenas.

### OBS-T07 — Operación no autorizada
Intentar crear una observación desde un socket de estudiante o con un token inválido. La operación se rechaza.

### OBS-T08 — Eliminación al cerrar
Crear observaciones y cerrar la sesión. El código deja de ser válido y las notas no pueden recuperarse.

### OBS-T09 — Reinicio del servidor
Crear observaciones y reiniciar el proceso. Las notas no se restauran desde almacenamiento persistente.

### OBS-T10 — Copia/descarga (solo si se aprueba)
Verificar que el usuario solo exporta sus propias notas y que no se crea almacenamiento en el servidor. No ejecutar como criterio de aceptación mientras RNF-002 siga sin resolver.

### OBS-T11 — No registrar contenido en logs
Revisar logs tras crear una nota de prueba. No deben contener el texto de la observación.

## 4. Pruebas de red y despliegue

- **NET-T01:** docente y dos estudiantes en la misma LAN, con HTTPS confiable; comprobar incorporación, captura, cambio A→B y fin de sesión.
- **NET-T02:** repetir sin acceso a Internet, una vez disponibles dependencias y certificados; registrar cualquier dependencia externa observada.
- **NET-T03:** intentar acceso desde una red no autorizada y comprobar que el firewall limita el servicio a la LAN prevista.

## 5. Criterio de salida

No declarar validado el MVP hasta que se registren resultados reales para el flujo completo, especialmente cambio de presentador A→B, selección directa, detención, pantalla completa y funcionamiento en la LAN. Las pruebas unitarias de la cola no son evidencia suficiente de que WebRTC funciona entre equipos.


## Pruebas del acceso y la identidad visual por rol

| Caso | Verificación | Estado inicial del incremento |
|---|---|---|
| ACC-T01 | Elegir Docente muestra solo su pantalla de acceso y paleta azul | Pendiente de prueba manual |
| ACC-T02 | Elegir Estudiante muestra solo su pantalla de acceso y paleta verde azulado | Pendiente de prueba manual |
| ACC-T03 | Volver al selector no crea sesión ni incorpora estudiante | Pendiente de prueba manual |
| ACC-T04 | Los errores de formulario se muestran en la pantalla del rol correspondiente | Pendiente de prueba manual |
| ACC-T05 | El panel conserva la paleta correspondiente tras entrar | Pendiente de prueba manual |
| ACC-T06 | Formularios de creación e incorporación siguen funcionando | Pendiente de prueba de integración |
| ACC-T07 | Los controles de servidor siguen validando operaciones docentes | Requiere pruebas de autorización específicas |
| ACC-T08 | Contraste, foco de teclado y diseño móvil | Pendiente de revisión manual |

Los cambios de presentación visual no deben registrarse como autenticación ni como demostración de seguridad.


## Pruebas de rutas directas y arranque del anfitrión

| Caso | Verificación | Estado |
|---|---|---|
| ROUTE-T01 | `GET /docente` devuelve la aplicación y muestra el acceso docente al abrirla en navegador. | Prueba automatizada de respuesta; comportamiento visual pendiente de prueba manual |
| ROUTE-T02 | `GET /alumno` devuelve la aplicación y muestra el acceso estudiantil al abrirla en navegador. | Prueba automatizada de respuesta; comportamiento visual pendiente de prueba manual |
| ROUTE-T03 | `/` conserva el selector general de rol. | Pendiente de prueba manual |
| START-T01 | `npm run start:docente` inicia el servicio y abre `https://localhost:3000/docente` en el anfitrión. | Pendiente de prueba manual en el sistema operativo del anfitrión |
| LAN-T01 | Un cliente abre `http://IP-LAN-DEL-DOCENTE:3000/alumno` y se incorpora con código y alias. | Pendiente de prueba de integración en LAN |
| ROLE-T01 | Acceder a una ruta no permite ejecutar acciones del otro rol sin superar las validaciones del servidor. | Requiere pruebas de autorización específicas; las rutas no son control de seguridad |
| UI-T01 | Revisar contraste, foco, legibilidad y paleta en escritorio y móvil. | Pendiente; paleta no aprobada |

Las pruebas automatizadas de rutas solo verifican que el servidor responde con la aplicación; no prueban por sí solas la visibilidad de los paneles en el navegador ni el despliegue real en LAN.


## Despliegue LAN y rutas por rol

- [ ] Prueba automatizada: `getLanIPv4Addresses()` filtra loopback, IPv6 y direcciones link-local, y prioriza IPv4 privadas.
- [ ] Prueba automatizada: se identifican loopback IPv4, IPv6 y IPv4 mapeada en IPv6.
- [ ] Prueba de integración pendiente: `/docente` permite acceso local y bloquea peticiones remotas con HTTP 403.
- [ ] Prueba de integración pendiente: `/` y `/index.html` redirigen según el origen de la petición.
- [ ] Prueba manual pendiente: un cliente físico abre `/alumno` usando la IP correcta de la LAN.
- [ ] Prueba manual pendiente: el firewall del host permite el puerto configurado únicamente dentro de la red autorizada.
