# 003. Décrire le contrat HTTP avec OpenAPI

- Statut : proposée
- Date : 2026-11-10
- Décideurs : à confirmer par l'équipe

## Contexte

Le front et l'API évoluent ensemble, mais les routes et leurs formats de
requête et de réponse doivent rester explicites pour l'équipe. Une page de
documentation générée seule ne fournit pas le fichier versionné demandé pour
le projet.

## Options

1. Décrire le contrat dans un fichier OpenAPI versionné : lisible par l'équipe
   et exploitable par des outils, avec le travail de garder le document à jour.
2. Documenter les routes uniquement dans le code ou dans le README : simple
   au départ, mais le contrat est moins structuré et plus difficile à valider.

## Décision proposée

Choisir l'option 1 et maintenir le contrat HTTP dans [`openapi.yaml`](../../openapi.yaml).
Le fichier décrit les routes de santé et de questions existantes, leurs
schémas et leurs principales réponses. Toute modification de ces routes doit
mettre à jour le contrat dans la même pull request.

## Conséquences

- Positives : le front et l'équipe partagent une référence versionnée ; les
  routes peuvent être inspectées ou vérifiées avec des outils OpenAPI.
- Négatives : la spécification peut diverger du code si elle n'est pas mise à
  jour avec `api/src/index.ts`.
- À revoir si : l'API est générée depuis une spécification ou si le projet
  adopte une autre source de vérité pour son contrat.
