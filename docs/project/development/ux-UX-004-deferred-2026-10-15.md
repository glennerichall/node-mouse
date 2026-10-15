# Expérience utilisateur — UX-004 — 2026-10-15

État: reporté

## Décision

Découper la sélection multi-écrans en trois sous-itérations, puis suspendre
leur réalisation. Le scénario central de Remote Mouse reste la fourniture
d'une souris pour un HTPC à écran unique; le multi-écran augmente la surface
de détection, de coordonnées et de validation sans répondre au besoin courant.

## Découpage conservé

- `UX-004a` — contrat `screens[]` et détection par plateforme;
- `UX-004b` — sélection et persistance dans le client;
- `UX-004c` — application au pointeur, à l'aperçu et aux overlays, avec
  changements de configuration et tests complets.

## Modifications apportées

- `UX-004` est marqué explicitement en attente dans l'axe UX;
- les trois sous-itérations et leurs critères sont ajoutés à l'axe;
- l'ordre global de livraison privilégie `UX-005` et reporte `UX-004`.

## Version et clôture

- version conservée à `6.20.2` : documentation et roadmap uniquement;
- `git diff --check` à exécuter après modification;
- message de commit suggéré : `docs(roadmap): defer multi-screen support`.
