# Sécurité — SEC-010e — 2026-10-04

État: terminé

## Objectif et critères d'acceptation

Distinguer une administration verrouillée d'une fonction désactivée par la
configuration, améliorer la saisie du mot de passe et placer réellement les
commandes QR hors du parcours administratif.

## Décisions et raisons

`adminActionsEnabled` représentait à la fois la configuration du serveur et le
rôle effectif de la session. L'API expose maintenant
`adminActionsConfigured` séparément de `adminUnlocked`, tandis que
`adminActionsEnabled` demeure l'autorisation effective utilisée pour désactiver
les boutons administratifs.

Les événements `qr:*` ne sont plus enregistrés par le registrar admin. Ils ont
leur propre registrar et leur propre façade `qrActions`. Les anciens événements
`admin:*` restent dans le registrar protégé pour assurer la transition d'un
client déjà chargé pendant une mise à jour.

## Modifications apportées

- Messages distincts « administration verrouillée » et « actions admin
  désactivées » dans les neuf langues.
- Champ du mot de passe porté à 46 px avec une taille de texte de 1 rem.
- Ajout de `server/remotes/qr/registrar.js` et de la façade `qrActions`.
- Raccordement de la commande CLI QR à `qrActions`.
- Test unitaire du registrar QR et scénarios visuels des deux messages.
- Passage correctif de la version `6.18.3` à `6.18.4`.

## Vérifications et résultats

- Tests ciblés : 4 suites et 27 tests réussis.
- Tests Playwright ciblés : 6 scénarios desktop/mobile réussis.
- Suite complète : 90 suites et 321 tests réussis.
- `git diff --check` : aucune erreur.

## Blocages / risques / suite

Les constantes pub/sub historiques conservent le segment `ADMIN` pour préserver
la lecture des événements déjà persistés. Elles pourront être migrées avec une
stratégie explicite si leur vocabulaire devient visible hors du diagnostic.
