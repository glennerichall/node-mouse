---
name: codex-commit
description: Creer un commit git selon la logique de `bin/codex-commit.sh` : analyser les modifications courantes, choisir un bump semver `patch|minor|major`, formuler un message de commit court en francais, mettre a jour la version avec `npm version --no-git-tag-version`, puis faire `git add -A` et `git commit`.
---

# Objectif
Utiliser cette skill quand l'utilisateur demande de faire un commit, de choisir un bump de version, ou d'aligner le commit sur l'automatisation `bin/codex-commit.sh`.

# Pre-checks
- Verifier que le depot git contient des modifications avec `git status --porcelain`.
- Verifier que `package.json` existe si un bump de version doit etre applique.
- Si l'utilisateur demande explicitement d'utiliser le script existant, preferer `bash ./bin/codex-commit.sh`.
- Sinon, reproduire directement son comportement pour garder le controle sur le bump et le message.

# Workflow obligatoire

## 1. Inspection
Avant tout commit :
- lire `git status --short` ;
- inspecter le diff utile pour comprendre l'impact reel ;
- distinguer breaking change, nouvelle capacite, correctif, refactor, test, doc et chore.

## 2. Decision semver
Choisir exactement un bump parmi `patch`, `minor`, `major`.

Regles :
- `major` si le diff introduit un breaking change observable ;
- `minor` si le diff ajoute une fonctionnalite utilisateur ou une capacite notable ;
- `patch` pour correctif, refactor, test, doc, chore ou petit ajustement.

En cas de doute entre `minor` et `patch`, preferer `patch` sauf benefice utilisateur net.

## 3. Message de commit
Le message doit etre :
- en francais ;
- sur une seule ligne ;
- court et clair ;
- sans backticks ;
- sans prefixe de type obligatoire.

## 4. Execution
Si le commit doit etre realise manuellement, executer dans cet ordre :
1. `npm version <bump> --no-git-tag-version`
2. `git add -A`
3. `git commit -m "<message>"`

## 5. Restitution
Toujours indiquer :
1. le bump retenu ;
2. le message retenu ;
3. si le commit a ete execute ou seulement prepare ;
4. tout blocage rencontre.

# Garde-fous
- Ne jamais creer de tag git.
- Ne jamais amender un commit sans demande explicite.
- Ne pas committer s'il n'y a aucune modification.
- Ne pas inventer un breaking change sans preuve dans le diff.
- Si le depot n'est pas compatible avec `npm version`, signaler que le workflow de `bin/codex-commit.sh` n'est pas applicable tel quel.
