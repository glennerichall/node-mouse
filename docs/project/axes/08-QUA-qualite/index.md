# 08 — QUA — Qualité, tests et livraison

## Résultat visé

Assurer des changements vérifiés, des releases reproductibles et une
compatibilité client/serveur explicitement gérée. Cet axe centralise les tests,
la CI, les profils d'environnement et les preuves de compatibilité.

## Plan de travail

- [ ] QUA-001 — exécuter les tests unitaires et Playwright dans la CI.
- [ ] QUA-002 — renforcer progressivement les tests des zones critiques.
- [x] QUA-002a — protéger la baseline de couverture Jest avec des seuils globaux vérifiables.
- [ ] QUA-003 — couvrir sessions, rôles, proxies et contrats de transport par des tests.
- [ ] QUA-004 — tester les installations Linux, Windows et macOS, ainsi que la PWA.
- [ ] QUA-005 — déclarer les versions Node.js prises en charge et automatiser l'audit des dépendances.
- [ ] QUA-006 — générer le changelog, les artefacts et checksums, et documenter la compatibilité.
- [x] PLAT-005a — créer le socle Vagrant du laboratoire.
- [ ] PLAT-005b — ajouter deux profils Linux distincts, X11 et Wayland.
- [x] PLAT-005b1 — ajouter un profil Linux serveur Ubuntu 24.04 reproductible.
- [x] PLAT-005b2 — remplacer l'orchestrateur VM Bash par le cycle de vie Vagrant.
- [x] PLAT-005b2a — stabiliser la navigation du test Playwright partagé.
- [x] PLAT-005b3 — provisionner une VM Ubuntu 24.04 avec une vraie session.
- [x] PLAT-005b3a — valider l'installation et le service dans la VM Xfce/Xorg.
- [x] PLAT-005b3b — rendre la validation de l'overlay X11 déterministe.
- [ ] PLAT-005b4 — provisionner une VM Ubuntu 24.04 GNOME avec une vraie session.
- [ ] PLAT-005b5 — remplacer les suites d'intégration propres aux profils VM.
- [x] PLAT-005b6 — ajouter une validation GitHub Actions sans Vagrant.
- [x] PLAT-005b7 — faire sélectionner au smoke test le service natif seulement.
- [x] PLAT-005b8 — exécuter les suites unitaires et Playwright E2E dans GitHub.
- [x] PLAT-005b8a — corriger le scénario Playwright des préférences de vitesse.
- [ ] PLAT-005c — ajouter un profil Windows 11 avec UEFI, TPM virtuel et média.
- [ ] PLAT-005c1 — définir et provisionner depuis une box Windows 11 locale.
- [x] PLAT-005c1a — déclarer le profil Windows 11 optionnel et son contrat WinRM.
- [ ] PLAT-005c2 — fournir un script de création local de la box Vagrant.
- [ ] PLAT-005d — fournir des tests intégrés relançables dans les invités.
- [x] PLAT-005e — abandonner l'orchestration Vagrant/Packer des machines.
- [x] PLAT-005f — fournir un installateur idempotent pour préparer un poste.
- [x] PLAT-005g — étendre `dev/setup-linux.sh` pour préparer la génération.
- [x] PLAT-005h — suspendre les travaux liés aux machines virtuelles.
- [x] PLAT-005i — retirer le harnais VM et son déploiement SSH devenus obsolètes.
- [x] PLAT-005j — faire préparer automatiquement l'accès `/dev/uinput`.
