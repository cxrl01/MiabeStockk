# Étape 1 : Build du Frontend (React/Vite)
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape 2 : Production PHP + Nginx
FROM php:8.4-fpm

# Installation de Nginx et des extensions système
RUN apt-get update && apt-get install -y \
    nginx libpq-dev libzip-dev libpng-dev libonig-dev libxml2-dev unzip git \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip gd mbstring xml bcmath \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --prefer-dist --optimize-autoloader

COPY . .
COPY --from=frontend /app/public/build ./public/build

RUN composer dump-autoload --optimize --no-dev --classmap-authoritative
RUN chmod -R 777 storage bootstrap/cache

# Configuration Nginx simplifiée pour Render
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

EXPOSE 10000

# Démarrage de FPM, Nginx, puis exécution des commandes Laravel
CMD php-fpm -D && nginx -g "daemon off;" & \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan migrate --force && \
    wait