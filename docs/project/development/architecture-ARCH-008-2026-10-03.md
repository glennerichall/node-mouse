# Architecture — ARCH-008 — 2026-10-03

État: terminé

## Objectif et critères d'acceptation

- Uniformiser les déclarations de `client-api.router.js` autour de handlers
  nommés et exportés.
- Réserver les routeurs Express à la composition des verbes, chemins et
  handlers.
- Préserver les chemins, codes et corps de réponses existants.
- Tester directement chaque handler extrait.

## Décisions et raisons

- Les handlers restent dans le même module : leur extraction dans des fichiers
  contrôleurs distincts n'apporterait rien à cette ressource de petite taille.
- Les noms suivent l'action HTTP réalisée : lecture de configuration, création,
  connexion et suppression d'un abonnement client.

## Modifications apportées

- Export de `createClientConfigSubscription`, `connectClientSubscription` et
  `deleteClientSubscription`, en complément de `getClientConfig`.
- Conversion de `clientSubsRouter` en chaînage déclaratif uniforme.
- Ajout de tests directs des filtres SSE, identifiants normalisés, erreurs 404
  et réponses de suppression.
- Passage de la version corrective à `6.17.1`.

## Vérifications et résultats

- Test ciblé : 1 suite et 6 tests réussis.
- `npm test` : 84 suites et 303 tests réussis.
- `git diff --check` : aucune erreur.

## Blocages / risques / suite

Aucun contrat HTTP n'a changé. Les autres routeurs pourront adopter cette même
forme lors de leur prochaine modification, sans refactorisation globale imposée.
