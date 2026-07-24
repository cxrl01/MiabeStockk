# Étape 1 : construire les fichiers React/Vite (JS/CSS compilés)
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape 2 : l'application PHP/Laravel
FROM php:8.4-cli

# Outils système + extensions PHP nécessaires (pgsql, dompdf, maatwebsite/excel)
RUN apt-get update && apt-get install -y \
    libpq-dev libzip-dev libpng-dev libonig-dev libxml2-dev unzip git \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip gd mbstring xml bcmath \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Installe Composer (le gestionnaire de dépendances PHP)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .
COPY --from=frontend /app/public/build ./public/build

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN chmod -R 775 storage bootstrap/cache

EXPOSE 10000

CMD php artisan migrate:fresh --force && php artisan config:cache && php artisan serve --host 0.0.0.0 --port ${PORT:-10000}