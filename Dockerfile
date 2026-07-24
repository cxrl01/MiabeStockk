# Étape 1 : construire les fichiers React/Vite (JS/CSS compilés)
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape 2 : l'application PHP/Laravel
FROM php:8.4-cli

# Outils système + extensions PHP nécessaires (pgsql, dompdf, excel, etc.)
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
RUN chmod -R 775 storage bootstrap/cache

# Expose le port (Render injecte sa variable $PORT automatiquement)
EXPOSE 8080

# Commande de démarrage
CMD php artisan migrate --force && \
    php artisan config:cache && \
    php artisan serve --host 0.0.0.0 --port ${PORT:-8080}
