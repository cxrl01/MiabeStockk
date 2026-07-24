# Étape 1 : construire les fichiers React/Vite (JS/CSS compilés)
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape 2 : l'application PHP/Laravel
FROM php:8.4-cli

RUN apt-get update && apt-get install -y \
    libpq-dev libzip-dev libpng-dev libonig-dev libxml2-dev unzip git \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip gd mbstring xml bcmath \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .
COPY --from=frontend /app/public/build ./public/build

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN chmod -R 775 storage bootstrap/cache

COPY start.sh /usr/local/bin/start.sh
RUN sed -i 's/\r$//' /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

EXPOSE 10000

CMD ["/usr/local/bin/start.sh"]