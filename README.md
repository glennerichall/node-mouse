# Remote Mouse + Keyboard (Express + RobotJS)

Application de télécommande souris/clavier depuis un appareil mobile.

## Fonctionnalités

- QR code affiché au démarrage du serveur (terminal + page `/qr`)
- Contrôle souris via zone tactile (canvas)
- Clic gauche (tap ou bouton)
- Clic droit (tap 2 doigts ou bouton)
- Scroll à 2 doigts
- Envoi de texte via panneau clavier
- Touches spéciales: Entrée et Backspace

## Prérequis système (Linux)

Node.js est requis (version 20+ recommandée):

```bash
node -v
npm -v
```

Si Node.js n'est pas installé (Debian/Ubuntu):

```bash
sudo apt-get update
sudo apt-get install -y nodejs npm
```

`@hurdlegroup/robotjs` nécessite des bibliothèques natives X11.

Exemple Debian/Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y build-essential libx11-dev libxtst-dev libpng++-dev wmctrl yad
```

## Installation

```bash
npm install
```

Installation globale (CLI):

```bash
npm install -g .
```

Configuration via `.env`:

```bash
cp .env.example .env
```

Le chargement des variables est fait via `dotenv`.

## Lancement

```bash
npm start
```

Le serveur affiche:

- l'URL mobile (ex: `http://192.168.x.x:3000`)
- le QR code à scanner
- une page QR: `http://<ip>:3000/qr`

## Variables utiles

- `PORT` (défaut `3000`)
- `ENV_FILE_PATH` (chemin explicite du fichier `.env`)
- `SERVER_HOST` (forcer l'IP/host exposé dans le QR)
- `MOUSE_SPEED` (défaut `1.3`)
- `SCROLL_SPEED` (défaut `0.25`)
- `HTTPS` (`true` pour activer HTTPS)
- `SSL_KEY_PATH` (chemin de la clé privée PEM)
- `SSL_CERT_PATH` (chemin du certificat PEM)
- `TOP_BAR_OFFSET_PX` (offset vertical pour l'overlay QR `yad`, défaut `32`)
- `QR_OVERLAY_SIZE` (taille du QR `yad`, défaut `75`)
- `QR_OVERLAY_MARGIN` (marge droite du QR `yad`, défaut `14`)
- `PREVIEW_WIDTH` (largeur de la preview souris, défaut `128`)
- `PREVIEW_HEIGHT` (hauteur de la preview souris, défaut `84`)
- `PREVIEW_FPS` (fréquence preview, défaut `6`)

Exemple:

```bash
PORT=3000 SERVER_HOST=192.168.1.10 npm start
```

Ou en `.env`:

```env
PORT=3000
SERVER_HOST=192.168.1.10
MOUSE_SPEED=1.3
SCROLL_SPEED=0.25
```

Exemple HTTPS (certificat local):

```bash
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout ./certs/key.pem \
  -out ./certs/cert.pem \
  -days 365 \
  -subj "/CN=localhost"

HTTPS=true SSL_KEY_PATH=./certs/key.pem SSL_CERT_PATH=./certs/cert.pem npm start
```

## Démarrage auto à l'ouverture de session (Linux, systemd user)

Après installation globale (`npm install -g .` ou paquet publié):

```bash
NPM_PREFIX="$(npm prefix -g)"
NODE_BIN_DIR="$(dirname "$(command -v node)")"
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/remote-mouse.service <<EOF
[Unit]
Description=Remote Mouse Server
After=graphical-session.target network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=${NPM_PREFIX}/bin/remote-mouse
Restart=on-failure
RestartSec=2
Environment=NODE_ENV=production
Environment=XDG_RUNTIME_DIR=/run/user/%U
Environment=PATH=${NODE_BIN_DIR}:${NPM_PREFIX}/bin:/usr/local/bin:/usr/bin:/bin
PassEnvironment=DISPLAY WAYLAND_DISPLAY XAUTHORITY DBUS_SESSION_BUS_ADDRESS

[Install]
WantedBy=default.target
EOF

systemctl --user import-environment DISPLAY WAYLAND_DISPLAY XAUTHORITY DBUS_SESSION_BUS_ADDRESS
systemctl --user daemon-reload
systemctl --user enable --now remote-mouse.service
systemctl --user status remote-mouse.service
```

Note: sans ces variables de session graphique, l'overlay QR `yad` peut ne pas apparaître quand le serveur est lancé via `systemd --user`.

Voir les logs:

```bash
journalctl --user -u remote-mouse.service -f
```
# node-mouse
