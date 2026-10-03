# Sécurité — SEC-010c — 2026-10-03

État: terminé

## Objectif et critères d'acceptation

- Remplacer le chemin orienté action `/api/admin-auth/unlock` par une ressource
  représentant l'élévation temporaire de la session courante.
- Préserver la création protégée par mot de passe, la révocation ciblée et la
  resynchronisation Socket.IO implantées dans SEC-010 et SEC-010b.
- Aligner les noms des handlers et les tests sur la ressource manipulée.

## Décisions et raisons

L'élévation est une ressource singleton subordonnée à la session authentifiée :

- `POST /api/admin-auth/elevation` crée ou renouvelle l'élévation;
- `DELETE /api/admin-auth/elevation` supprime l'élévation de façon idempotente.

Le chemin `/unlock` n'est pas conservé comme alias, car ce contrat n'a pas
encore été publié et une compatibilité transitoire entretiendrait inutilement le
vocabulaire RPC.

## Modifications apportées

- Renommage de `unlockAdmin` en `createAdminElevation`.
- Renommage de `lockAdmin` en `deleteAdminElevation`.
- Mise à jour du routeur Express, du client web et des interceptions Playwright.
- Passage de la version corrective à `6.17.2`.

## Vérifications et résultats

- Test ciblé du contrôleur : 1 suite et 5 tests réussis.
- `npm test` : 84 suites et 303 tests réussis.
- Scénario Playwright ciblé : Chromium desktop et mobile réussis.
- `git diff --check` : aucune erreur.

## Blocages / risques / suite

Aucun. Les anciens journaux conservent le chemin `/unlock` comme trace
historique de l'implantation initiale; SEC-010c documente le contrat final.
