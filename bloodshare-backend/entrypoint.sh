#!/bin/sh
set -e

if [ ! -f vendor/autoload.php ]; then
    composer install --no-interaction --no-scripts --ignore-platform-reqs
fi

exec php artisan serve --host=0.0.0.0 --port=8000
