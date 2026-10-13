# PLAT-005b8 — isolation des projets Playwright dans Actions

## État

Implémenté, validation GitHub Actions en attente.

## Décision

Les projets `chromium` et `mobile-chrome` sont exécutés dans deux processus
Playwright successifs sur le job E2E. Chaque processus reçoit un port et une
base SQLite temporaires distincts. Cela évite qu'un abonnement SSE ou une
mutation de configuration d'un projet ne contamine l'autre, tout en conservant
les mêmes tests et assertions.

Le smoke test Windows utilise aussi un launcher `.cmd` court pour la tâche
`schtasks`. Les chemins Node et de configuration restent dans ce launcher afin
de respecter la limite de 261 caractères de l'option `/TR`.

Le smoke test attend désormais la disponibilité effective du canal CLI avant
les commandes `config` et `info`. Le serveur HTTP peut répondre sainement avant
que le named pipe Windows ne soit créé.

Le serveur CLI ignore aussi les fermetures concurrentes normales (`EPIPE`,
`ECONNRESET`) lorsqu'un client Windows quitte avant la réponse. Ces erreurs ne
doivent pas arrêter le daemon.
