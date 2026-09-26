# Axe — Sécurité et contrôle d'accès

**État:** SEC-001 à SEC-008 terminés; prochaine tâche: corriger l'écart de
durée de grâce des jetons.

## Résultat visé

Garantir que les identités clientes ne reposent pas sur des en-têtes falsifiables,
que les sessions et rôles sont révocables et correctement autorisés, et que les
entrées réseau sont bornées. Le scénario LAN reste la cible immédiate, sans
considérer le LAN comme une frontière de confiance.

## Plan de travail

- [x] Résolution d'adresse cliente et proxies de confiance explicites.
- [x] Orchestration de sécurité commune HTTP/Socket.IO.
- [x] Secret de session robuste et dépendances de production examinées.
- [x] Séparer jeton d'association et session d'appareil; rôles controller/admin.
- [x] Limites de taille/débit, vérification Origin/CSRF et expurgation des logs.
- [x] **SEC-008:** lister les appareils associés et leurs métadonnées.
- [x] **SEC-008:** révoquer une session ou toutes les sessions via API admin.
- [x] **SEC-008:** conserver un historique local des associations/révocations.
- [ ] Corriger l'écart de durée de grâce documentée/configurée des jetons.

## Critères d'acceptation

- Aucun en-tête forgé ne confère un accès privilégié.
- Les contrôles d'accès HTTP et Socket.IO sont cohérents.
- La révocation coupe immédiatement l'accès concerné.
- Les limites et refus n'exposent pas de secrets; les tests anti-régression passent.

## Historique

Voir [journal SEC, lot A](../development/security-lot-a.md). Toute nouvelle
itération est consignée dans un nouveau fichier du journal, sans réécrire les
itérations clôturées.
