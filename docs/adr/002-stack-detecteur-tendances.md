# 002. Réutiliser la stack existante pour le détecteur de tendances

- Statut : proposée
- Date : 2026-11-09
- Décideurs : à confirmer par l'équipe

## Contexte

Le projet porte sur un détecteur de tendances pour le challenge Givaudan. Il
devra notamment présenter des signaux et leurs sources, expliquer leur score et
proposer des analyses et des briefs. Le dépôt contient déjà une application
web, une API, une base PostgreSQL et une connexion à une IA.

Le hackathon impose un délai court : réutiliser cette base limite le travail
d'installation et permet de se concentrer sur le produit.

## Options

1. Réutiliser la stack existante et la faire évoluer : démarrage plus rapide,
   mais certains outils devront être ajoutés selon les besoins.
2. Repartir avec une autre stack ou séparer les services par technologie :
   plus de liberté technique, mais davantage de configuration et d'intégration.

## Décision proposée

Retenir l'option 1 :

- **Interface : TypeScript et Vite**, déjà présents, pour développer le tableau
  de bord. Le choix éventuel d'un framework comme React reste à valider : il
  n'est pas installé actuellement.
- **API : Node.js, TypeScript et Express**, déjà en place, pour centraliser la
  collecte, le calcul des scores et les appels à l'IA.
- **Données : PostgreSQL**, déjà configuré, pour stocker les signaux, leurs
  sources et les résultats d'analyse.
- **IA : interface compatible OpenAI**, déjà utilisée par l'API, avec Ollama
  configuré par défaut pour le développement local. Le fournisseur et le modèle
  à utiliser pour la démonstration restent à valider.
- **Environnement et qualité : Docker Compose, dev container et GitHub Actions**,
  déjà configurés, pour faciliter l'installation et vérifier le code.

Cette proposition privilégie les outils présents dans le dépôt plutôt qu'une
réécriture. Les sources de données, les outils de visualisation, l'hébergement
et la méthode de scoring restent à définir séparément.

## Conséquences

- Positives : moins de configuration initiale ; TypeScript partagé entre
  interface et API ; données structurées et fournisseur d'IA configurable.
- Négatives : la collecte, la traçabilité des sources et le scoring ne sont pas
  encore implémentés ; l'IA locale nécessite un modèle et des ressources
  suffisantes.
- À revoir si : les besoins de collecte ou d'analyse dépassent les capacités
  de cette stack, ou si les contraintes de coût, de qualité ou de confidentialité
  imposent un autre fournisseur.
