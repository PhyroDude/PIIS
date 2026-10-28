# InterLAB — Alcance del MVP revisado, versión 1.2

**Proyecto objetivo:** InterLAB v0.4.0 · **Base histórica adoptada:** InterLAB v0.3.4  
**Fecha:** 28-10-2026 · **Estado:** alcance objetivo confirmado, con decisiones de ingeniería pendientes.  
**Sustituye para planificar el rediseño:** la interpretación de despliegue, receptor de WebRTC y ciclo de sesión del alcance v1.1; **no elimina** aquel archivo ni el SRS original.

## 1. Propósito

El sistema facilita retroalimentación y presentación de trabajos en laboratorios sin Internet. Se implementará en una computadora fija dentro del laboratorio, que hospeda el servidor y muestra en el proyector físico un video WebRTC proveniente del docente o de un alumno autorizado. El docente controla la clase desde su laptop; los estudiantes ingresan desde sus equipos y siguen disponiendo del módulo de archivos compartidos temporalmente.

## 2. Disposición física y roles

1. **Servidor/receptor:** computadora fija, servicio autoarrancado y vista receptora a pantalla completa conectada físicamente al proyector; inicia en «Esperando al docente» sin sesión.
2. **Docente:** accede remotamente a `/docente`, primer navegador adquiere administración si no existe titular; decide qué alumno transmite, ve código de sesión y usa «Compartir pantalla» para autorizar captura.
3. **Alumno:** accede a `/alumno`, usa alias y código; no negocia WebRTC al entrar. Puede compartir archivos y pedir turno, esperando autorización.
4. **Vista `/proyeccion`:** componente propuesto dentro de la computadora fija, separado del proceso servidor; recibir video no debe trasladar el ciclo de vida de la sesión a una pestaña.

## 3. Flujo principal de clase

1. Al encender el equipo fijo, el servicio y la vista de proyección se abren automáticamente.
2. El docente entra desde su laptop a `/docente` y obtiene credencial administrativa privada si el control está libre.
3. El docente pulsa «Compartir pantalla», elige la superficie y autoriza captura. No se presume permiso automático del navegador.
4. El docente crea la sesión. El servidor genera un código visible de incorporación, diferente de su credencial privada. El servidor conserva el estado hasta cierre explícito o reinicio.
5. Los alumnos entran con alias y código; pueden solicitar turno y cargar/descargar archivos temporales.
6. Con docente conectado, la transmisión WebRTC predeterminada es la del docente hacia el receptor fijo. Un alumno no envía video por estar inscrito o en cola.
7. El docente autoriza desde la cola o solicita directamente a un alumno; éste recibe la notificación, acepta la captura y queda temporalmente autorizado. El envío WebRTC del docente cesa mientras transmite el alumno.
8. El alumno puede finalizar su propia proyección; el docente puede detenerla. Al finalizar, retorna la fuente docente si está disponible; de lo contrario se muestra el estado de espera que corresponda.
9. Al cierre explícito, todos los permisos, códigos, transacciones y recursos de la sesión se invalidan y eliminan. Las descargas previamente guardadas en dispositivos externos permanecen allí.

## 4. Recuperación de control docente

La desconexión del docente **no cierra la sesión**. Desde que el servidor la confirma:

| Intervalo | Mensaje cuando no existe video estudiantil activo | Control administrativo |
|---|---|---|
| 0 a menos de 30 s | «Esperando conexión» | Reservado para misma credencial |
| 30 a menos de 90 s | «Esperando conexión» + cuenta regresiva 01:00→00:00 | Reservado para misma credencial |
| Desde 90 s | «Tiempo de espera concluido, esperando nuevo docente» | Credencial anterior invalidada; primer nuevo navegador puede asumir |

El contador corre aunque un alumno esté proyectando, pero no se muestra sobre su video. La recuperación de privilegios desde el mismo perfil es automática si la credencial continúa válida; la captura WebRTC, si se perdió, exigirá nueva acción/permiso. Si se borró la credencial, el docente debe esperar la liberación automática o ejecutar una liberación administrativa **local y excepcional, exclusivamente por el profesor**.

## 5. Continuidad de los estudiantes sin docente

- Nuevos alumnos pueden incorporarse con código válido.
- La cola recibe solicitudes y conserva orden; no se autoriza a nadie automáticamente.
- Las solicitudes pendientes se retiran si el alumno se desconecta; si reingresa, solicita de nuevo.
- El docente que vuelve ve solicitudes acumuladas y puede autorizar, rechazar, seleccionar directamente o esperar a que se retiren.
- La presentación estudiantil que ya estaba autorizada sigue incluso después de que la credencial docente expire, y se corta solo si el estudiante termina, el docente autorizado ordena parar o se confirma desconexión del estudiante.
- Las operaciones de archivos —alta, listado, descarga, eliminación permitida— y transferencias en curso siguen funcionando. **Solo se suspenden nuevas concesiones de proyección.**

## 6. Archivo temporal compartido — se conserva del incremento v0.4.0

Se mantienen las pestañas y permisos definidos en `InterLAB_Requisitos_Modulo_Archivos_v0.1.md`: docente con Mis archivos/Archivos de los alumnos; alumno con Archivos del profesor/Archivos de los alumnos/Mis archivos. Se aceptan archivos generales, ZIP incluido, sin renombrar y con nombres duplicados permitidos. Las cuotas siguen siendo **50 MB por archivo; 200 MB por operación; 10 GB por sesión y dos transferencias simultáneas por usuario**. Se conserva descarga individual/ZIP, búsqueda por prefijo en archivos de alumnos, ordenamiento, avisos de capacidad, flujo en tiempo real y prioridad de video. La desaparición o vencimiento del docente **no equivale al cierre de sesión** y no activa borrado ni interrupción de archivos.

## 7. Exclusiones y límites

- Sin almacenamiento histórico de sesiones; el reinicio del servidor invalida la sesión y exige limpieza de temporales antes de servir usuarios.
- Sin transmisión simultánea de varias pantallas; el receptor presenta una fuente autorizada a la vez.
- Sin grabación de video ni dependencia de servicios cloud.
- Sin autenticación institucional fuerte: la ocupación del rol docente por primer acceso sigue teniendo riesgo deliberadamente aceptado, y requerirá evaluación antes de producción.
- No se garantiza capturar pantalla al entrar a `/docente`: la selección requiere interacción explícita del navegador.
- El diseño de UI de la vista receptora y su servicio de arranque debe validarse en el sistema operativo final.

## 8. Criterios de aceptación prioritarios

1. Arranque automático del servicio y vista receptora sin navegador docente abierto.
2. Acceso remoto a `/docente`; `/alumno` y `/proyeccion` con límites y autorización apropiados.
3. Sesión sobrevive a refresco/cierre del navegador docente; no pierde alumnos, archivos o cola.
4. Recuperación misma credencial en menos de 90 s; expiración exacta y cuenta visible después de 30 s.
5. Captura docente explícita, video WebRTC al servidor fijo y no a una pestaña docente.
6. Solicitud directa requiere notificación/aceptación de alumno, y la cola no transmite video.
7. Solo una fuente WebRTC activa; regreso correcto del alumno al docente.
8. Presentación estudiantil no se interrumpe por desconexión/vencimiento docente.
9. Si alumno seleccionado se desconecta, se revoca turno; si estudiante en cola se desconecta, se elimina su solicitud.
10. Admisión y archivos siguen operando sin docente; solo nuevas autorizaciones quedan bloqueadas.
11. Reinicio de servidor descarta sesión, código, credenciales, archivos, transferencias y colas.
12. Cierre explícito docente elimina estado y temporales sin permitir publicaciones tardías.

## 9. Estado de implementación

**Este documento define el nuevo alcance; no certifica su implementación.** El ZIP InterLAB-v0.4.0-beta aún contiene referencias a host docente, restricciones loopback en `/docente`, fin de sesión ante desconexión docente y video recibido en el navegador docente. La funcionalidad de archivos existe en beta, pendiente de pruebas integrales en LAN/Windows. La transición A→B sigue marcada como incidencia hasta validación real. Los dos fixes suministrados después (aviso de pantalla y descarga sin navegar) tampoco se atribuyen automáticamente al ZIP base.

## 10. Referencias

- SRS original: `../requisitos/SRS-original.pdf` (no modificado).
- Enmienda nueva: `../requisitos/SRS-enmienda-modelo-servidor-proyeccion-v0.4.0.md`.
- Módulo de archivos: `../requisitos/InterLAB_Requisitos_Modulo_Archivos_v0.1.md`.
- Backlog nuevo: `backlog-redisenio-v0.4.0.md`.
- Arquitectura objetivo: `../arquitectura/arquitectura-objetivo-servidor-y-proyeccion-v0.4.0.md`.
