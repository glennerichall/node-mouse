# 08 — QUA — Qualité et livraison

## Résultat visé

Assurer des changements vérifiés, des releases reproductibles et une
compatibilité client/serveur explicitement gérée.

Cet axe couvre la validation et la livraison. Les conventions de programmation,
leur audit et l'uniformisation du code appartiennent à l'[axe CODE](./09-CODE-qualite-et-uniformite.md).

## Plan de travail

- [ ] QUA-001 — exécuter les tests unitaires et Playwright dans la CI.
- [ ] QUA-002 — renforcer progressivement les tests des zones critiques.
- [ ] QUA-003 — couvrir sessions, rôles, proxies et contrats de transport par
  des tests de sécurité.
- [ ] QUA-004 — tester les installations Linux, Windows et macOS, ainsi que la
  PWA sur des appareils réels.
- [ ] QUA-005 — déclarer les versions Node.js prises en charge et automatiser
  l'audit des dépendances.
- [ ] QUA-006 — générer le changelog, les artefacts et checksums, et documenter
  la compatibilité.

La Definition of Done commune est dans la [roadmap](../ROADMAP.md).
