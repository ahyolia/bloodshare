#!/usr/bin/env bash
# Termine l'installation du backend sur le serveur de démo sae203 (Raspberry Pi).
# Lancé automatiquement par publier.sh ; peut aussi se relancer à la main :
#
#   bash ~/aima/backend/deploy/sae203/installer.sh
#
# Sans risque à relancer : chaque étape vérifie ce qui est déjà en place.
set -euo pipefail

APP="$HOME/aima/backend"
URL="https://sae203.hopto.org/~cameliaa"
cd "$APP"

echo "▶ Vérification du serveur"
[ -f .env ] || { echo "❌ $APP/.env manquant : relancer publier.sh."; exit 1; }
manque=""
for ext in intl pdo_pgsql bcmath imagick; do
    php -m | grep -qix "$ext" || manque="$manque php8.2-${ext/pdo_/}"
done
if [ -n "$manque" ]; then
    echo "❌ Extensions PHP manquantes, à faire installer par l'admin du serveur :"
    echo "   sudo apt install$manque && sudo systemctl restart apache2"
    exit 1
fi

echo "▶ Fichiers Laravel"
cp deploy/sae203/.htaccess public/.htaccess
php artisan package:discover --no-ansi > /dev/null
[ -L public/storage ] || php artisan storage:link --no-ansi

# 📖 Apache tourne sous www-data, le cron et SSH sous cameliaa : les deux doivent
#    pouvoir écrire dans storage/ et bootstrap/cache/. Les ACL le permettent sans
#    rendre le code ni le .env lisibles par les autres comptes du serveur.
echo "▶ Permissions"
if command -v setfacl > /dev/null; then
    chmod 711 "$HOME"
    chmod -R o-rwx "$HOME/aima"
    setfacl -R -m u:www-data:rX "$HOME/aima"
    setfacl -R -m u:www-data:rwX -m d:u:www-data:rwX -m u:"$USER":rwX -m d:u:"$USER":rwX \
        storage bootstrap/cache
else
    # Repli sans ACL : fonctionne, mais le code et le .env restent lisibles par tous.
    echo "⚠️  setfacl absent : storage/ et bootstrap/cache/ passent en 777."
    chmod -R 777 storage bootstrap/cache
    chmod 644 .env
fi

echo "▶ Dossier web (~/public_html → public/)"
if [ -d "$HOME/public_html" ] && [ ! -L "$HOME/public_html" ]; then
    archive="$HOME/ancien-public_html-$(date +%Y%m%d-%H%M%S)"
    mv "$HOME/public_html" "$archive"
    chmod 700 "$archive"
    echo "   Ancien contenu déplacé (hors ligne) dans $archive"
fi
ln -sfn "$APP/public" "$HOME/public_html"

echo "▶ Base de données"
php artisan migrate --force --no-ansi

# 📖 Mise en cache après les migrations : une fois la config en cache, env()
#    renvoie null hors des fichiers config/ (les seeders ne trouveraient plus
#    SEED_ADMIN_EMAIL). Lancer les seeders avant, ou après optimize:clear.
echo "▶ Mise en cache"
php artisan optimize:clear --no-ansi > /dev/null
php artisan optimize --no-ansi > /dev/null
php artisan filament:optimize --no-ansi > /dev/null

echo "▶ Tâches planifiées (cron)"
ligne="* * * * * cd $APP && php artisan schedule:run >> /dev/null 2>&1"
{ { crontab -l 2>/dev/null || true; } | { grep -vF 'schedule:run' || true; }; echo "$ligne"; } | crontab -
echo "   $(crontab -l | grep -c 'schedule:run') ligne schedule:run dans le crontab"

# 📖 --resolve : depuis le Pi, sae203.hopto.org pointe vers l'IP publique de la box,
#    qui ne sait pas toujours renvoyer la requête vers son propre réseau.
echo "▶ Vérification en ligne"
local_=(--resolve sae203.hopto.org:443:127.0.0.1)
code=$(curl -s "${local_[@]}" -o /dev/null -w '%{http_code}' "$URL/api/stock-sang" || true)
admin=$(curl -s "${local_[@]}" -o /dev/null -w '%{http_code}' "$URL/admin/login" || true)
echo "   API      $URL/api/stock-sang → HTTP $code"
echo "   Backoffice $URL/admin/login → HTTP $admin"
if [ "$code" = "200" ] && [ "$admin" = "200" ]; then
    echo "✅ Déploiement terminé."
else
    echo "❌ Le site ne répond pas comme prévu : voir storage/logs/laravel-$(date +%F).log"
    exit 1
fi
