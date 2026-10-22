#!/usr/bin/env bash
# Construit une version du backend et l'installe sur le serveur de démo sae203.
# À lancer depuis WSL, à la racine du repo :
#
#   bash bloodshare-backend/deploy/sae203/publier.sh [branche]
#
# Par défaut, publie la branche courante. Seul le code COMMITÉ part : les
# modifications en cours sont ignorées. Voir DEVOPS.md, section 6.
set -euo pipefail

REPO=$(git rev-parse --show-toplevel)
BRANCHE=${1:-$(git -C "$REPO" branch --show-current)}
SERVEUR=cameliaa@sae203.hopto.org
ENV_PROD="$REPO/bloodshare-backend/.env.production"

[ -f "$ENV_PROD" ] || { echo "❌ $ENV_PROD introuvable (voir DEVOPS.md, section 6)."; exit 1; }
if grep -q 'A_REMPLACER' "$ENV_PROD"; then
    echo "❌ .env.production contient encore des A_REMPLACER :"
    grep 'A_REMPLACER' "$ENV_PROD" | cut -d= -f1
    exit 1
fi

BUILD=$(mktemp -d)
trap 'rm -rf "$BUILD"' EXIT

echo "▶ Export de $BRANCHE ($(git -C "$REPO" rev-parse --short "$BRANCHE"))"
git -C "$REPO" archive "$BRANCHE" bloodshare-backend | tar -x -C "$BUILD" --strip-components=1

# 📖 vendor/ est construit ici plutôt que sur le Pi (1,8 Go de RAM, swap pleine).
#    --ignore-platform-reqs : l'image composer n'a ni intl ni pdo_pgsql, mais le
#    composer.lock est déjà résolu pour PHP 8.2 et installer.sh vérifie les
#    extensions sur le serveur. --no-scripts : package:discover tourne sur le Pi.
echo "▶ Installation des dépendances (sans les paquets de dev)"
docker run --rm -u "$(id -u):$(id -g)" -e COMPOSER_HOME=/tmp/composer \
    -v "$BUILD":/app -w /app composer:2 \
    install --no-dev --optimize-autoloader --no-scripts --no-interaction --ignore-platform-reqs --quiet

# 📖 Une seule connexion SSH partagée : le mot de passe n'est demandé qu'une fois.
SOCKET=$(mktemp -u /tmp/aima-ssh-XXXXXX)
SSH=(ssh -o ControlMaster=auto -o ControlPath="$SOCKET" -o ControlPersist=120)
trap 'rm -rf "$BUILD"; "${SSH[@]}" -O exit "$SERVEUR" 2>/dev/null || true' EXIT

echo "▶ Envoi sur $SERVEUR"
# vendor/ est vidé avant l'extraction pour ne pas garder d'anciens fichiers.
tar -cz -C "$BUILD" . | "${SSH[@]}" "$SERVEUR" \
    'mkdir -p ~/aima/backend && rm -rf ~/aima/backend/vendor && tar -xz -C ~/aima/backend'
"${SSH[@]}" "$SERVEUR" 'umask 077 && cat > ~/aima/backend/.env' < "$ENV_PROD"

echo "▶ Installation sur le serveur"
"${SSH[@]}" -t "$SERVEUR" 'bash ~/aima/backend/deploy/sae203/installer.sh'
