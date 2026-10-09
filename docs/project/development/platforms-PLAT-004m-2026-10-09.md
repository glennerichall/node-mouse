# Plateformes — PLAT-004m — 2026-10-09

État: terminé

## Problème

Lors d'une mise à jour lancée depuis l'interface admin, `npm update` se
terminait avec succès, puis systemd arrêtait le processus pour appliquer la
mise à jour. Pendant le nettoyage, la fermeture du helper QR XWayland écrivait
`CLOSE` sur son flux stdin après la fermeture de l'autre extrémité. L'événement
`EPIPE` du flux n'était pas géré et Node.js plantait au lieu de terminer
proprement.

## Cause et décision

Le client XWayland vérifiait uniquement `stdin.writable` avant l'écriture. Cet
état ne garantit pas que le processus helper écoute encore; une fermeture
concurrente peut donc produire `EPIPE`. Comme pour le helper Wayland, les
erreurs du flux doivent être gérées explicitement. `EPIPE` pendant l'arrêt est
attendu; le helper est marqué fermé et terminé au besoin. Les autres erreurs
sont relayées au gestionnaire d'erreur déjà installé sur le processus.

## Modifications apportées

- Ajout d'un gestionnaire d'erreur pour le stdin du helper XWayland.
- Protection contre une exception synchrone lors de l'écriture et arrêt de
  secours du helper quand le pipe est cassé.
- Ajout d'un test anti-régression qui simule `EPIPE` au moment de `close()`.

## Vérifications et résultats

- Le test ciblé échouait avant le correctif avec une erreur non gérée `EPIPE`;
  il passe après le correctif.
- Tests ciblés XWayland et adaptateurs QR: 2 suites, 6 tests réussis.
- Suite Jest complète: 116 suites, 404 tests réussis.
- Contrôle de style sur 461 modules, contrôle de version et `git diff --check`
  réussis.
- Le redémarrage sur la machine Pi n'a pas été exécuté depuis cet environnement.

## Suite

Aucun changement requis au mécanisme d'installation lui-même. Vérifier sur la
machine concernée qu'une prochaine mise à jour redémarre le service sans erreur
`EPIPE`.
