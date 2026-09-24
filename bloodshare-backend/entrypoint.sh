#!/bin/sh
set -e
cd /var/www/html

# 📖 Sur un clone neuf, le volume du docker-compose (./bloodshare-backend:/var/www/html)
#    masque le vendor/ construit dans l'image. Sur Dokploy (pas de volume), vendor/ est
#    déjà là et cette étape ne fait rien.
if [ ! -f vendor/autoload.php ]; then
    echo "[entrypoint] vendor/ absent : composer install..."
    composer install --no-interaction --no-scripts --optimize-autoloader --ignore-platform-reqs
fi

# 📖 Clé de chiffrement Laravel : générée une seule fois dans le .env local. Sans .env
#    (Dokploy), APP_KEY vient des variables d'environnement du service.
if [ -f .env ] && grep -q '^APP_KEY=$' .env; then
    echo "[entrypoint] APP_KEY vide : génération..."
    php artisan key:generate --force
fi

# 📖 Attend que PostgreSQL accepte les connexions avant de migrer. Sans ça, après un
#    redémarrage de Docker le backend plantait (base pas encore joignable) et Swarm le
#    relançait en boucle : plusieurs minutes d'erreurs 502/503. On teste avec Laravel
#    lui-même, donc quelle que soit la source de la config (.env ou variables d'env).
tentative=0
until php -r '
    require "vendor/autoload.php";
    $app = require "bootstrap/app.php";
    $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
    try { Illuminate\Support\Facades\DB::connection()->getPdo(); }
    catch (Throwable $e) { exit(1); }
' >/dev/null 2>&1; do
    tentative=$((tentative + 1))
    if [ "$tentative" -ge 60 ]; then
        echo "[entrypoint] Base de données injoignable après 120 s : abandon."
        exit 1
    fi
    echo "[entrypoint] Base de données pas prête, nouvelle tentative dans 2 s ($tentative/60)..."
    sleep 2
done

# 📖 Sans ce lien symbolique, les images uploadées dans le backoffice (badges,
#    cartes...) sont enregistrées dans storage/app/public mais jamais servies :
#    404 côté app mobile. -f écrase un lien existant sans erreur au redémarrage.
php artisan storage:link --force

php artisan migrate --force

# 📖 Données de référence (cartes, badges, avatars, rôles, super admin...) : uniquement
#    quand RUN_SEEDERS=true (docker-compose local). Les seeders sont idempotents. Jamais
#    déclenché sur Dokploy : la production a ses propres données.
if [ "${RUN_SEEDERS:-false}" = "true" ]; then
    php artisan db:seed --force
fi

# exec : le serveur devient le processus principal du conteneur et reçoit directement
# les signaux d'arrêt (docker stop / mise à jour Swarm), sans attendre le délai de 10 s.
exec php artisan serve --host=0.0.0.0 --port=8000
