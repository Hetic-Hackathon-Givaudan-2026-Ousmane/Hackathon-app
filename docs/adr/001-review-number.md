pe# 001. Relectures exigées sur les PR : aucune pour l'instant

- Statut : acceptée
- Date : 2026-11-05
- Décideurs : Ousmane Sacko

## Contexte

Je suis le seul développeur et propriétaire du projet. GitHub interdit d'approuver sa propre PR : exiger une relecture bloquerait tout.

## Options

1. Option A : une relecture obligatoire. Plus sûr, mais impossible seul.
2. Option B : PR obligatoire, sans relecture. Pas de push direct, CI sur chaque PR, mais personne ne relit.
3. Option C : push direct. Rapide, mais aucun contrôle.

## Décision

Nous choisissons l'option B parce qu'elle protège `develop` sans dépendre d'une deuxième personne.

## Conséquences

- Positives : tout passe par une PR et la CI.
- Négatives, à accepter : aucune relecture humaine.
- À revoir si : un deuxième dev rejoint le projet (passer à une relecture obligatoire).
