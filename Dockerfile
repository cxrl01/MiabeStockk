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

# Création explicite des dossiers requis (évite l'erreur "Please provide a valid cache path")
RUN mkdir -p \
    storage/framework/sessions \
    storage/framework/views \
    storage/framework/cache/data \
    storage/framework/testing \
    storage/app/public \
    storage/logs \
    bootstrap/cache \
    && chmod -R 777 storage bootstrap/cache

EXPOSE 10000

# Démarrage avec cache des configurations, routes, migrations et multi-workers
CMD php artisan config:cache && \
    php artisan route:cache && \
    php artisan migrate --force && \
    PHP_CLI_SERVER_WORKERS=4 php artisan serve --host 0.0.0.0 --port ${PORT:-10000} --no-reload