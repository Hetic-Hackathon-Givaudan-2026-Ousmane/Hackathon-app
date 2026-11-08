# Hackathon App

Une API (Express + PostgreSQL) et un front (React/Vite) pour poser des questions à une IA.

Tout tourne dans un dev container : il suffit d'installer Docker et un éditeur, pas Node ni PostgreSQL.

## 📋 Prérequis (avant de cloner)

### Système

- **Mac** : [OrbStack](https://orbstack.dev) (recommandé) ou [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Windows/Linux** : [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Éditeur

- **VS Code** (recommandé) :
  - Extension [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- **Zed** :
  - Support natif des dev containers
- **Autre** : tout éditeur supportant les dev containers

### Pour l'IA (local uniquement)

- [Ollama](https://ollama.com) (facultatif, voir section [Fournisseur IA](#fournisseur-ia))
- Après installation : `ollama pull llama3.2:1b`

## 🚀 Démarrage Rapide

### 1. Cloner le dépôt

```bash
git clone https://github.com/Hetic-Hackathon-Givaudan-2026-Ousmane/Hackathon-app.git
cd Hackathon-app
```

### 2. Ouvrir dans le dev container

**VS Code :**

1. Ouvrir le dossier dans VS Code
2. Une popup propose : **Reopen in Container**
3. Cliquer dessus (ou Cmd+Shift+P → "Dev Containers: Reopen in Container")
4. Patienter 2-3 min (construction du conteneur, PostgreSQL, dépendances)

**Zed :**

1. Ouvrir le dossier dans Zed
2. Menu → **Dev Containers** → **Open in Container**
3. Patienter 2-3 min

### 3. Lancer le projet

Toujours dans le terminal de l'éditeur (dans le conteneur) :

```bash
npm run dev
```

### 4. Accéder à l'app

- **Frontend** : http://localhost:5173
- **API** : http://localhost:3000/api/health
- **PostgreSQL** : `localhost:5432/app` (connexion depuis le conteneur)

## 📁 Structure du Projet

```
.
├── api/                    # Backend API (Express + TypeScript)
│   ├── src/
│   │   ├── index.ts        # Point d'entrée
│   │   ├── routes/         # Endpoints de l'API
│   │   └── ...
│   └── .env                # Variables d'environnement (auto-créé)
│
├── web/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── main.tsx        # Point d'entrée
│   │   ├── App.tsx         # Composant principal
│   │   └── ...
│   └── vite.config.ts
│
├── db/                     # Base de données
│   ├── data/               # Data PostgreSQL (géré par le conteneur)
│   └── migrations/         # Schéma de la BD
│
├── .devcontainer/          # Configuration du dev container
├── .github/                # Configuration GitHub (workflows, CODEOWNERS)
├── .husky/                 # Git hooks (pré-commit)
└── package.json            # Dépendances partagées
```

## ✅ Commandes Essentielles

| Commande               | Rôle                         | Terminal  |
| ---------------------- | ---------------------------- | --------- |
| `npm run dev`          | Lance l'API et le frontend   | Conteneur |
| `npm run lint`         | Vérifie les erreurs ESLint   | Conteneur |
| `npm run format`       | Formate le code (Prettier)   | Conteneur |
| `npm run format:check` | Vérifie le formatage (CI)    | Conteneur |
| `npm run build`        | Compile l'API et le frontend | Conteneur |

**⚠️ Important :** Toujours lancer les commandes `npm` dans le terminal du conteneur, jamais sur votre machine!

## 📖 Workflow Git

### Créer une feature

```bash
# Créer une branche depuis develop
git checkout -b feature/ma-feature

# Faire vos changements
# Commit (le hook pre-commit valide automatiquement)
git add .
git commit -m "description claire"

# Pousser
git push -u origin feature/ma-feature
```

### Ouvrir une Pull Request

1. GitHub propose un lien après le `git push`
2. Créer la PR vers `develop` (branche par défaut)
3. Remplir le modèle:
   - **Quoi et pourquoi?** — Décrire la feature
   - **Comment tester?** — Étapes de test
   - ✅ Cocher: "Testé dans le dev container" et "Code relu"
4. La CI tourne (Actions → check `qualite`)
5. Une fois approuvée + CI verte : **Squash and merge**
6. Avant la démo : PR de `develop` vers `main` (merge commit)

## 🧪 Avant de Commiter

Vérifiez toujours:

```bash
# Erreurs ESLint?
npm run lint

# Code bien formaté?
npm run format:check

# Build réussit?
npm run build
```

Le hook pre-commit le fait automatiquement, mais mieux vaut vérifier d'abord!

## 🧠 Fournisseur IA

Par défaut : **Ollama** (local, gratuit).

Pour un autre fournisseur (Mistral, OpenAI…), modifier `api/.env` :

```bash
# Ollama (par défaut)
AI_PROVIDER=ollama
AI_MODEL=llama3.2:1b

# Ou Mistral
AI_PROVIDER=mistral
AI_KEY=<votre-clé-api>
```

Voir `api/.env.example` pour la liste complète.

## 🚨 En cas de problème

- **`Cannot find native binding`** : les dépendances ont été installées sur votre machine et non dans le conteneur. Relancer `npm ci` dans le terminal du conteneur.
- **`ECONNREFUSED 127.0.0.1:5432`** : `api/.env` manque. Lancer `cp api/.env.example api/.env`, puis relancer `npm run dev`.
- **Les questions n'ont pas de réponse** : Ollama ne tourne pas, ou le modèle n'est pas téléchargé. Pour un autre fournisseur, modifier les variables `AI_*` dans `api/.env`.

## 📚 Ressources

- [CODEOWNERS](.github/CODEOWNERS) — Fichiers sensibles (tech-lead approval requis)
- [CI/CD workflow](.github/workflows/ci.yml) — Tests automatiques sur chaque PR
- [QUALITY.md](QUALITY.md) — ESLint, Prettier, hooks pré-commit
- [SETUP-GUIDE.md](SETUP-GUIDE.md) — Configuration collaboration et Git workflow
