# Réplique de l'environnement PHP du serveur de démo sae203 (PHP 8.2, mêmes extensions).
#
# 📖 Sert à deux choses, sans variable d'environnement imposée (contrairement au
#    conteneur bloodshare_backend, dont docker-compose force DB_HOST=db) :
#    - lancer les migrations sur Neon avec --env=production ;
#    - vérifier que les tests passent sous la version de PHP du serveur.
#
#   docker build -t aima-php82 bloodshare-backend/deploy/sae203
FROM php:8.2-cli

RUN apt-get update && apt-get install -y \
    libpq-dev libicu-dev libzip-dev libpng-dev libjpeg-dev libfreetype6-dev libmagickwand-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_pgsql intl zip gd bcmath \
    && pecl install imagick \
    && docker-php-ext-enable imagick \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
