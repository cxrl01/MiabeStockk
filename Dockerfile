# Étape 1 : Build du Frontend React / Vite
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape 2 : Serveur de production PHP-FPM + Nginx
FROM php:8.4-fpm

# Installation des outils système + extensions PHP requis
RUN apt-get update && apt-get install -y \
    nginx libpq-dev libzip-dev libpng-dev libonig-dev libxml2-dev unzip git \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip gd mbstring xml bcmath \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Installation de Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copie et installation des dépendances PHP (sans scripts artisan au build)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --prefer-dist --optimize-autoloader

# Copie du code source + assets compilés de React
COPY . .
COPY --from=frontend /app/public/build ./public/build

# Optimisation de l'autoloader
RUN composer dump-autoload --optimize --no-dev --classmap-authoritative

# Permissions sur les dossiers d'écriture
RUN chmod -R 777 storage bootstrap/cache

# Configuration Nginx pointant vers le port 10000
RUN echo 'server {\n\
    listen 10000;\n\
    root /var/www/html/public;\n\
    index index.php;\n\
    charset utf-8;\n\
    location / {\n\
        try_files $uri $uri/ /index.php?$query_string;\n\
    }\n\
    location ~ \.php$ {\n\
        fastcgi_pass 127.0.0.1:9000;\n\
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;\n\
        include fastcgi_params;\n\
    }\n\
}' > /etc/nginx/sites-available/default

# Exposition UNIQUEMENT du port 10000 (pour éviter que Render ne capte le port 9000 de FPM)
EXPOSE 10000

# Lancement de PHP-FPM, des caches Laravel, des migrations, puis Nginx en premier plan
CMD php-fpm -D && \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan migrate --force && \
    nginx -g "daemon off;"