#!/usr/bin/env bash
set -euo pipefail
# Ejecutar como usuario que iniciará la sesión gráfica local.
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE="$(command -v node)"
SERVICE_DIR="$HOME/.config/systemd/user"
AUTOSTART_DIR="$HOME/.config/autostart"
mkdir -p "$SERVICE_DIR" "$AUTOSTART_DIR"
cat > "$SERVICE_DIR/interlab.service" <<UNIT
[Unit]
Description=InterLAB 0.5.0 - servidor del laboratorio
After=network.target

[Service]
Type=simple
WorkingDirectory=$HERE
ExecStart=$NODE $HERE/server.js
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
UNIT
cat > "$AUTOSTART_DIR/interlab-receptor.desktop" <<DESKTOP
[Desktop Entry]
Type=Application
Name=InterLAB Receptor
Comment=Vista de proyección del laboratorio
Exec=$NODE $HERE/scripts/open-receptor.js
Terminal=false
X-GNOME-Autostart-enabled=true
DESKTOP
systemctl --user daemon-reload
systemctl --user enable --now interlab.service
printf '\nServicio configurado para el usuario %s.\n' "$USER"
echo 'La vista /proyeccion se abrirá al iniciar la sesión gráfica de este usuario.'
echo 'Para arrancar el servicio desde el encendido, antes de iniciar sesión, habilita lingering:'
echo "  sudo loginctl enable-linger $USER"
echo 'Configura inicio de sesión gráfico automático si necesitas proyección sin intervención.'
echo 'No se omite la validación de certificados HTTPS; instala y confía en el certificado local.'
