# Plateformes — PLAT-004n — réconciliation — 2026-10-15
État: terminé

## Validation

Le workflow GitHub Actions valide désormais le helper natif XWayland dans le
job Linux X11. Il installe les dépendances X11/libpng et Xvfb, compile le
helper avec `npm run build:xwayland-overlay`, puis exécute le test IPC avec
Xvfb actif.

Le scénario rapide `HIDE` puis `SHOW` confirme les deux états et leurs ACK;
la commande suivante n’est donc pas perdue dans le tampon stdio.

## Version et commit

Cette clôture porte sur la CI et la documentation; aucun fichier du paquet
n’a été modifié et la version reste `6.20.2`.

Message de commit suggéré:

`ci(plat): validate XWayland overlay IPC on Xvfb`
