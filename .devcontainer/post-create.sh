#!/bin/sh
# Une fois, à la création du conteneur : les dépendances, et le fichier .env local
set -e
cd /workspace

git config --global --add safe.directory /workspace
gh auth setup-git || true
npm ci
test -f api/.env || cp api/.env.example api/.env
