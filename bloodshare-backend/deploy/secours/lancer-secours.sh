#!/usr/bin/env bash
# Plan B : démarre (ou arrête) le backend de secours préparé par preparer-secours.sh.
# À lancer depuis WSL :
#
#   bash bloodshare-backend/deploy/secours/lancer-secours.sh          # démarrer
#   bash bloodshare-backend/deploy/secours/lancer-secours.sh arreter  # arrêter
#
# Il écoute sur http://localhost:8002 ; ngrok l'expose ensuite sur l'URL fixe du tunnel.
# Voir DEVOPS.md, section 7.
set -euo pipefail

DOSSIER="$HOME/aima-secours"
NOM=aima-secours
PORT=8002
# Image du backend local (docker compose) : PHP et extensions déjà installés.
IMAGE=bloodshare-backend:latest

if [ "${1:-}" = "arreter" ]; then
    docker rm -f "$NOM" > /dev/null 2>&1 && echo "Secours arrêté." || echo "Le secours ne tournait pas."
    exit 0
fi

[ -f "$DOSSIER/.env" ] || { echo "❌ $DOSSIER introuvable : lancer d'abord preparer-secours.sh."; exit 1; }
docker image inspect "$IMAGE" > /dev/null 2>&1 \
    || { echo "❌ Image $IMAGE absente : lancer une fois « docker compose build backend » à la racine du repo."; exit 1; }

# 📖 Le conteneur tourne avec notre utilisateur (l'image n'en définit pas : ce serait root).
#    Des fichiers laissés par un ancien lancement en root bloqueraient les caches.
if [ -n "$(find "$DOSSIER" -user 0 -print -quit)" ]; then
    # 📖 Docker plutôt que sudo : pas de mot de passe à taper, et ça marche sans droits sudo.
    echo "❌ Des fichiers de $DOSSIER appartiennent à root (ancien lancement). Corriger une fois avec :"
    echo "   docker run --rm -v $DOSSIER:/d alpine chown -R $(id -u):$(id -g) /d"
    exit 1
fi

docker rm -f "$NOM" > /dev/null 2>&1 || true

# 📖 Point d'entrée remplacé : celui de l'image (entrypoint.sh) lance composer, les
#    migrations et les seeders du mode dev. Ici, rien ne touche la base : sae203 reste
#    la référence, et ses migrations y sont déjà passées. La config est vérifiée comme en
#    prod, puis mise en cache. PHP_CLI_SERVER_WORKERS : plusieurs requêtes à la fois.
#    Pas de --restart : le secours ne doit pas revenir tout seul au démarrage du PC, branché
#    sur la base de démo avec un code peut-être ancien. Après un redémarrage, on le relance.
echo "▶ Démarrage du secours sur http://localhost:$PORT"
docker run -d --name "$NOM" -u "$(id -u):$(id -g)" -e HOME=/tmp \
    -p "127.0.0.1:$PORT:8000" -v "$DOSSIER":/app -w /app \
    -e PHP_CLI_SERVER_WORKERS=8 \
    --entrypoint sh "$IMAGE" -c '
        set -e
        php artisan securite:verifier-config
        [ -L public/storage ] || php artisan storage:link > /dev/null
        php artisan vendor:publish --tag=livewire:assets --force > /dev/null
        php artisan optimize > /dev/null
        php artisan filament:optimize > /dev/null
        if php artisan migrate:status --pending 2>/dev/null | grep -q Pending; then
            echo "⚠️ Migrations en attente : le secours a un code plus récent que la base."
        fi
        exec php artisan serve --host=0.0.0.0 --port=8000
    ' > /dev/null

for _ in $(seq 1 30); do
    code=$(curl -s -m 5 -o /dev/null -w '%{http_code}' "http://localhost:$PORT/api/stock-sang" || true)
    [ "$code" = 200 ] && break
    sleep 2
done

if [ "$code" != 200 ]; then
    echo "❌ Le secours ne répond pas (HTTP $code). Journal :"
    docker logs --tail 30 "$NOM"
    exit 1
fi

URL=$(grep '^APP_URL=' "$DOSSIER/.env" | cut -d= -f2-)
echo "✅ Secours en marche (API 200 sur localhost:$PORT)."
echo
echo "Étape suivante : exposer le secours sur $URL"
echo "  1. arrêter le tunnel ngrok en cours (il pointe sur le backend de dev, port 8000)"
echo "  2. ngrok http --url=${URL#https://} $PORT"
echo "  3. glisser le dossier Téléchargements/aima-dist-secours dans Netlify (site aima-nc)"
