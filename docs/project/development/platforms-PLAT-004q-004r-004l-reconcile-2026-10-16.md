# Plateformes — PLAT-004q, PLAT-004r et PLAT-004l — réconciliation — 2026-10-16

## Objet

Réconcilier l'axe des plateformes avec l'implémentation déjà livrée du helper
QR natif X11/XWayland et de son protocole acquitté.

## Vérification

- `PLAT-004l` utilise le helper natif isolé et ne dépend plus de YAD pour
  l'overlay Linux;
- `PLAT-004q` corrèle les commandes avec un identifiant, attend l'ACK et ferme
  le helper après un délai borné;
- `PLAT-004r` garde l'initialisation HTTP indépendante de l'ACK initial;
- les tests IPC XWayland sont exécutés dans le job GitHub Actions Linux X11,
  avec compilation du helper, Xvfb et vérification des séquences `HIDE`/`SHOW`;
- la suite locale reste verte : 136 suites, 524 tests réussis et 2 ignorés.

Les validations nécessitant une VM restent suspendues. La capture PipeWire et
la validation Wayland complète de `PLAT-004` restent à réaliser.

## Version et suite

Cette réconciliation est documentaire; la version reste `6.20.3`. La prochaine
évolution fonctionnelle de l'axe est `PLAT-004v`, le helper natif qui portera la
capture PipeWire avant l'achèvement de `PLAT-004d`.

Message de commit suggéré:

`docs(plat): reconcile QR overlay milestones`
