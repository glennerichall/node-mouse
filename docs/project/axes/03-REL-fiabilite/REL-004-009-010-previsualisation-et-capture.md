# REL-004-009-010 — Prévisualisation et capture

Ce document regroupe les éléments liés à ce domaine. Les identifiants internes conservent la traçabilité du plan de travail.

## REL-004 — prévisualisation adaptative

  à l'écran disponible, respecter la cadence configurée jusqu'à 30 FPS et
  conserver une seule frame en vol lorsque le transport est saturé, avec une
  implantation de capture réutilisable par les environnements qui exposent
  cette capacité. X11 reste couvert; Wayland/XWayland ne devient éligible
  qu'après disponibilité d'un backend de capture conforme à `PLAT-004u`.

## REL-009 — qualité de prévisualisation

  fréquence et compression.

## REL-010 — cycle de capture

  éviter les frames périmées.
