# Guide de Configuration - Atelier Collaboration

## ✅ Étapes Complétées

- ✓ Branche `develop` créée et poussée
- ✓ ESLint & Prettier configurés (zéro erreur)
- ✓ Husky et lint-staged en place
- ✓ Pre-commit hook fonctionnel
- ✓ CI workflow `.github/workflows/ci.yml` créé
- ✓ CODEOWNERS configuré
- ✓ Pull request template en place

## ⚠️ Étapes Restantes (À faire sur GitHub UI)

### 1. Configurer les réglages du dépôt (General Settings)

Allez sur **https://github.com/Hetic-Hackathon-Givaudan-2026-Ousmane/Hackathon-app**

**Settings → General:**

#### Default branch

- Cliquez sur l'icône de changement à côté de "Default branch"
- Sélectionnez `develop`
- Confirmez
- ✓ Les pull requests cibleront désormais `develop` par défaut

#### Pull Requests

Cochez les options suivantes dans la section "Pull Requests":

- ✅ **Allow squash merging**
  - Pour `feature/*` → `develop` : une fonctionnalité = un commit propre
- ✅ **Allow merge commits**
  - Pour `develop` → `main` : garde l'historique complet avant chaque démo
- ✅ **Automatically delete head branches**
  - Nettoie automatiquement les branches feature après merge

### 2. Comprendre le GitFlow simplifié (2 semaines, pas de `release/*`)

#### Table de référence - Branches et rôles:

| Branche     | Rôle                                | Alimentée par                         |
| ----------- | ----------------------------------- | ------------------------------------- |
| `main`      | Ce qui est démontrable              | Une PR depuis `develop` ou `hotfix/*` |
| `develop`   | L'intégration, branche par défaut   | Une PR depuis `feature/*`             |
| `feature/*` | Une tâche, un ou deux jours au plus | Son auteur                            |
| `hotfix/*`  | Une correction urgente de `main`    | Un tech-lead                          |

**Note:** Le GitFlow complet ajoute des branches `release/*`. En deux semaines, c'est superflu : `develop` est fusionnée dans `main` avant chaque démo.

#### Workflow visuel:

**Workflow concret:**

1. Créer une feature: `git checkout -b feature/ma-tâche`
2. Développer et tester
3. Push: `git push -u origin feature/ma-tâche`
4. Créer une PR vers `develop` (défaut)
5. **Squash and merge** pour simplifier l'historique de `develop`
6. Avant chaque démo: PR de `develop` vers `main`
7. **Merge commit** pour garder l'historique complet

**Workflow hotfix (correction urgente sur `main`):**

1. Si un bug critique est découvert en production (`main`):
   ```bash
   git checkout -b hotfix/nom-du-bug main
   ```
2. Corriger le bug et tester
3. Push: `git push -u origin hotfix/nom-du-bug`
4. Créer une PR vers `main` avec **merge commit**
5. Approuver et fusionner immédiatement
6. **Important:** Créer une deuxième PR de `hotfix/*` vers `develop` pour synchroniser
7. Supprimer la branche `hotfix/*` après fusion
8. **Tag optionnel sur `main`:** `v1.0.1`, `v1.0.2`, etc.

### 3. Configurer les Rulesets sur `develop` et `main`

Allez dans **Settings → Rules → Rulesets** et créez 2 rulesets:

#### **Ruleset pour `develop`:**

1. Click "New ruleset" → "New branch ruleset"
2. Nommez-le: `protect-develop`
3. **Target branches:** Include by pattern `develop`
4. **Enforcement status:** Active
5. **Rules à activer:**
   - ✅ **Restrict deletions** — personne ne peut supprimer la branche
   - ✅ **Block force pushes** — personne ne peut réécrire l'historique
   - ✅ **Require a pull request before merging**
     - Required number of approvals: 1
     - ✅ Dismiss stale pull request approvals when new commits are pushed
     - ✅ Require review from Code Owners (fichiers sensibles exigent `@OUSMANE-SACKO`)
   - ⏳ **Require status checks to pass** — À ajouter après que la CI soit en place
6. Laisser la **bypass list** vide (même les admins passent par une PR)
7. Créer le ruleset

#### **Ruleset pour `main`:**

1. Click "New ruleset" → "New branch ruleset"
2. Nommez-le: `protect-main`
3. **Target branches:** Include by pattern `main`
4. **Enforcement status:** Active
5. **Rules à activer:** (Identiques à develop)
   - ✅ **Restrict deletions**
   - ✅ **Block force pushes**
   - ✅ **Require a pull request before merging**
     - Required number of approvals: 1
     - ✅ Dismiss stale pull request approvals when new commits are pushed
     - ✅ Require review from Code Owners
   - ⏳ **Require status checks to pass** — À ajouter après que la CI soit en place
6. Laisser la **bypass list** vide
7. Créer le ruleset

**Note:** Le check `qualite` sera ajouté aux rulesets une fois que le workflow CI générera des résultats. Pour l'instant, l'exiger bloquerait toutes les PRs.

### 4. Vérifier que le modèle de PR s'affiche correctement

Allez créer une PR de test : le modèle `.github/pull_request_template.md` doit apparaître automatiquement avec les questions:

- "Quoi et pourquoi?"
- "Comment tester?"

## 🧪 Tests de Validation

Une fois les rulesets configurés, testez que:

```bash
# Test 1: Essayer de push directement sur develop (doit être refusé)
git push origin develop --force
# ❌ Expected: Refusé par le ruleset

# Test 2: Créer un commit avec erreur ESLint (doit être bloqué par husky)
# Modifiez un fichier avec une erreur volontaire
# Faites un commit
# ❌ Expected: Bloqué par le pre-commit hook

# Test 3: Créer une PR avec check rouge (ne doit pas pouvoir fusionner)
# Créez une branche de feature avec une erreur ESLint
# Ouvrez une PR vers develop
# ❌ Expected: Le bouton "Merge" est désactivé tant que le check échoue
```

## 📋 Checklist Finale

- [ ] Branche `develop` créée et poussée
- [ ] Branche par défaut changée en `develop`
- [ ] Ruleset `protect-develop` créé et actif
- [ ] Ruleset `protect-main` créé et actif
- [ ] Check `qualite` est obligatoire dans les deux rulesets
- [ ] Tests de validation passés
- [ ] Organisation GitHub avec équipes configurée
- [ ] Tous les membres ont les bons rôles

## 🎯 Résumé avant 17h

Vous devez avoir:

1. ✓ Un dépôt protégé où personne ne peut casser `develop` ni `main`
2. ✓ Des rulesets empêchant les push directs
3. ✓ Un check `qualite` obligatoire via CI
4. ✓ Un pre-commit hook bloquant les erreurs ESLint
5. ✓ Une démonstration fonctionnelle des 3 points de blocage

**Appelez l'intervenant une fois terminé!**
