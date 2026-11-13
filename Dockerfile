# Image de la démonstration : l'API et l'interface partagent le même dépôt.
# `docker compose up` s'en sert ; le dev container a sa propre image.
FROM node:24-trixie-slim

WORKDIR /app
# Pas de hook Git dans l'image
ENV HUSKY=0

COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci

COPY api api
COPY web web
# L'API applique db/init/003-journal.sql au démarrage
COPY db/init db/init
RUN npm run build -w api

EXPOSE 3000 5173
