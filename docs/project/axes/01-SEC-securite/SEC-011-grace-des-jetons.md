# SEC-011 — Durée de grâce des jetons d'entrée

La durée de grâce par défaut des anciens jetons d'entrée est fixée à 120 minutes
dans le code, `.env.example` et les installateurs. La surcharge
`ENTRY_PATH_GRACE_MIN` est conservée et documentée, avec un test anti-régression
de la valeur canonique.
