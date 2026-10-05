# Plateformes — PLAT-005b2 — 2026-10-04

État: terminé

## Objectif et critères d'acceptation

Simplifier le laboratoire autour des commandes Vagrant natives, confier les
assertions aux runners JavaScript existants et vérifier automatiquement la
chaîne navigateur → Socket.IO → contrôleurs d'entrée → uinput.

## Décisions et raisons

Le `Vagrantfile` est désormais l'unique définition des machines : la commande
`dev/vm`, le catalogue YAML et les tests Bash ont été retirés. Les quelques
scripts Bash restants sont du provisionnement système, domaine dans lequel ni
Jest ni Playwright ne remplacent correctement le gestionnaire de paquets ou
systemd.

Jest orchestre les assertions d'installation et de mise à jour. Playwright
charge le client livré et crée une vraie session HTTP avant d'émettre les
événements `mouse:move`, `mouse:click`, `keyboard:text` et `keyboard:key`.
Le registrar Socket.IO demeure mince : le test traverse les services souris et
clavier existants sans dupliquer leur logique. `evtest` observe finalement les
événements noyau des périphériques `Remote Mouse Virtual Mouse` et
`Remote Mouse Virtual Keyboard`.

## Modifications apportées

- machine Ubuntu épinglée déclarée directement dans le `Vagrantfile`;
- provisionnement idempotent de l'installation Wayland/uinput et d'`evtest`;
- suite Jest VM pour version CLI, service, santé HTTP et conservation intégrale
  de la configuration lors d'une réinstallation;
- suite Playwright VM et capture simultanée des périphériques uinput;
- scripts npm `test:integration`, `test:vm` et `test:all`;
- documentation du cycle Vagrant natif et séparation explicite des validations
  visuelles X11/Wayland.

## Vérifications et résultats

- `vagrant validate` : succès avec Vagrant 2.4.9 et vagrant-libvirt 0.12.2;
- `npm test` : 93 suites, 329 tests réussis;
- `npm run test:e2e` : 32 tests Playwright réussis;
- Jest VM : 3 tests réussis, incluant réinstallation sans changement de
  configuration;
- parcours navigateur/uinput : `REL_X`, `REL_Y`, `BTN_LEFT`, `KEY_A` et
  `KEY_ENTER` observés dans l'invité Ubuntu 24.04.

## Blocages / risques / suite

Le profil est volontairement sans bureau : il valide l'entrée Wayland/uinput,
mais pas l'overlay QR, l'aperçu ni le rendu d'une session graphique. Ces
contrôles restent à couvrir dans les profils X11 et Wayland de `PLAT-005b`.
L'avertissement `libvirt_ip_command` de vagrant-libvirt 0.12.2 demeure non
bloquant.
