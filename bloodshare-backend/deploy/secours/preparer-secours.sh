#!/usr/bin/env bash
# Plan B : prépare, À L'AVANCE, un backend de secours sur ce PC, prêt à remplacer sae203
# si le Pi tombe pendant une démo. Même code (branche dev), même base Neon, mêmes clés
# VAPID : les comptes, le contenu et les abonnements push restent les mêmes.
# À lancer depuis WSL, à la racine du repo, quand sae203 marche encore (pour copier ses images) :
#
#   bash bloodshare-backend/deploy/secours/preparer-secours.sh [branche]
#
# Puis, le jour d'une panne : lancer-secours.sh. Voir DEVOPS.md, section 7.
set -euo pipefail

REPO=$(git rev-parse --show-toplevel)
BRANCHE=${1:-dev}
DOSSIER="$HOME/aima-secours"
ENV_PROD="$REPO/bloodshare-backend/.env.production"
SERVEUR=cameliaa@sae203.hopto.org

[ -f "$ENV_PROD" ] || { echo "❌ $ENV_PROD introuvable : le secours utilise la même base et les mêmes clés."; exit 1; }

# 📖 Adresse du tunnel ngrok : lue dans .env.production (hors du dépôt), comme les autres
#    secrets. URL_SECOURS=<adresse> en variable d'environnement la remplace.
URL_SECOURS=${URL_SECOURS:-$(grep '^SECOURS_URL=' "$ENV_PROD" | cut -d= -f2- || true)}
[ -n "$URL_SECOURS" ] || { echo "❌ SECOURS_URL absent de $ENV_PROD (adresse du tunnel ngrok, voir DEVOPS.md section 7)."; exit 1; }

NOUVEAU="$DOSSIER.nouveau"
rm -rf "$NOUVEAU" && mkdir -p "$NOUVEAU"
trap 'rm -rf "$NOUVEAU"' EXIT

echo "▶ Export de $BRANCHE ($(git -C "$REPO" rev-parse --short "$BRANCHE"))"
git -C "$REPO" archive "$BRANCHE" bloodshare-backend | tar -x -C "$NOUVEAU" --strip-components=1

echo "▶ Dépendances (sans les paquets de dev)"
docker run --rm -u "$(id -u):$(id -g)" -e COMPOSER_HOME=/tmp/composer \
    -v "$NOUVEAU":/app -w /app composer:2 \
    install --no-dev --optimize-autoloader --no-scripts --no-interaction --ignore-platform-reqs --quiet

# 📖 Même .env que sae203 (base Neon, APP_KEY, clés VAPID), sauf ce qui dépend de
#    l'adresse : APP_URL et SESSION_PATH (le secours est servi à la racine du tunnel).
echo "▶ Configuration (base Neon, URL $URL_SECOURS)"
( umask 077 && cp "$ENV_PROD" "$NOUVEAU/.env" )
sed -i "s|^APP_URL=.*|APP_URL=$URL_SECOURS|; s|^SESSION_PATH=.*|SESSION_PATH=/|" "$NOUVEAU/.env"
sed -i '1i # ⚠️ Backend de SECOURS (plan B), généré par preparer-secours.sh : ne pas modifier à la main.' "$NOUVEAU/.env"

# 📖 Les images du backoffice ne sont que sur le Pi. Si le Pi ne répond pas, on garde
#    celles de la préparation précédente plutôt que de repartir sans images.
echo "▶ Images du backoffice"
mkdir -p "$NOUVEAU/storage/app"
if ssh -o ConnectTimeout=10 -o BatchMode=no "$SERVEUR" 'tar -cz -C ~/aima/backend/storage/app public' \
        | tar -xz -C "$NOUVEAU/storage/app" 2>/dev/null; then
    echo "   copiées depuis sae203 : $(find "$NOUVEAU/storage/app/public" -type f ! -name .gitignore | wc -l) fichier(s)"
elif [ -d "$DOSSIER/storage/app/public" ]; then
    cp -a "$DOSSIER/storage/app/public/." "$NOUVEAU/storage/app/public/"
    echo "   ⚠️ sae203 injoignable : images de la préparation précédente reprises"
else
    echo "   ⚠️ sae203 injoignable et aucune copie précédente : le secours démarrera sans images"
fi

rm -rf "$DOSSIER"
mv "$NOUVEAU" "$DOSSIER"
trap - EXIT
echo "✅ Secours prêt dans $DOSSIER. Le jour d'une panne : bash bloodshare-backend/deploy/secours/lancer-secours.sh"
