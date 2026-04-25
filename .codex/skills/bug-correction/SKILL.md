---
name: bug-correction
description: Corrige des bugs dans du code, explique la cause racine, applique une correction minimale et ajoute un test unitaire anti-régression spécifique qui échoue avant la correction et réussit après.
---


## Objectif
Identifier, expliquer et corriger les bugs dans du code fourni par l’utilisateur, puis ajouter un test unitaire spécifique pour éviter que le bug ne réapparaisse.

## Déclencheurs
Utiliser ce skill quand l’utilisateur demande :
- de corriger un bug ;
- de comprendre une erreur ;
- de déboguer du code ;
- d’expliquer un message d’erreur ;
- d’améliorer un code qui ne fonctionne pas comme prévu ;
- d’ajouter un test pour éviter une régression.

## Entrées attendues
Demander ou utiliser :
- le code concerné ;
- le message d’erreur complet ;
- le langage ou framework utilisé ;
- le comportement attendu ;
- le comportement obtenu ;
- les étapes pour reproduire le bug ;
- le framework de test utilisé, si disponible.

## Méthode

1. **Lire le code attentivement**
    - Identifier le langage, le contexte et les dépendances.
    - Repérer les erreurs évidentes : syntaxe, noms de variables, imports, types, logique.

2. **Comprendre le bug**
    - Comparer le comportement attendu avec le comportement réel.
    - Analyser le message d’erreur.
    - Identifier la cause racine du bug.
    - Déterminer le cas exact qui déclenche le problème.

3. **Corriger le bug**
    - Fournir une version corrigée du code.
    - Garder la correction aussi simple que possible.
    - Ne pas réécrire tout le code inutilement.

4. **Ajouter un test unitaire anti-régression**
    - Créer un test qui échoue avec l’ancien code.
    - Vérifier que ce même test réussit avec la correction.
    - Tester précisément le scénario qui provoquait le bug.
    - Éviter les tests trop génériques qui ne protègent pas vraiment contre le retour du bug.

5. **Expliquer la correction et le test**
    - Dire précisément ce qui causait le bug.
    - Expliquer pourquoi la correction fonctionne.
    - Expliquer pourquoi le test empêche la régression.
    - Mentionner les cas limites si nécessaire.

6. **Donner une commande de vérification**
    - Fournir la commande pour exécuter le test unitaire si elle est connue.
    - Sinon, indiquer clairement le test à lancer dans le framework utilisé.

## Format de réponse recommandé

### Problème identifié
Décrire brièvement la cause du bug.

### Correction
```code
// code corrigé ici