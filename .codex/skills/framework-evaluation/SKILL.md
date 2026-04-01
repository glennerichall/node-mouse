---
name: framework-evaluation
description: Évaluer de manière critique l’intérêt d’introduire un framework ou une librairie dans un projet JavaScript/Express existant, en comparant avec l’existant, le coût d’intégration et la qualité technique.
---

# Objectif
Décider s’il faut :
- réutiliser l’existant ;
- intégrer une librairie ;
- refuser l’ajout.

# Démarche

## 1. Définir le besoin exact
Clarifier :
- problème à résoudre ;
- périmètre ;
- fréquence d’usage ;
- criticité ;
- alternative déjà présente dans le code.

## 2. Vérifier l’existant
Chercher :
- dépendances déjà installées ;
- utilitaires internes ;
- patterns déjà validés dans le projet ;
- conventions d’équipe qui seraient contredites.

## 3. Évaluer la solution candidate
Analyser :
- maturité ;
- maintenance ;
- popularité raisonnable ;
- qualité de la doc ;
- compatibilité avec Express / build / frontend ;
- facilité de test ;
- coût de migration ;
- lock-in ;
- impact sécurité et perf ;
- surface API et complexité.

## 4. Arbitrage
Conclure sous forme :
- Recommandation : adopter / ne pas adopter / différer
- Pourquoi
- Coût
- Risques
- Option minimale viable
- Plan d’intégration si retenu

# Règle
Ne recommande pas une dépendance simplement parce qu’elle “fait gagner du temps”.
La recommandation doit être alignée avec :
- cohérence du repo ;
- maintenabilité ;
- simplicité ;
- faible duplication ;
- qualité d’intégration ;
- adoption par la communauté ;
- vitalité de la dépendance.