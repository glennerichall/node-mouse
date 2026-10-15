# PLAT-005b8a — 2026-10-14

## Objectif

Corriger l’échec GitHub Actions du test Playwright qui modifiait un curseur
désactivé après avoir coupé l’accélération du pointeur.

## Décision et modifications

Le scénario conserve l’assertion de désactivation, réactive ensuite
l’accélération et attend que le curseur rapide soit activé avant de remplir les
deux curseurs. Playwright est mis à jour en 1.64.1, qui fournit Chromium pour
Ubuntu 26.04; le workflow conserve donc `ubuntu-latest` et l’installation
explicite du navigateur. Aucune modification VM ou de production n’est
nécessaire.

## Vérification

- `git diff --check` — réussi.
- `npm test -- --runInBand test/unit/mouse-tuning.page.test.js` — 1 suite,
  4 tests réussis.
- `npx playwright test test/e2e/frontend.spec.js -g "preferences persist the
  pointer speed curve locally" --project=chromium` — 1 test réussi.
- `npx playwright test --project=chromium` — 18 tests réussis.

## Suite

L’exécution GitHub Actions doit valider l’item PLAT-005b8a avec le Chromium
installé par le workflow.
