# Sécurité — SEC-010b — 2026-10-03

État: terminé

## Objectif et critères d'acceptation

- Remplacer le formulaire « Déverrouiller » par « Verrouiller » pour une
  session d'appareil temporairement élevée.
- Retirer immédiatement l'élévation de cette session sans modifier les autres
  appareils, puis resynchroniser HTTP et Socket.IO.
- Permettre d'afficher ou masquer le mot de passe sans modifier ni persister sa
  valeur; le conserver masqué par défaut avec un contrôle accessible.
- Couvrir le service, l'API, l'isolation des sockets et l'interface desktop et
  mobile par des tests anti-régression.

## Décisions et raisons

- `DELETE /api/admin-auth/unlock` représente la suppression de l'élévation
  temporaire existante sans introduire une seconde ressource d'authentification.
- Les sockets de la seule session concernée sont déconnectées après la
  révocation. Leur reconnexion repasse par l'authentification commune et évite
  de conserver un rôle administrateur capturé lors de la connexion initiale.
- L'administration loopback n'affiche pas « Verrouiller » : elle ne dépend pas
  d'une élévation de session révocable.
- Les réponses `/api/` ne sont plus placées dans le cache du service worker,
  afin qu'un ancien état d'autorisation ne puisse pas être réaffiché.

## Modifications apportées

- Ajout de `revokeElevation()` au service des sessions d'appareil.
- Ajout du reverrouillage HTTP et déconnexion ciblée des sockets partageant
  l'identifiant de la session courante.
- Exposition de `adminRelockAvailable` dans la configuration cliente.
- Ajout des contrôles « Verrouiller » et « Afficher/Masquer le mot de passe »,
  de leurs états accessibles et de leurs traductions.
- Documentation du comportement dans le README.
- Passage de la version mineure à `6.17.0` pour cette nouvelle capacité.

## Vérifications et résultats

- Tests ciblés : 3 suites et 12 tests réussis.
- `npm test` : 84 suites et 300 tests réussis.
- `npm run test:e2e` : 24 scénarios Chromium desktop/mobile réussis.
- `git diff --check` : aucune erreur.

## Blocages / risques / suite

- Le mot de passe administrateur doit toujours être transmis sous HTTPS hors
  d'un environnement local maîtrisé.
- La prochaine itération de sécurité est `SEC-011`, consacrée à la durée de
  grâce des jetons d'entrée.
