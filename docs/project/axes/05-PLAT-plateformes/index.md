# 05 — PLAT — Plateformes et intégrations système

## Résultat visé

Fournir une installation fiable et des capacités clairement détectées sur
Linux, Windows et à terme macOS, avec des intégrations système extensibles.

## Plan de travail

- [x] PLAT-001 — clôturer le parcours Linux après les sous-tâches setup.
- [x] PLAT-001a — rendre l'installation uinput autonome et idempotente.
- [x] PLAT-001b — rattacher la migration privilégiée uinput au `postinstall` déclenché par la mise.
- [x] PLAT-001c — distribuer les composants natifs Linux sous forme d'artéfacts précompilés dans le paquet.
- [x] PLAT-001e — définir et valider le packaging de publication npm à partir d'un tarball.
- [x] PLAT-001f — ajouter une compilation locale de secours au `postinstall` uniquement lorsqu'aucun prébuild correspondant.
- [x] PLAT-001g — automatiser la préparation de publication via le hook npm `prepublishOnly`.
- [x] PLAT-001d — simplifier l'installation publique autour de `npm install -g @velor/remote-mouse`, puis d'une commande.
- [x] PLAT-001h — refactorer `remote-mouse setup` en orchestration générique appuyée sur une stratégie sélectionnée selon.
- [x] PLAT-001i — faire utiliser par `npm run dev` les artefacts natifs compilés depuis.
- [x] PLAT-001j — corriger l'inclusion des prébuilds Linux générés dans le tarball npm lorsque ces.
- [x] PLAT-001k — préserver l'activation du service `systemd --user` après une mise à jour.
- [x] PLAT-002 — tester installation, service, mise à jour et désinstallation Windows.
- [x] PLAT-002c — rendre le script `test:install` indépendant de la syntaxe d'affectation d'environnement POSIX afin.
- [x] PLAT-002a — ajouter des tests automatisés de la stratégie de setup Windows.
- [x] PLAT-002b — exécuter la mise à jour npm automatique sans syntaxe shell POSIX.
- [x] PLAT-002d — maintenir la commande `/TR` du service Windows sous la limite de `schtasks`.
- [x] PLAT-002e — étendre le smoke test Windows pour interroger explicitement la tâche planifiée après.
- [x] PLAT-002f — exécuter dans le job Windows une réinstallation du tarball npm courant après.
- [ ] PLAT-003 — créer l'installation macOS et guider les permissions Accessibilité.
- [ ] PLAT-004 — intégrer le contrôle et la capture Wayland selon le [plan dédié].
- [x] PLAT-004a — détecter la capture RobotJS indisponible sous Wayland et neutraliser la prévisualisation.
- [x] PLAT-004g — utiliser un périphérique virtuel `uinput` comme stratégie d'entrée Wayland par défaut, conserver.
- [x] PLAT-004h — rendre l'overlay QR YAD utilisable sous Wayland en l'exécutant explicitement par XWayland.
- [x] PLAT-004i — empêcher YAD de rogner le QR lorsque la fenêtre a exactement.
- [x] PLAT-004m — absorber `EPIPE` et les erreurs de stdin du helper XWayland lors.
- [x] PLAT-004n — garantir le traitement ordonné de commandes IPC rapprochées du helper QR XWayland.
- [x] PLAT-004o — rendre atomiques les opérations de visibilité de l'overlay QR et faire qu'une.
- [x] PLAT-004p — détecter les écritures refusées par le canal du helper QR, remplacer son.
- [ ] PLAT-004q — rendre les commandes du helper QR acquittées avec un identifiant de requête.
- [ ] PLAT-004r — ne pas retarder l'initialisation HTTP par l'attente de l'ACK initial du helper.
- [x] PLAT-004s — ne masquer l'overlay QR que si la position réelle du pointeur est.
- [x] PLAT-004t — éviter l'accumulation des bascules QR en attente en coalesçant les demandes successives.
- [x] PLAT-004j — retirer le suivi de souris utilisé par le masquage automatique du QR.
- [ ] PLAT-004l — remplacer l’overlay QR YAD par un helper natif X11/XWayland spécialisé et isolé.
- [ ] PLAT-005 — fournir dans `dev/` un laboratoire de développement et de validation reproductible, exécuté.
- [x] PLAT-005a — créer le socle Vagrant du laboratoire.
- [ ] PLAT-005b — ajouter deux profils Linux distincts, X11 et Wayland, avec un bootstrap idempotent.
- [ ] PLAT-005c — ajouter un profil Windows 11 avec UEFI, TPM virtuel et média d'installation.
- [ ] PLAT-005d — fournir des tests intégrés relançables dans les invités. Le parcours d'installation doit.
- [x] PLAT-005e — abandonner l'orchestration Vagrant/Packer des machines de développement.
- [x] PLAT-005f — fournir un installateur idempotent pour préparer un poste de développement Linux Ubuntu/Debian.
- [x] PLAT-005g — étendre `dev/setup-linux.sh` pour préparer la génération des prébuilds projet x64 et ARM64.
- [x] PLAT-005i — retirer le harnais VM et son déploiement SSH devenus obsolètes après l'ajout.
- [x] PLAT-005j — faire préparer automatiquement l'accès `/dev/uinput` par `dev/setup-linux.sh` lorsqu'il est lancé.
- [ ] PLAT-006 — renforcer les diagnostics VLC, navigateurs et Samsung TV.
- [x] PLAT-006g — exposer dans les informations serveur un diagnostic stable des intégrations VLC, navigateurs.
- [x] PLAT-006a — n'afficher dans la télécommande navigateur que les navigateurs réellement installés sur l'hôte.
- [x] PLAT-006b — séparer la gestion des fenêtres X11 et Wayland pour l'action navigateur.
- [x] PLAT-006c — fournir une extension GNOME minimale exposant une méthode D-Bus ciblée pour rechercher.
- [x] PLAT-006d — vérifier dans GitHub Actions le bundle GNOME et l'exécution GJS de l'extension.
- [x] PLAT-006e — préserver le contexte du compositeur GNOME dans le service `systemd --user` après.
- [x] PLAT-006f — réinstaller et réactiver l'extension GNOME de focus pendant le `postinstall` d'une mise.
- [ ] PLAT-007 — définir un contrat d'adaptateur avant de multiplier les intégrations.
