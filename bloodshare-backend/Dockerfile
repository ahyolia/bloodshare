FROM php:8.3-cli

RUN apt-get update --fix-missing && apt-get install -y \
    git curl zip unzip libpq-dev libicu-dev libzip-dev \
    libpng-dev libjpeg-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_pgsql intl zip gd

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-interaction --no-scripts --optimize-autoloader

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

# 📖 Healthcheck : sans lui, une mise à jour Swarm "start-first" arrête l'ancien conteneur
#    dès que le nouveau DÉMARRE, avant qu'il ait fini d'attendre la base et de migrer
#    (quelques secondes d'erreurs). Avec lui, l'ancien reste en service tant que le nouveau
#    n'a pas répondu sur /up. start-period large : attente de la base + migrations.
HEALTHCHECK --interval=5s --timeout=3s --start-period=120s --retries=3     CMD curl -fsS http://localhost:8000/up || exit 1

ENTRYPOINT ["/entrypoint.sh"]
