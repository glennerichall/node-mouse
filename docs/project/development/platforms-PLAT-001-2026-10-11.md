# PLAT-001 — clôture du parcours Linux — 2026-10-11

Clôturer le parcours Linux après le refactor du setup : documenter le service
`systemd --user` et les différences d'intégration X11/Wayland, puis ajouter une
couverture unitaire du cycle de vie du service sans exécuter de commande sur
l'hôte.

La documentation précise que le service suit le gestionnaire systemd utilisateur
et doit être configuré depuis la session du compte desktop cible. Elle indique
les commandes `systemctl`/`journalctl`, les effets de disable/uninstall, les
différences d'entrée X11/Wayland, le consentement uinput restreint à
`remote-mouse-uinput`, la reconnexion de session requise et les limites de
l'aperçu et de l'overlay QR Wayland.

La nouvelle suite teste le rendu de l'unité, l'installation et l'ordre des
commandes `systemctl`, l'échec du `daemon-reload`, disable/uninstall, restart
asynchrone et la lecture de l'état. Les commandes système sont simulées et les
fichiers sont écrits dans un répertoire temporaire; aucune VM ou modification
du service de l'hôte n'a été utilisée.

Vérifications : `test/unit/linux-daemon-service.test.js`,
`test/unit/setup-command.test.js` et
`test/unit/service-builder-resolution.test.js` passent (40 tests);
`git diff --check` passe. Aucun changement du code d'exécution ou de version
n'était nécessaire.

Message de commit suggéré :

`docs(PLAT-001): document Linux sessions and test user service`
