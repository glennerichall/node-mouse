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

Commit assiste par Codex:

```bash
npm run commit:codex
```

Le script:
- demande a Codex un `bump` semver (`patch` | `minor` | `major`) et un message de commit
- met a jour la version via `npm version --no-git-tag-version`
- stage toutes les modifications
- cree le commit git

Le serveur affiche:

- l'URL mobile avec point d'entrée random (ex: `http://192.168.x.x:3000/AbCdEf...`)
- le QR code à scanner
- une page QR: `http://<ip>:3000/qr`

## Variables utiles

- `PORT` (défaut `3000`)
- `SERVER_HOST` (forcer l'IP/host exposé dans le QR)
- `CONFIG_DIR` (répertoire de config principal, défaut `~/.config/remote-mouse`)
- `ENV_FILE_PATH` (chemin explicite du fichier `.env`)
- `PERSISTENCE_DB_PATH` (chemin du fichier SQLite de persistence)
- `HTTPS` (`true` pour activer HTTPS)
- `SSL_KEY_PATH` (chemin de la clé privée PEM)
- `SSL_CERT_PATH` (chemin du certificat PEM)
- `ENTRY_PATH_ENABLED` (point d'entrée aléatoire, défaut `true`)
- `ENTRY_PATH_FIXED` (chemin fixe optionnel, vide par défaut)
- `ENTRY_PATH_TOKEN_LENGTH` (longueur token, défaut `24`)
- `ENTRY_PATH_ROTATE_INTERVAL_MIN` (rotation token en minutes, défaut `60`)
- `ENTRY_PATH_GRACE_MIN` (grâce anciens tokens en minutes, défaut `120`)
- `ADMIN_ACTIONS_ENABLED` (autorise les actions admin depuis client, défaut `true`)
- `SERVICE_NAME` (service systemd --user à redémarrer, défaut `remote-mouse.service`)
- `UPDATE_CHECK_COMMAND` (commande shell de vérification update, prioritaire si définie)
- `UPDATE_CHECK_TIMEOUT_SEC` (timeout de `UPDATE_CHECK_COMMAND`, défaut `20`)
- `UPDATE_CHECK_INTERVAL_MIN` (intervalle de vérif en minutes, défaut `360`)
- `UPDATE_CHECK_PACKAGE` (package npm cible pour update check, défaut nom local)
- `UPDATE_CHECK_CURRENT_VERSION` (version courante forcée, défaut version locale)
- `UPDATE_INSTALL_COMMAND` (commande shell d'installation update, prioritaire si définie)
- `UPDATE_INSTALL_TIMEOUT_SEC` (timeout installation update, défaut `600`)

Configs persistées en SQLite:
- Le répertoire de config par défaut est `~/.config/remote-mouse`.
- Par défaut, le serveur charge le fichier d'environnement `CONFIG_DIR/.env`.
- La base SQLite est aussi stockée dans `CONFIG_DIR`, sauf override explicite avec `PERSISTENCE_DB_PATH`.
- `getStartupConfigSnapshot()` ne contient plus que les paramètres statiques issus de l'environnement.
- `getConfig()` fusionne les paramètres statiques avec les réglages persistés en base.

Fallback install update:
- Si `UPDATE_CHECK_COMMAND` est défini, il est exécuté pour déterminer s'il y a une mise à jour.
- Si `UPDATE_CHECK_COMMAND` est vide, fallback automatique vers le check npm.
- Si `UPDATE_INSTALL_COMMAND` est vide, fallback automatique vers:
  `npm update -g <UPDATE_CHECK_PACKAGE> --force`.

Protocoles supportés pour `UPDATE_CHECK_COMMAND`:
- JSON: `{"hasUpdate":true,"key":"...","title":"...","message":"...","ttlMs":8000}`
- Texte `1|true|yes|update|has_update` => update détectée
- Texte `0|false|no|none` => pas d'update
- tout autre texte non vide => update détectée (message = texte retourné)

Exemple:

```bash
PORT=3000 SERVER_HOST=192.168.1.10 npm start
```

Ou en `.env`:

```env
PORT=3000
SERVER_HOST=192.168.1.10
CONFIG_DIR=~/.config/remote-mouse
```

Contrôle TV Samsung:
- Une nouvelle section "Samsung TV" apparaît dans le client mobile.
- Actions disponibles: `on`, `off`, `vol+`, `vol-`, `source`, `enter`, `pc`.
- Les commandes Socket.IO côté client utilisent le préfixe `samsung:` (`samsung:on`, `samsung:off`, etc.).
- `on` utilise Wake-on-LAN, donc la TV doit l'accepter sur le réseau local.
- L'intégration utilise maintenant explicitement le package npm `samsung-tv-remote`.
- La configuration détaillée Samsung est désormais persistée en SQLite.
- Beaucoup de modèles Samsung acceptent mieux `KEY_POWER` que `KEY_POWEROFF` pour l'extinction.

Avec token d'entrée fixe (si tu veux éviter la rotation):

```env
ENTRY_PATH_ENABLED=true
ENTRY_PATH_FIXED=remote-control-secret
```

Note securite:
- Si `ENTRY_PATH_ENABLED=true`, l'application est accessible via l'URL d'entrée `/<token>`.

Persistance du token:
- Par défaut, le token d'entrée aléatoire et son timestamp de rotation sont sauvegardés sur disque.
- Après redémarrage du serveur, le même token est réutilisé et la rotation conserve son échéance.

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
