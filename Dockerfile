# Étape 1 : Build du Frontend React / Vite
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape 2 : L'application PHP / Laravel
FROM php:8.4-cli

# Outils système + extensions PHP requis
RUN apt-get update && apt-get install -y \
    libpq-dev libzip-dev libpng-dev libonig-dev libxml2-dev unzip git \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip gd mbstring xml bcmath \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Installe Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copie du code source + assets compilés
COPY . .
COPY --from=frontend /app/public/build ./public/build

# Installation des dépendances PHP
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Permissions sur les dossiers d'écriture
RUN chmod -R 777 storage bootstrap/cache

# On expose le port 10000 (port par défaut exigé par Render)
EXPOSE 10000

# Commande de démarrage : Forcer l'écoute sur 0.0.0.0 et sur le port 10000
CMD php artisan config:cache && \
    php artisan route:cache && \
    php artisan migrate --force && \
    php artisan serve --host 0.0.0.0 --port ${PORT:-10000}