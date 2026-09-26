# Axe — Installation, mises à jour et exploitation

## Résultat visé

Permettre l'installation reproductible, les mises à jour récupérables, et le
diagnostic/sauvegarde sans divulgation de secrets.

## Plan de travail

- [ ] Rendre les installateurs idempotents et documenter le mode non interactif.
- [ ] Générer les secrets à l'installation et valider les prérequis.
- [ ] Vérifier l'origine des artefacts; séparer téléchargement et activation.
- [ ] Prévoir retour arrière et préserver configuration/base pendant la mise à jour.
- [ ] Ajouter export, sauvegarde et restauration SQLite.
- [ ] Produire une archive de diagnostic expurgée; rotation/rétention des logs.
- [ ] Documenter récupération après corruption de base ou perte de secret.
