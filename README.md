# Hackathon

Une API (Express + PostgreSQL) et un front (Vite) pour poser des questions à une IA.

Tout tourne dans un dev container : il suffit d'installer Docker et un éditeur, pas Node ni PostgreSQL.

## Prérequis

- [OrbStack](https://orbstack.dev) (Mac) ou [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [VS Code](https://code.visualstudio.com) avec l'extension [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers), ou [Zed](https://zed.dev)
- Pour l'IA : [Ollama](https://ollama.com), avec le modèle `ollama pull llama3.2:1b`

## Lancer le projet

1. Cloner le dépôt :

   ```bash
   git clone https://github.com/OUSMANE-SACKO/Hackathon.git
   ```

2. L'ouvrir dans l'éditeur, puis choisir **Reopen in Container** (VS Code) ou **Open Dev Container** (Zed).

   Le premier lancement prend quelques minutes : il construit le conteneur, démarre PostgreSQL, installe les dépendances et crée `api/.env`.

3. Dans le terminal de l'éditeur (donc dans le conteneur) :

   ```bash
   npm run dev
   ```

4. Ouvrir http://localhost:5173.

## Adresses

| Service    | Adresse                                 |
| ---------- | --------------------------------------- |
| Front      | http://localhost:5173                   |
| API        | http://localhost:3000/api/health        |
| PostgreSQL | `postgres://app:app@localhost:5432/app` |

## Commandes

| Commande         | Rôle                       |
| ---------------- | -------------------------- |
| `npm run dev`    | Lance l'API et le front    |
| `npm run lint`   | Vérifie le code (ESLint)   |
| `npm run format` | Formate le code (Prettier) |
| `npm run build`  | Compile l'API et le front  |

Un hook pre-commit lance ESLint et Prettier sur les fichiers commités.

## Contribuer

Créer une branche depuis `develop`, puis ouvrir une pull request vers `develop`. La CI vérifie le lint, le format et le build. Voir [docs/adr](docs/adr) pour les décisions du projet.

## En cas de problème

- **`Cannot find native binding`** : les dépendances ont été installées sur le Mac et non dans le conteneur. Relancer `npm ci` dans le terminal du conteneur.
- **`ECONNREFUSED 127.0.0.1:5432`** : `api/.env` manque. Lancer `cp api/.env.example api/.env`, puis relancer `npm run dev`.
- **Les questions n'ont pas de réponse** : Ollama ne tourne pas sur le Mac, ou le modèle n'est pas téléchargé. Pour un autre fournisseur (Mistral…), modifier les variables `AI_*` dans `api/.env`.

Toujours lancer `npm` dans le terminal du conteneur, jamais sur le Mac.
