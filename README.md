# Passerelle

Passerelle est un prototype de détecteur de tendances qui explore le passage
d'un signal observé dans le goût vers la parfumerie. Une place interactive
présente huit tendances, leurs sources, une proposition de suivi et un brief
destiné aux équipes goût et parfum.

Le projet comprend une interface React/TypeScript avec Vite et Three.js, une API
Express/TypeScript et une base PostgreSQL. Il est conçu pour être lancé dans le
dev container du dépôt.

## Parcours de démonstration

- **La place** (`/`) : vue interactive des huit tendances.
- **Fiche tendance** (`/tendance/:id`) : indicateurs, chronologie, sources et
  proposition de Passerelle.
- **Sources** (`/tendance/:id/sources`) : consulter et marquer les sources à
  vérifier.
- **Brief** (`/tendance/:id/brief`) : préparer un brief relu par l'utilisateur.
- **Tableau de bord** (`/tableau-de-bord`) : comparer les huit tendances.

Le chocolat de Dubaï et pistache est le seul cas présenté comme réel ; les
autres tendances sont des exemples simulés. Les sources et dates affichées
doivent être vérifiées avant toute utilisation hors démonstration. Les décisions
de l'utilisateur et les statuts de vérification sont conservés dans le stockage
local du navigateur.

## Démarrage

### Prérequis

- Docker Desktop ou OrbStack.
- Un éditeur compatible avec les dev containers, par exemple VS Code avec
  l'extension [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers), ou Zed.

Node.js et PostgreSQL sont fournis par la configuration du conteneur.

### Ouvrir le dépôt dans le conteneur

```bash
git clone https://github.com/Hetic-Hackathon-Givaudan-2026-Ousmane/Hackathon-app.git
cd Hackathon-app
```

Dans VS Code, ouvrez le dossier et choisissez **Reopen in Container**. Dans
Zed, utilisez **Open in Container**. À la première ouverture, le conteneur
installe les dépendances et crée `api/.env` depuis `api/.env.example`.

### Lancer l'application

Dans un terminal **du conteneur** :

```bash
npm run dev
```

- Interface : <http://localhost:5173>
- API et connexion PostgreSQL : <http://localhost:3000/api/health>
- PostgreSQL : hôte `db`, port `5432`, base `app`

Le service PostgreSQL est démarré par Docker Compose avec le conteneur. Le point
de santé doit renvoyer un statut `ok` et la version de PostgreSQL.

## Fournisseur IA

L'API appelle un fournisseur compatible avec l'API OpenAI. La configuration se
fait dans `api/.env` avec `AI_BASE_URL`, `AI_MODEL` et, si nécessaire,
`AI_API_KEY`. Ne commitez jamais ce fichier ni une clé.

La configuration d'exemple utilise Ollama installé sur la machine hôte :

```dotenv
AI_BASE_URL=http://host.docker.internal:11434/v1
AI_MODEL=llama3.2:1b
AI_API_KEY=
```

Pour télécharger le modèle avec Ollama :

```bash
ollama pull llama3.2:1b
```

Les appels IA ont un délai maximal de 20 secondes. Si le fournisseur est absent,
indisponible ou trop lent, l'API renvoie un résultat de secours signalé dans
l'interface. Ce résultat permet de poursuivre la démonstration, mais ne provient
pas d'une analyse IA.

## API

Le contrat complet est décrit dans [`openapi.yaml`](./openapi.yaml).

| Route                 | Usage                                               |
| --------------------- | --------------------------------------------------- |
| `GET /api/health`     | Vérifier l'API et PostgreSQL                        |
| `GET /api/questions`  | Lister les questions enregistrées                   |
| `POST /api/questions` | Poser une question à l'IA et enregistrer la réponse |
| `POST /api/verdict`   | Générer une proposition pour une tendance           |
| `POST /api/brief`     | Générer le brief d'une tendance                     |

Les routes `/api/verdict` et `/api/brief` attendent un identifiant de tendance
présent dans les données de démonstration. L'API lit ces fiches dans
[`signals.json`](./web/src/passerelle/data/signals.json).

## Commandes de développement

À exécuter dans le conteneur :

| Commande               | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `npm run dev`          | Lancer l'API et l'interface en mode développement |
| `npm run lint`         | Vérifier le code avec ESLint                      |
| `npm run format`       | Formater les fichiers avec Prettier               |
| `npm run format:check` | Vérifier le formatage                             |
| `npm run build`        | Compiler l'API et construire l'interface          |

Avant de proposer une modification, exécuter :

```bash
npm run lint
npm run format:check
npm run build
```

## Structure du dépôt

```text
.
├── api/
│   ├── src/index.ts          # Routes Express et appels IA
│   └── .env.example          # Exemple de configuration locale
├── db/
│   ├── init/                 # Schéma et données initiales PostgreSQL
│   └── data/                 # Données PostgreSQL locales persistantes
├── docs/adr/                 # Décisions d'architecture
├── web/
│   ├── src/passerelle/       # Interface et données de démonstration
│   └── vite.config.ts        # Serveur Vite et proxy API
├── .devcontainer/            # Environnement de développement
├── compose.yaml              # Services dev, PostgreSQL et Ollama
└── openapi.yaml              # Contrat de l'API
```

## Données locales et dépannage

- `db/data/` contient les données PostgreSQL persistantes de votre poste et
  n'est pas versionné. **Ne le supprimez pas et ne le réinitialisez pas pour
  résoudre un problème sans accord explicite.**
- Si l'API signale une erreur de connexion à PostgreSQL, vérifiez d'abord
  <http://localhost:3000/api/health> et l'état des services Compose. Ne supprimez
  pas le volume ou le dossier de données.
- Si la génération IA prend du temps, vérifiez qu'Ollama est démarré et que le
  modèle configuré est disponible. Après 20 secondes, l'application utilise une
  réponse de secours clairement indiquée.
- Lancez les commandes `npm` dans le terminal du conteneur pour utiliser le bon
  environnement et les dépendances installées.

## Contribution

1. Créez une branche de fonctionnalité depuis `develop`.
2. Faites vos changements et lancez les vérifications listées ci-dessus.
3. Créez une pull request vers `develop` en suivant le
   [modèle du dépôt](./.github/pull_request_template.md).
4. Attendez la CI et la revue avant de fusionner.

Consultez les [ADR](./docs/adr/) avant de modifier un composant ou d'ajouter une
dépendance. Toute modification du contrat des routes doit également mettre à
jour [`openapi.yaml`](./openapi.yaml).
