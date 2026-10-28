'use strict';
// Compatibilidad: el host ya no abre /docente sino /proyeccion.
// Para servicios administrados se recomienda ejecutar server.js y abrir el
// receptor desde scripts/open-receptor.js como procesos separados.
const {spawn}=require('node:child_process');
const path=require('node:path');
const server=spawn(process.execPath,[path.join(__dirname,'server.js')],{cwd:__dirname,env:process.env,stdio:'inherit'});
const launcher=spawn(process.execPath,[path.join(__dirname,'scripts','open-receptor.js')],{cwd:__dirname,env:process.env,stdio:'inherit'});
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{server.kill(signal);launcher.kill(signal);});
server.on('exit',code=>{launcher.kill();process.exitCode=code??0;});
