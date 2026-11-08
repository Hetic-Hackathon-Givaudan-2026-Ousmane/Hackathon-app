# Qualité du Code

## Outils

- **ESLint** : détecte les erreurs probables (variable inutilisée, promesse oubliée, `any` explicite…)
- **Prettier** : s'occupe de la forme (guillemets, indentation, retours à la ligne)
- **husky + lint-staged** : valide la qualité avant chaque commit

## Configuration

### ESLint (eslint.config.mjs)

- Recommandations ESLint activées
- TypeScript support via `typescript-eslint`
- Prettier intégré (pas de conflits)
- Exclusions: `dist/`, `db/data/`, `.venv/`

### Prettier (.prettierrc.json)

- Single quotes: `true`
- Support JSONC pour devcontainer et .zed

### Hook pre-commit

À chaque `git commit`:

1. lint-staged parcourt les fichiers modifiés
2. ESLint vérifie et corrige (`--fix`)
3. Prettier formate
4. Commit bloqué si erreurs

## Commandes

```bash
# Vérifier les erreurs
npm run lint

# Formater le code
npm run format

# Vérifier la formattage (CI)
npm run format:check

# Construire le projet
npm run build

# Développement
npm run dev
```

## Notes

- Les hooks s'exécutent depuis le dev container (Node version cohérente)
- Commitez depuis VS Code dans le dev container
- `db/data` (PostgreSQL) est ignoré par les deux outils
- `.venv` (équipe Data/IA) est ignoré par ESLint
