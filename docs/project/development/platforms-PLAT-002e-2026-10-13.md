# PLAT-002e — validation du cycle de service Windows

## État

Implémenté, validation du runner Windows GitHub Actions en attente.

## Modifications

Le smoke test d'installation interroge maintenant la tâche `remote-mouse`
après `setup --yes`, vérifie son état lorsqu'il est fourni par `schtasks`, puis
contrôle après `service uninstall` que la tâche n'existe plus. Le nettoyage est
conservé lorsque les assertions de santé ou de CLI échouent.

## Vérification

- `npm run test:install` : 2 suites, 24 tests passés.
- Vérification syntaxique du smoke test et `git diff --check` : OK.
- Reste à confirmer sur le runner Windows réel.
