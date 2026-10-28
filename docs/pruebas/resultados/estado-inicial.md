# Estado de validación — base 0.3.0

**Versión de referencia del archivo:** 0.3.0. El campo `version` de `package.json` todavía indica `0.2.0`; esta actualización es documental y no cambia los metadatos del código.  
**Fecha de actualización documental:** 21 de octubre de 2026.

Este documento distingue las pruebas automatizadas de las pruebas reales entre navegadores. No registrar una prueba como aprobada sin ejecutarla y anotar entorno y resultado.

## Estado conocido

- **Lógica de sesión y cola:** el código incluye sesiones temporales, solicitudes de turno, selección directa y liberación de turno.
- **Captura/WebRTC entre equipos:** pendiente de validación manual en la LAN.
- **Cambio de presentador A→B:** defecto reportado; al seleccionar B después de A, la pantalla de B no aparece. Sigue abierto hasta reproducir, corregir y volver a probar.
- **Pantalla completa:** existe un control, pero falta comprobar en los navegadores objetivo si amplía el área que el usuario espera (vídeo o ventana de presentación completa).
<<<<<<< HEAD
- **HTTPS de la LAN:** la versión 0.3.3 incluye HTTPS con `mkcert`; queda pendiente validar la confianza del certificado y la captura en equipos Windows/Firefox reales.
=======
- **HTTPS de la LAN:** la versión 0.3.5 incluye HTTPS con certificado autofirmado de OpenSSL; queda pendiente validar el contexto seguro y la captura en equipos Windows/Firefox reales.
>>>>>>> 2f7796c (Integración de credenciales)
- **Autorización al incorporarse:** decisión de producto por revisar frente a la implementación, que solicita la captura cuando el estudiante pulsa el botón.
- **Exportación de notas:** deshabilitada por defecto, pendiente de validación formal con RNF-002.

## Verificaciones automáticas

**Ejecutadas el 21 de octubre de 2026 sobre esta base de código:**

- `node --check server.js`: aprobado.
- `npm test`: 11 pruebas aprobadas, 0 fallidas.
- Integridad de enlaces relativos de los documentos Markdown: sin enlaces locales rotos en la comprobación realizada.

Estas verificaciones no prueban la transmisión WebRTC entre equipos ni resuelven la incidencia A→B. No inferir el resultado de las pruebas manuales a partir de las pruebas unitarias.

## Registro de pruebas manuales

| Fecha | Navegadores / SO | Caso | Resultado observado | Evidencia / incidencia |
|---|---|---|---|---|
| Pendiente | Pendiente | A se muestra correctamente | Pendiente | — |
| Pendiente | Pendiente | Cambio A→B | Fallo reportado por el usuario; repetir tras corregir | La pantalla de B no aparece después de A |
| Pendiente | Pendiente | Turno C / selección directa | Pendiente | — |
| Pendiente | Pendiente | Detener captura y liberar turno | Pendiente | — |
| Pendiente | Pendiente | Pantalla completa | Pendiente | Confirmar si se amplía vídeo o vista completa |
| Pendiente | Pendiente | LAN con HTTPS confiable y sin Internet | Pendiente | — |

## Condición para cerrar la incidencia A→B

Solo cerrar la incidencia cuando A, B y C puedan presentar en secuencia en la LAN, la vista corresponda siempre al alias seleccionado, no queden transmisiones anteriores y la prueba se repita más de una vez sin fallos. Registrar los cambios de código que resuelvan la incidencia en `CHANGELOG.md` cuando se publiquen en una nueva versión.


## Incremento de acceso por rol (2026-10-24)

- **Implementado en código:** selector inicial, pantallas separadas, navegación de regreso y paletas diferenciadas para docente y estudiante.
- **Documentación añadida:** ADR-004, diseño de acceso y backlog ACC-01 a ACC-03.
- **Pendiente:** pruebas manuales de navegación, legibilidad, contraste, móvil y flujo de creación/incorporación.
- **Seguridad:** este incremento no añade autenticación institucional; las operaciones sensibles deben seguir protegidas por la autorización del servidor.
