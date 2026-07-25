#!/bin/sh

# Exécute les migrations et le seeder
php artisan migrate --force --seed

# Démarre l'application (Apache, Nginx, ou php artisan serve selon ta config)
exec "$@"