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
# 📖 Servi par sa route, livewire.min.js serait appelé à la racine du domaine (sans
#    /~cameliaa) ; publié dans public/vendor, Livewire génère son URL avec url(),
#    qui garde le sous-dossier. Republier à chaque fois : la version doit suivre vendor/.
php artisan vendor:publish --tag=livewire:assets --force --no-ansi > /dev/null

# 📖 Même garde que entrypoint.sh (Docker) : refuser une config de prod dangereuse
#    (APP_DEBUG, APP_KEY vide, mot de passe de .env.example...) AVANT les migrations.
#    config:clear d'abord, sinon c'est la config en cache de la version précédente
#    qui serait vérifiée, pas le .env qui vient d'arriver.
echo "▶ Configuration de production"
php artisan config:clear --no-ansi > /dev/null
php artisan securite:verifier-config --no-ansi

# 📖 Apache tourne sous www-data, le cron et SSH sous cameliaa : les deux doivent
#    pouvoir écrire dans storage/ et bootstrap/cache/. Les ACL le permettent sans
#    rendre le code ni le .env lisibles par les autres comptes du serveur.
echo "▶ Permissions"
#    Seuls les fichiers de $USER sont modifiés : ceux qu'Apache a créés (vues compilées,
#    sessions) appartiennent à www-data, chmod/setfacl y sont refusés, et c'est inutile
#    (www-data en est propriétaire, $USER y accède par les ACL par défaut des dossiers).
#    Un « chmod -R » arrêtait le script ici, laissant le site en 403.
#    « ! -readable -prune » saute les dossiers qu'Apache crée en 700 (ex. l'upload
#    temporaire de Livewire, storage/app/private/livewire-tmp) : find ne peut pas les
#    ouvrir, s'arrêtait en erreur, et il n'y a rien à y changer.
mes_fichiers() { find "$@" \( ! -readable -prune \) -o -user "$USER" -print0; }
mes_dossiers() { find "$@" \( ! -readable -prune \) -o -type d -user "$USER" -print0; }
if command -v setfacl > /dev/null; then
    chmod 711 "$HOME"
    mes_fichiers "$HOME/aima" | xargs -0 -r chmod o-rwx
    mes_fichiers "$HOME/aima" | xargs -0 -r setfacl -m u:www-data:rX
    mes_fichiers storage bootstrap/cache | xargs -0 -r setfacl -m u:www-data:rwX -m u:"$USER":rwX
    mes_dossiers storage bootstrap/cache | xargs -0 -r setfacl -m d:u:www-data:rwX -m d:u:"$USER":rwX
else
    # Repli sans ACL : fonctionne, mais le code et le .env restent lisibles par tous.
    echo "⚠️  setfacl absent : storage/ et bootstrap/cache/ passent en 777."
    mes_fichiers storage bootstrap/cache | xargs -0 -r chmod 777
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
page=$(mktemp)
admin=$(curl -s "${local_[@]}" -o "$page" -w '%{http_code}' "$URL/admin/login" || true)
# Un 200 ne suffit pas : sans le sous-dossier dans les URLs Livewire, la page
# s'affiche mais le formulaire de connexion ne fonctionne pas.
livewire=$(grep -oE '(src|data-update-uri)="[^"]*livewire[^"]*"' "$page" | grep -vc '/~cameliaa/' || true)
rm -f "$page"
echo "   API      $URL/api/stock-sang → HTTP $code"
echo "   Backoffice $URL/admin/login → HTTP $admin"
echo "   URLs Livewire hors du sous-dossier : $livewire"
if [ "$code" = "200" ] && [ "$admin" = "200" ] && [ "$livewire" = "0" ]; then
    echo "✅ Déploiement terminé."
else
    echo "❌ Le site ne répond pas comme prévu : voir storage/logs/laravel-$(date +%F).log"
    exit 1
fi
