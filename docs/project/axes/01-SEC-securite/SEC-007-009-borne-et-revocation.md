# SEC-007-009 — Bornes réseau, appareils et révocation

Les contrôles d'entrée et les droits de session sont traités ensemble, car ils
protègent la même frontière HTTP/Socket.IO.

## SEC-007 — Limites des entrées et journaux

- Les messages entrants sont bornés en taille et en débit.
- Origin et CSRF sont vérifiés pour les écritures HTTP.
- Les jetons, cookies et secrets sont expurgés des journaux.
- Aucun en-tête forgé ne confère un accès privilégié.
- Les contrôles d'accès HTTP et Socket.IO restent cohérents.

## SEC-008a à SEC-008c — Appareils associés et révocation

- Les appareils associés et leurs métadonnées sont listés.
- Une session ou toutes les sessions peuvent être révoquées par l'API admin.
- L'historique local des associations et révocations est conservé.

## SEC-009 — Séparation des lectures controller/admin

Les lectures nécessaires à la télécommande sont séparées des ressources
administrateur. Une session `controller` issue du QR peut charger son état sans
recevoir de droits d'écriture ni de données sensibles.

## Critères de validation

La révocation coupe immédiatement l'accès concerné. Les limites et refus
n'exposent pas de secrets et les tests anti-régression restent verts.
