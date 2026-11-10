# AGENTS.md

Ce dépôt contient une API Express/TypeScript, un front TypeScript/Vite et une
base PostgreSQL lancés avec Docker Compose. La thématique produit est le
détecteur de tendances ; voir `README.md` et les décisions dans `docs/adr/`.

## Lancer

- Dans le dev container, `npm run dev` lance l'API sur le port 3000 et Vite sur
  le port 5173.
- `curl -sS http://localhost:3000/api/health` vérifie l'API et PostgreSQL.
- Avant de déclarer une modification terminée, exécuter `npm run lint`,
  `npm run format:check` et `npm run build` ; ces contrôles sont aussi dans
  `.github/workflows/ci.yml` (job `qualite`).

## Règles

- Les routes Express sont dans `api/src/index.ts` ; documenter tout changement
  de contrat dans `openapi.yaml`.
- Le proxy du front vers l'API est configuré dans `web/vite.config.ts`.
- Le schéma initial et les données de démonstration sont dans `db/init/`.
- Les variables locales sont dans `api/.env`, créé depuis `api/.env.example` ;
  ne jamais commiter de secret ni modifier `.env` pour changer la configuration
  partagée.
- Suivre `.github/pull_request_template.md` et proposer les changements sur
  une branche de fonctionnalité destinée à `develop`.

## Décisions

- Lire les ADR de `docs/adr/` avant de modifier un composant ou d'ajouter une
  dépendance. Un ADR « proposée » n'est pas une décision acceptée.
- Toute modification d'une route doit garder `openapi.yaml` cohérent avec
  `api/src/index.ts`.

## À ne pas faire

- Ne pas contourner les contrôles avec `--no-verify` ou des désactivations
  ESLint non justifiées.
- Ne pas supprimer ni réinitialiser `db/data/` pour résoudre un problème sans
  accord explicite : ce dossier contient les données persistantes locales.
- Ne pas réécrire les changements locaux existants qui ne sont pas liés à la
  tâche en cours.
