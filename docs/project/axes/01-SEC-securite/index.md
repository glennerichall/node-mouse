# 01 — SEC — Sécurité et contrôle d'accès

**État:** SEC-001 à SEC-011 et SEC-010d terminés; aucune tâche de sécurité planifiée.

## Résultat visé

Garantir que les identités clientes ne reposent pas sur des en-têtes falsifiables,
que les sessions et rôles sont révocables et correctement autorisés, et que les
entrées réseau sont bornées. Le scénario LAN reste la cible immédiate, sans
considérer le LAN comme une frontière de confiance.

## Plan de travail

- [x] SEC-001 — résolution d'adresse cliente et proxies de confiance explicites.
- [x] SEC-002 — orchestration de sécurité commune HTTP/Socket.IO.
- [x] SEC-003 — garantir un secret de session robuste.
- [x] SEC-004 — examiner et mettre à jour les dépendances de production.
- [x] SEC-005 — séparer jeton d'association et session d'appareil.
- [x] SEC-006 — introduire les rôles controller/admin.
- [x] SEC-007 — limiter taille/débit, vérifier Origin/CSRF et expurger les logs.
