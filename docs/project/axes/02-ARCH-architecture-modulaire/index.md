# 02 — ARCH — Architecture modulaire

## Résultat visé

Partager les services métier entre API, Socket.IO et futurs transports; garder
les détails de RobotJS et des intégrations externes hors des contrôleurs.

## Plan de travail

- [x] ARCH-002, ARCH-009 à ARCH-017, ARCH-036 à ARCH-042 — souscriptions, orchestration et intégration Socket.IO.
- [x] ARCH-008, ARCH-022 à ARCH-031 — séparation des handlers, routeurs et montages HTTP.
- [x] ARCH-018 à ARCH-021 — contrats de configuration et validation.
- [ ] ARCH-003, ARCH-004 et ARCH-006 — protocole versionné, transport indépendant et tests de contrat.
- [x] ARCH-005, ARCH-032 à ARCH-035, ARCH-043 à ARCH-046 — adaptation et migration du transport.

Les détails sont regroupés dans `ARCH-souscriptions-et-socket.md`,
`ARCH-api-et-routeurs.md`, `ARCH-configuration.md` et
`ARCH-transport-et-protocole.md`.
