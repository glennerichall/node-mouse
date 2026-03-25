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
- `SERVER_HOST` (forcer l'IP/host exposé dans le QR)
- `MOUSE_SPEED` (défaut `1.3`)
- `SCROLL_SPEED` (défaut `0.25`)
- `HTTPS` (`true` pour activer HTTPS)
- `SSL_KEY_PATH` (chemin de la clé privée PEM)
- `SSL_CERT_PATH` (chemin du certificat PEM)

Exemple:

```bash
PORT=3000 SERVER_HOST=192.168.1.10 npm start
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

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now remote-mouse.service
systemctl --user status remote-mouse.service
```

Voir les logs:

```bash
journalctl --user -u remote-mouse.service -f
```
# node-mouse
