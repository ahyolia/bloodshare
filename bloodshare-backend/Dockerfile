FROM php:8.3-cli

RUN apt-get update --fix-missing && apt-get install -y \
    git curl zip unzip libpq-dev libicu-dev libzip-dev \
    libpng-dev libjpeg-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_pgsql intl zip gd

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

# 📖 --ignore-platform-reqs : le composer.lock verrouille des paquets symfony/* v8
#    qui exigent PHP >= 8.4, alors que l'image tourne en PHP 8.3 (comme le stack).
#    Reprend le comportement de l'ancien entrypoint. Voir aussi : aligner lock <-> PHP.
RUN composer install --no-interaction --no-scripts --optimize-autoloader --ignore-platform-reqs

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
