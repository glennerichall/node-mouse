# PLAT-002f — réinstallation du paquet Windows

## État

Implémenté, validation GitHub Actions Windows en attente.

## Décision

Le job Windows exporte le tarball npm installé vers le smoke test. Celui-ci
désactive la tâche, réinstalle le tarball globalement, recrée le service et
vérifie que `.env`, la base SQLite, la santé HTTP et la version restent valides.
Le nettoyage existant désinstalle ensuite la tâche planifiée.

## Vérification

- `npm run test:install` : 2 suites, 24 tests passés.
- Vérification syntaxique du smoke test et `git diff --check` : OK.
- Reste à confirmer sur le runner Windows GitHub Actions.
