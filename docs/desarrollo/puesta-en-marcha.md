# Puesta en marcha y verificación

## Entorno recomendado

- Node.js 20 o posterior.
- npm.
- VS Code u otro editor.
- Navegador moderno.
- Para revisión de pantalla en equipos remotos: HTTPS en una dirección accesible desde la LAN.

## Instalar y ejecutar

```bash
npm install
npm start
```

Abrir `http://localhost:3000` en la computadora del servidor. Para acceso desde otra computadora, configurar TLS/HTTPS antes de probar captura de pantalla; no basta con cambiar `localhost` por la IP si el navegador considera inseguro ese origen.

## Ejecutar pruebas unitarias

```bash
npm test
```

## Habilitar exportación de notas

Solo después de aprobar el cambio relacionado con RNF-002:

```bash
ENABLE_NOTE_EXPORT=true npm start
```

Si la decisión aún está pendiente, ejecutar sin la variable o con `ENABLE_NOTE_EXPORT=false`.

## Lista de comprobación manual

- [ ] El docente crea una sesión y comparte el código.
- [ ] Un estudiante entra con código y alias válido.
- [ ] Un código incorrecto y un alias duplicado se rechazan.
- [ ] El docente puede dar retroalimentación oral sin crear una nota.
- [ ] Una nota escrita opcional llega solo al estudiante destinatario.
- [ ] El estudiante no puede pedir notas de otro participante mediante la interfaz o eventos directos.
- [ ] El estudiante autoriza captura desde el diálogo del navegador.
- [ ] La transmisión solo comienza después de seleccionar al estudiante.
- [ ] El video del docente puede ponerse en pantalla completa.
- [ ] Detener captura cierra la transmisión.
- [ ] Al cerrar la sesión, la aplicación elimina el estado temporal.
- [ ] Se repiten las pruebas con varios navegadores/equipos en la LAN y sin Internet.

No marques una prueba como aprobada hasta ejecutarla y registrar el resultado, navegador, sistema operativo y fecha.
