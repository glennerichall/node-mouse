## Convention retenue pour la passe CODE

- `server/` utilise quatre espaces; `client/` et `scripts/` utilisent deux
  espaces; `test/` conserve quatre espaces pour les suites Jest existantes.
- Les imports externes précèdent les imports internes; les imports internes
  restent regroupés par domaine.
- Les modules exportent directement leurs fonctions publiques; les routeurs
  exportent une instance montée et délèguent le métier à des handlers nommés.
- Les déclarations de route sont chaînées et limitées au verbe, au chemin et
  aux middlewares; les réponses et les erreurs restent dans les handlers.
- Les fichiers JavaScript ne contiennent pas d'espaces finaux; les
  vérifications automatisées doivent être déterministes et sans formatage
  implicite.
