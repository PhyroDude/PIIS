# Sistema local de retroalimentación — MVP, incremento 2

## Qué incluye

- Crear y cerrar una sesión temporal.
- Incorporar estudiantes con código y alias temporal (máximo 30).
- Autorizar la captura de pantalla desde el navegador del estudiante.
- Ver el estado de autorización en la lista del docente.
- Seleccionar a un estudiante para iniciar la transmisión de pantalla en tiempo real con WebRTC.
- Detener la revisión o dejar de compartir.
- Estado en memoria; no se guardan capturas ni historial.

## Requisitos

- Node.js 20 o posterior recomendado.
- Navegador actualizado (Chrome o Edge recomendado para la primera prueba).
- Para probar captura de pantalla en esta versión, abre el sitio en `http://localhost:3000` en el mismo equipo. Los navegadores suelen exigir HTTPS para captura de pantalla desde otros dispositivos de la LAN.

## Iniciar en Ubuntu/Linux

1. Extrae el ZIP y abre esta carpeta en VS Code.
2. En la terminal ejecuta:

   ```bash
   npm install
   npm start
   ```

3. Abre `http://localhost:3000`.
4. En una ventana crea la sesión como docente.
5. En otra ventana o perfil del navegador entra como estudiante con el código.
6. En el panel del estudiante pulsa **Autorizar y elegir pantalla** y selecciona la pantalla/ventana que quieras compartir.
7. En el panel del docente pulsa **Revisar pantalla** junto al alias autorizado.
8. Prueba **Detener revisión**, **Dejar de compartir** y **Finalizar sesión**.

## Importante sobre la red local

El servidor escucha en `0.0.0.0:3000`, pero esta entrega todavía se sirve por HTTP. `getDisplayMedia()` requiere un contexto seguro; `localhost` se considera seguro para desarrollo, mientras que una dirección como `http://192.168.x.x:3000` normalmente no. Antes de probar captura de pantalla desde equipos Windows distintos, el siguiente trabajo técnico será configurar HTTPS con un certificado confiable en los equipos cliente.

La señalización WebRTC se realiza por Socket.IO. La conexión de medios no usa un servidor externo STUN/TURN en esta versión, para mantener el diseño orientado a una LAN sin dependencia de Internet. La conectividad WebRTC puede depender de las políticas de red y del firewall de los equipos.

## Límites conocidos de este incremento

- No incluye todavía observaciones/comentarios del docente.
- No incluye proyección al grupo.
- No hay base de datos ni almacenamiento permanente.
- Es un prototipo para pruebas; no debe considerarse endurecido para producción.


### Proyección en pantalla completa

En el panel del docente, usa **Proyectar en pantalla completa** para ampliar el área de revisión de la pantalla del estudiante. Pulsa **Salir de pantalla completa** o presiona `Esc` para volver a la vista normal. Para mostrarla mediante un proyector, configura el sistema operativo para duplicar o extender la pantalla del docente al proyector.
