# PLAT-006a — disponibilité réelle des navigateurs

## Objectif

La télécommande navigateur doit recevoir uniquement les navigateurs réellement
installés sur l'hôte. La présence de la commande `flatpak` ne suffit pas à
établir que l'application Brave est installée.

## Décision et modification

Le résolveur Linux vérifie désormais l'identifiant Flatpak avec `flatpak info`
avant de retourner une application résolue. Une application Flatpak absente
reste donc exclue de `listBrowsersOnHost`, tandis que les navigateurs disposant
d'une commande native continuent d'être détectés par `which`.

## Vérification

- `npm test -- --runInBand test/unit/linux-app-resolution.test.js` — 4 tests
  réussis.
- `npm test -- --runInBand test/unit/linux-app-resolution.test.js test/unit/admin-remotes.handlers.test.js test/unit/system.service.test.js test/unit/browser-remote-buttons.test.js` — 4 suites, 9 tests réussis.

Le test de résolution couvre explicitement Flatpak présent avec
`com.brave.Browser` absent et vérifie que le résultat est indisponible.
Un second test vérifie qu'un exécutable Brave trouvé dans le `PATH` est retenu
sans exiger une installation Flatpak.

## Suite

La détection détaillée des versions et les diagnostics utilisateur restent
rattachés à PLAT-006.
