# Étape 1 : construire les fichiers React/Vite (JS/CSS compilés)
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape 2 : l'application PHP/Laravel
FROM php:8.4-cli

# Outils système + extensions PHP nécessaires
RUN apt-get update && apt-get install -y \
    libpq-dev libzip-dev libpng-dev libonig-dev libxml2-dev unzip git \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip gd mbstring xml bcmath \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Installe Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copie d'abord les fichiers Composer pour maximiser le cache Docker
COPY composer.json composer.lock ./

# Installe les dépendances SANS exécuter les scripts artisan lors du BUILD
RUN composer install --no-dev --no-interaction --no-scripts --prefer-dist --optimize-autoloader

# Copie le reste du code source
COPY . .
COPY --from=frontend /app/public/build ./public/build

# Exécute l'autoloader final une fois le code copié
RUN composer dump-autoload --optimize --no-dev --classmap-authoritative

# Permissions sur storage et bootstrap/cache
RUN chmod -R 777 storage bootstrap/cache

EXPOSE 10000

# Commande de démarrage instantanée
CMD php artisan config:cache && php artisan route:cache && php artisan migrate --force && php artisan serve --host 0.0.0.0 --port ${PORT:-10000}