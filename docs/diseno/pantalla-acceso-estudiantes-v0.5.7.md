# InterLAB v0.5.7 — Acceso estudiantil desde la vista de proyección

**Estado:** implementado en v0.5.7; validación física pendiente.

## Propósito
La computadora fija proyecta una vista de **acceso para estudiantes** cuando no hay transmisión de video activa. El contenido se sustituye por el video del docente o alumno autorizado mediante la negociación WebRTC existente.

## Contenido visible

- Ethernet: URL completa de acceso `http(s)://IP:PUERTO/alumno`, sin QR.
- Wi-Fi: URL completa de acceso `http(s)://IP:PUERTO/alumno` y **QR generado localmente** con exactamente esa URL.
- Se muestra solamente la(s) conexión(es) real(es) identificada(s); no se construye un QR para interfaces inexistentes.
- La pantalla **nunca** anuncia ni codifica `/docente` o `/proyeccion`.
- Se conserva la instrucción de escribir alias y código de sesión. El QR no proporciona el código de sesión ni inicia sesión por el alumno.

## Estados existentes conservados

Mientras no haya video, los estados «Esperando al docente», «Esperando conexión», cuenta regresiva de reconexión y «Tiempo de espera concluido» siguen apareciendo, pero **debajo de las URL estudiantiles**. Durante una proyección WebRTC, la pantalla de acceso queda oculta. Al terminar la transmisión, reaparece.

## Identificación de red

El servicio obtiene las IPv4 del equipo fijo mediante `os.networkInterfaces()` y excluye loopback, enlaces locales y nombres habituales de interfaces virtuales (Docker, VPN, etc.). La distinción Ethernet/Wi-Fi se realiza por nombres comunes de interfaces Linux (`eth*`, `en*`, `wl*`, `wlan*`, etc.). Interfaces no reconocidas se muestran como «Red local», solo URL y sin QR.

**Importante:** esto identifica direcciones asignadas, no demuestra que otras computadoras o teléfonos puedan alcanzar esas direcciones. La conectividad real y la confianza de certificados deben validarse en el laboratorio.

### Si el servidor está únicamente por Ethernet, pero los teléfonos entran vía Wi-Fi

Si el punto de acceso inalámbrico permite llegar a la IP cableada del servidor, puede establecerse `INTERLAB_WIFI_ACCESS_IP` con **esa misma IP del servidor**. InterLAB la publicará como entrada Wi-Fi con QR sin añadir una interfaz inalámbrica ficticia:

```bash
INTERLAB_WIFI_ACCESS_IP=172.17.240.120 npm run start:servidor
```

El administrador debe configurar este valor en el servicio de autoarranque si necesita que persista. Si el servidor realmente tiene una interfaz Wi-Fi conectada, la detecta sin este ajuste.

## Seguridad y accesibilidad

- Los enlaces y QR contienen solamente `/alumno`. No se altera la autorización de docentes ni estudiantes.
- El endpoint `/api/projection/student-access` solo responde desde loopback en el equipo fijo.
- Los QR se producen en el servidor **sin Internet** y se renderizan como SVG con zona de silencio de cuatro módulos y fondo blanco.
- Se actualizan aproximadamente cada 20 segundos, sin necesidad de cerrar sesión ni reiniciar InterLAB.
- El texto de la URL es seleccionable y legible para quienes no puedan utilizar QR.
- El esquema HTTPS y el puerto reflejan los parámetros reales de ejecución.

## Pruebas pendientes en el laboratorio

1. Comprobar URL Ethernet desde una PC por cable.
2. Comprobar QR Wi-Fi desde un teléfono y confirmar que abre `/alumno`.
3. Verificar certificados HTTPS en Android/iOS y Windows.
4. Probar el cambio docente → alumno → pantalla de acceso y la cuenta regresiva de 90 s.
5. Verificar cambios de IP, múltiples interfaces y reinicio automático del receptor.
