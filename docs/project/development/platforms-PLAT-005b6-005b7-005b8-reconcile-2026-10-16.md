# Plateformes — PLAT-005b6, PLAT-005b7 et PLAT-005b8 — réconciliation — 2026-10-16

## Objet

Réconcilier l'axe avec les validations GitHub Actions déjà présentes, sans
réactiver les profils Vagrant ou les autres travaux VM suspendus.

## Vérification

- `PLAT-005b6` : le workflow `platform-installation.yml` possède des jobs
  séparés pour installation et démarrage sur Ubuntu X11, Ubuntu Wayland
  headless et Windows; chaque job installe le tarball npm local et vérifie le
  démarrage via `run-host-smoke.mjs`;
- `PLAT-005b7` : `run-host-smoke.mjs` interroge `systemctl --user show-environment`
  et n'active la validation du service natif que lorsque la capacité est
  réellement disponible; sinon le contrôle est signalé comme ignoré et le
  démarrage direct est conservé;
- `PLAT-005b8` : le workflow possède un job Playwright X11, installe Chromium
  et ses dépendances, isole les ports et répertoires de rapports, puis publie
  les rapports en artefact même après un échec;
- aucune tâche ne démarre, ne provisionne ou ne valide une VM.

Les validations réelles dépendent de l'exécution GitHub Actions; cette
réconciliation vérifie le contrat des jobs et des scripts versionnés.

## Version et suite

Itération documentaire : la version reste `6.20.3`. La prochaine évolution
fonctionnelle de l'axe PLAT est à choisir parmi `PLAT-003` macOS, `PLAT-006`
restant ou la validation réelle de `PLAT-004f`; les travaux VM restent hors
ordre actif.

Message de commit suggéré:

`docs(plat): reconcile non-VM CI validation`
