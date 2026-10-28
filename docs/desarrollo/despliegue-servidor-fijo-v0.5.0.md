# Puesta en marcha de InterLAB 0.5.0 — computadora fija

**Estado:** guía para despliegue, requiere validación física. No ejecutar la vista docente en el equipo del servidor como flujo normal.

## Requisitos

- Computadora fija del laboratorio con Node.js 20+, conexión a LAN y al proyector físico, cuenta del SO con sesión gráfica.
- Un navegador Chromium/Chrome/Edge instalado en la computadora fija para la vista receptora; un navegador moderno en la laptop docente y las estaciones de alumnos.
- Certificado HTTPS preparado (`npm run setup:https`) **y confiado explícitamente** por los dispositivos LAN; no distribuir `certs/interlab-key.pem` ni otras claves privadas.
- Configurar el proyector como pantalla principal o salida adecuada en el sistema operativo para que la ventana en modo quiosco aparezca en él.

## Instalación manual para pruebas

```bash
npm ci
npm test
npm run setup:https
npm run start:servidor
```

En una segunda terminal **de la computadora fija**:

```bash
npm run start:receptor
```

La vista `https://localhost:3000/proyeccion` se abre en modo quiosco. Si necesitas lanzar ambos procesos desde una sola terminal para pruebas locales, utiliza `npm run start:docente` (alias histórico; ahora abre `/proyeccion`, **no** `/docente`). El servidor escucha en `0.0.0.0` de forma predeterminada.

Desde la **laptop personal del docente**, abre `https://IP-DEL-SERVIDOR:3000/docente`, autoriza la captura con «Compartir pantalla», crea la sesión y comparte el código visible. Los alumnos abren `https://IP-DEL-SERVIDOR:3000/alumno` y presentan desde su interfaz. No utilizar `localhost` desde laptops remotas.

### Autoarranque Linux preparado

```bash
bash scripts/install-linux-autostart.sh
```

Se crea `~/.config/systemd/user/interlab.service`, que ejecuta `server.js`, y `~/.config/autostart/interlab-receptor.desktop`, que abre el receptor al iniciar la sesión gráfica. Para servicio disponible desde el encendido antes del login, un administrador del equipo debe habilitar `sudo loginctl enable-linger USUARIO`. El receptor gráfico **requiere** sesión gráfica iniciada; configurar auto-login del usuario del equipo fijo si el laboratorio lo autoriza. El script no modifica el gestor de sesión ni instala navegadores.

Los equipos Windows como clientes continúan accediendo desde su navegador, sin instalar servidor. Si la computadora fija utiliza Windows, el servicio y la apertura automática del receptor deberán configurarse con tareas programadas; no se incluye aún un instalador Windows verificado.

### Recuperación administrativa excepcional

Solo si el docente ha perdido su cookie/credencial y necesita liberar el rol antes de la expiración de 90 segundos, desde una terminal **en la computadora fija**:

```bash
npm run release:docente
```

Se requiere escribir `LIBERAR` para confirmar. El proceso debe ejecutarse como el usuario propietario de los archivos de control (el SO protege la clave local). La clase, código y archivos permanecen. Cuando expire normalmente la credencial, **no** es necesario acercarse a la computadora.

## Fallos y recuperación

- **Docente cierra pestaña:** sesión continúa; tras 30 s comienza cuenta regresiva de 60 s, no superpuesta sobre una presentación estudiantil. Si regresa en 90 s con la misma cookie, recupera rol. Si borró cookies, esperar a expiración o recuperación excepcional local.
- **Alumno proyectando y docente desconectado:** el alumno sigue hasta terminar; nuevas solicitudes se encolan pero no se autorizan.
- **Alumno desconectado:** se retira su turno, se borra su solicitud pendiente y se vuelve a docente o estado de espera.
- **Se cierra solo el navegador receptor:** no se pierde la sesión; iniciar `npm run start:receptor` nuevamente.
- **Reinicio de Node o corte de luz:** sesión anterior termina; en el nuevo arranque se limpian archivos temporales propios antes de escuchar conexiones. La pantalla receptora muestra «Esperando al docente».
- **Certificado no confiable:** la captura puede ser bloqueada en laptop y estaciones. Verificar la instalación de confianza del certificado y usar exactamente la IP incluida en SAN.
- **Falla A→B o pantalla negra:** comprobar permisos de captura, conectividad UDP LAN y consola del navegador del emisor/receptor. Los 23+ tests automatizados validan control y señalización, **no** decodificación de video real.

## Seguridad

La primera visita a `/docente` toma el rol sin contraseña (decisión de producto) y es vulnerable a la apropiación anticipada desde otra computadora en la LAN. Utilizar una LAN de laboratorio administrada y no exponer el puerto al exterior. Cookies docentes `HttpOnly`, `Secure` en HTTPS, `SameSite=Strict`. El receptor admite señales únicamente desde loopback del servidor fijo.
