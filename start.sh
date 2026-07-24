#!/bin/sh
php artisan migrate --force --no-interaction && php artisan config:cache &
exec php artisan serve --host 0.0.0.0 --port ${PORT:-10000}