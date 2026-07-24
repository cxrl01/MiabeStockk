# Étape 1 : construire les fichiers React/Vite (JS/CSS compilés)
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape 2 : l'application PHP/Laravel
FROM php:8.4-cli

# Outils systeme + extensions PHP necessaires (pgsql, dompdf, maatwebsite/excel)
RUN apt-get update && apt-get install -y \
    libpq-dev libzip-dev libpng-dev libonig-dev libxml2-dev unzip git \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip gd mbstring xml bcmath \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Installe Composer (le gestionnaire de dependances PHP)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .
COPY --from=frontend /app/public/build ./public/build

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN chmod -R 775 storage bootstrap/cache

EXPOSE 10000

# On demarre le serveur EN PREMIER (le "&" le lance en arriere-plan) pour que
# Render recoive une reponse tres vite sur /up. Les migrations se lancent
# juste apres, sans bloquer le demarrage du serveur — indispensable sur le
# plan gratuit de Render, qui n'offre pas de "Pre-Deploy Command" (reserve
# aux plans payants) pour separer proprement ces deux etapes.
CMD ["bash", "-c", "php artisan serve --host 0.0.0.0 --port ${PORT:-10000} & sleep 3; php artisan migrate --force --no-interaction && php artisan config:cache; wait"]