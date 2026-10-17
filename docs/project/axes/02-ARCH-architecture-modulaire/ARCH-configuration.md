# ARCH — Configuration et validation

Ce document regroupe les éléments liés à ce domaine. Les identifiants internes conservent la traçabilité du plan de travail.

## ARCH-018 — Contrats de configuration système et fonctionnelle

**Modules concernés:**

- `server/connection/api/server-info.router.js` pour les snapshots exposés à
  l'interface d'administration;
- `server/services/config/logConfig.js` pour les journaux de démarrage;
- les tests unitaires des snapshots et de la journalisation.

**Critères d'acceptation:**

- le snapshot `config` contient uniquement la configuration fonctionnelle
  persistée, notamment `updateCheck.enabled` et `updateCheck.intervalMin`;
- le snapshot `sysConfig` contient uniquement les paramètres système validés
  au démarrage, notamment les commandes, délais et métadonnées techniques de
  mise à jour;
- les journaux de démarrage nomment séparément les deux espaces de
  configuration et ne fusionnent plus leurs champs homonymes;
- les contrats existants des services de mise à jour et de tâche restent
  compatibles;
- les tests unitaires couvrent l'absence de mélange et la suite complète reste
  verte.

## ARCH-019 — Validation Joi des frontières de configuration

**Modules concernés:**

- `server/services/config/systemConfigSchema.js` et le chargement système au
  démarrage;
- `server/connection/api/configs.js` et le routeur administrateur pour les
  valeurs persistées;
- tests de démarrage et de contrat des écritures API.

**Critères d'acceptation:**

- la configuration système complète est validée par un schéma Joi strict avant
  que le serveur poursuive son démarrage;
- les erreurs de configuration système agrègent les chemins invalides sans
  exposer de secret;
- le payload des écritures de configuration n'accepte aucun champ inconnu;
- chaque valeur persistée est validée par son type, ses bornes et ses options
  avant `setConfig`;
- les valeurs valides continuent d'être converties et les valeurs `null`
  conservent le contrat de réinitialisation;
- la suite complète reste verte.

## ARCH-020 — Guards de validation autonomes

**Modules concernés:**

- `server/connection/api/config-validation.middleware.js` pour les guards
  Joi autonomes;
- `server/connection/api/admin-configs.router.js` pour leur montage explicite;
- tests unitaires du middleware et des helpers de configuration.

**Critères d'acceptation:**

- le routeur ne contient plus la logique de validation Joi;
- le middleware valide chemin, payload, conversion, bornes et réinitialisation;
- les valeurs validées sont transmises au handler via un contrat de requête
  explicite;
- les cas valides, invalides, champs inconnus et `null` sont testés directement;
- la suite complète reste verte.

## ARCH-021 — Contexte de configuration testable

**Modules concernés:**

- `server/connection/api/getManagedConfigContext.js` pour la construction du
  contexte géré;
- `server/connection/api/admin-configs.router.js` pour la composition des
  routes;
- test unitaire du contexte avec services simulés.

**Critères d'acceptation:**

- `getManagedConfigContext` est exportée depuis son propre module;
- la disponibilité VLC et la projection des valeurs fonctionnelles sont
  testées sans démarrer Express;
- le routeur ne contient plus l'assemblage du contexte;
- la lecture de configuration est effectuée une seule fois par construction;
- la suite complète reste verte.
