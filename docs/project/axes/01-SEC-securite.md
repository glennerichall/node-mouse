# 01 — SEC — Sécurité et contrôle d'accès

**État:** SEC-001 à SEC-011 et SEC-010d terminés; aucune tâche de sécurité planifiée.

## Résultat visé

Garantir que les identités clientes ne reposent pas sur des en-têtes falsifiables,
que les sessions et rôles sont révocables et correctement autorisés, et que les
entrées réseau sont bornées. Le scénario LAN reste la cible immédiate, sans
considérer le LAN comme une frontière de confiance.

## Plan de travail

- [x] Résolution d'adresse cliente et proxies de confiance explicites.
- [x] Orchestration de sécurité commune HTTP/Socket.IO.
- [x] Secret de session robuste et dépendances de production examinées.
- [x] Séparer jeton d'association et session d'appareil; rôles controller/admin.
- [x] Limites de taille/débit, vérification Origin/CSRF et expurgation des logs.
- [x] **SEC-008:** lister les appareils associés et leurs métadonnées.
- [x] **SEC-008:** révoquer une session ou toutes les sessions via API admin.
- [x] **SEC-008:** conserver un historique local des associations/révocations.
- [x] **SEC-009:** séparer les lectures nécessaires à la télécommande des
  ressources administrateur afin qu'une session `controller` issue du QR puisse
  charger son état sans recevoir de droits d'écriture ni de données sensibles.
- [x] **SEC-010:** permettre à un contrôleur de déverrouiller temporairement le
  rôle administrateur depuis le panneau latéral avec un mot de passe serveur,
  une expiration et une limitation stricte des tentatives.
- [x] **SEC-010a:** rendre la longueur minimale du mot de passe administrateur
  configurable sans divergence entre l'API d'authentification et l'interface.
- [x] **SEC-010b:** permettre de reverrouiller explicitement l'administration
  depuis le panneau latéral : lorsque la session courante est administrateur,
  remplacer le formulaire et le bouton « Déverrouiller » par un bouton
  « Verrouiller », révoquer immédiatement son élévation temporaire, puis
  resynchroniser les autorisations HTTP et Socket.IO sans modifier les autres
  sessions associées. Le champ doit aussi offrir un contrôle accessible
  « Afficher/Masquer le mot de passe » : valeur masquée par défaut, affichable
  en clair à la demande, sans persistance ni modification de la saisie.
- [x] **SEC-010c:** modéliser l'élévation administrateur temporaire comme une
  ressource de la session courante : `POST /api/admin-auth/elevation` la crée
  ou la renouvelle et `DELETE /api/admin-auth/elevation` la supprime; retirer
  le chemin RPC `/unlock` et aligner les noms des handlers sans modifier le
  comportement de sécurité.
- [x] **SEC-010d:** corriger le panneau latéral pour n'afficher qu'une commande
  d'élévation dont le libellé et l'action alternent entre « Déverrouiller » et
  « Verrouiller » selon l'état courant; intégrer le contrôle d'affichage sous
  forme d'icône œil dans le champ sans réduire sa zone de saisie; placer en haut
  les commandes QR accessibles aux contrôleurs (`QR serveur`, `QR client`,
  overlay et rotation du jeton), regrouper ensuite les actions réellement
  administratives, puis conserver l'élévation tout en bas; utiliser des
  événements sans préfixe `admin:` pour les commandes QR, accepter
  temporairement les anciens événements protégés pour les clients déjà chargés
  et couvrir état, ordre, accessibilité et autorisations par des tests.
- [x] **SEC-010e:** distinguer dans l'API et le panneau une administration
  verrouillée d'actions administratives désactivées par configuration; rendre le
  champ du mot de passe plus haut; sortir les événements `qr:*`, leur registrar,
  leur façade d'actions et la commande CLI du parcours admin, tout en conservant
  les anciens événements `admin:*` comme alias protégés de compatibilité.
- [x] **SEC-011:** fixer à 120 minutes la durée de grâce par défaut des anciens
  jetons d'entrée dans le code, `.env.example` et les installateurs; conserver
  la surcharge `ENTRY_PATH_GRACE_MIN`, documenter son effet et ajouter un test
  anti-régression de la valeur canonique.

## Critères d'acceptation

- Aucun en-tête forgé ne confère un accès privilégié.
- Les contrôles d'accès HTTP et Socket.IO sont cohérents.
- La révocation coupe immédiatement l'accès concerné.
- Les limites et refus n'exposent pas de secrets; les tests anti-régression passent.

## Historique

Voir [journal SEC, lot A](../development/security-lot-a.md). Toute nouvelle
itération est consignée dans un nouveau fichier du journal, sans réécrire les
itérations clôturées.
