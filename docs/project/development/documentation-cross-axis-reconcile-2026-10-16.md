# Documentation — réconciliation inter-axes — 2026-10-16

## Objet

Vérifier que les axes autres que `PLAT` reflètent les travaux déjà livrés et
qu'ils ne promettent pas une capacité Wayland non disponible.

## Corrections

- `QUA-001` est clôturée : la CI exécute Jest et les projets Playwright
  Chromium/mobile et conserve les rapports d'échec.
- `REL-004` précise que sa capture réutilisable dépend de la capacité exposée
  par la plateforme; Wayland reste conditionné au backend `PLAT-004u`.
- La roadmap reflète `OPS-014` et `CODE-010` comme derniers jalons terminés.
- Le laboratoire et les validations d'environnement de `PLAT-005` sont
  transférés à `QUA-007`; les identifiants `PLAT-005*` restent inchangés pour
  préserver l'historique.
- Les tâches ouvertes des axes ARCH, PWA, REL, UX et QUA restent ouvertes
  lorsqu'elles nécessitent encore un contrat, un prototype, une plateforme
  réelle ou une décision produit.

## Vérification

Passe documentaire uniquement : aucune modification de code, de CI, de version
ou de workflow VM. `git diff --check` doit rester propre.
