# 04 — UX — Expérience utilisateur

## Résultat visé

Rendre l'association, le contrôle, le diagnostic et la personnalisation
compréhensibles sur mobile et desktop.

## Plan de travail

- [ ] UX-001 — afficher les appareils associés, rôle et dernière activité.
- [ ] UX-002 — permettre révocation et réassociation dans l'interface.
- [ ] UX-003 — améliorer les diagnostics de connexion et afficher le transport.
- [ ] UX-004 — sélection multi-écrans.
- [ ] UX-005 — profils de contrôle.
- [x] UX-006 — permettre à chaque client de régler localement la vitesse et
  l'accélération du pointeur sur son appareil, indépendamment du système du
  serveur; persister les préférences dans le navigateur, offrir des valeurs par
  défaut utilisables et une remise à zéro, appliquer vitesse et courbe avant
  l'envoi des deltas, puis signaler au serveur les deltas déjà ajustés afin
  d'éviter un second multiplicateur tout en conservant la compatibilité avec les
  anciens clients utilisant `input.mouseSpeed`.
- [ ] Ajouter retour haptique et commandes configurables.
- [ ] Tester navigation clavier, lecteurs d'écran, contrastes et traductions.

UX-001/002 dépendent de SEC-008; ne pas implémenter une interface de gestion
des appareils avant que son contrat sécurité soit défini.

UX-006 dépend du contrat de commandes existant. Si son indicateur de deltas
ajustés devient un champ durable du protocole, le documenter et le versionner
dans `ARCH-003` sans rendre la préférence dépendante du compte serveur.
