# PLAT-006d1 — 2026-10-14

## Objectif

Corriger l’échec du job GitHub Actions GNOME qui ne trouvait pas
`gnome-extensions`.

## Correction

Le job installait `gnome-shell-common`, qui ne contient pas la commande CLI.
Il installe désormais `gnome-shell` avec `--no-install-recommends`; ce paquet
fournit `/usr/bin/gnome-extensions` sans installer les recommandations d’un
bureau complet.

## Vérification

- La source du paquet Ubuntu confirme que `/usr/bin/gnome-extensions` appartient
  à `gnome-shell`.
- `git diff --check` — réussi.
- La validation finale doit être effectuée par le job GitHub Actions.
