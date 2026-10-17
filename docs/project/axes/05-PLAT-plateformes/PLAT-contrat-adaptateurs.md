# PLAT — Contrats d’adaptateurs et plateformes restantes

Ce document regroupe les éléments liés à ce domaine. Les identifiants internes conservent la traçabilité du plan de travail.

## PLAT-007 — définir un contrat d'adaptateur avant de multiplier

**État:** Terminé.

  intégrations.
  Le contrat sépare la façade de capacités (`app.resolve`, actions de fenêtre,
  ouverture d'URL, overlay et bureau/capture optionnels) des implémentations
  propres à Linux, Windows, macOS et Wayland. Chaque capacité expose un état
  explicite et une raison d'indisponibilité actionnable; l'adaptateur nul
  conserve le serveur opérationnel. La capture et le streaming du preview sont
  des capacités séparées et ne choisissent ni libei, ni PipeWire, ni WebRTC.
Pour chaque tâche, lister les versions OS testées, prérequis et limitations
observées; distinguer capacités simulées et vérifiées sur machine réelle.
Le laboratoire de développement, les profils VM, les smoke tests et les
validations de compatibilité sont décrits dans l'axe [QUA — Qualité, tests et
livraison](../08-QUA-qualite/index.md), sous `QUA-007` et ses sous-tâches historiques
`PLAT-005*`. Cet axe PLAT conserve uniquement les capacités et contraintes
système à vérifier par ces tests.
- Ubuntu 26.04 ne fournit plus de session Ubuntu/GNOME sur Xorg; XWayland ne
  donne pas à RobotJS le contrôle global ni la capture du bureau Wayland.
- Jusqu'à PLAT-004, le support complet reste assuré sous une vraie session X11.
  Sur Ubuntu 26.04, cela exige un environnement de bureau proposant encore une
  session Xorg, par exemple Xfce, MATE, KDE/X11 ou i3.
- Le bureau Ubuntu/GNOME Wayland reste utilisable sans prévisualisation, mais le
  contrôle souris/clavier n'est pas déclaré pris en charge avant PLAT-004.
