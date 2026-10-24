#!/usr/bin/env bash
# Sauvegarde la base Neon de la démo (sae203) sur ce PC, en lecture seule.
# À lancer depuis WSL, à la racine du repo, avant chaque démo :
#
#   bash bloodshare-backend/deploy/secours/sauvegarder-neon.sh
#
# 📖 Le fichier contient des données personnelles (emails, mots de passe hachés) :
#    il est rangé HORS du repo (public), lisible par son seul propriétaire, et ne
#    doit être ni commité, ni partagé. Restauration : DEVOPS.md, section 7.
set -euo pipefail

REPO=$(git rev-parse --show-toplevel)
ENV_PROD="$REPO/bloodshare-backend/.env.production"
DOSSIER="$HOME/sauvegardes-aima"
GARDER=10
# 📖 pg_dump doit être d'une version au moins égale à celle du serveur (Neon : Postgres 18).
IMAGE=postgres:18-alpine

[ -f "$ENV_PROD" ] || { echo "❌ $ENV_PROD introuvable."; exit 1; }
val() { grep "^$1=" "$ENV_PROD" | cut -d= -f2- | tr -d '"'; }

umask 077
mkdir -p "$DOSSIER"
chmod 700 "$DOSSIER"
FICHIER="$DOSSIER/neon-$(date +%Y%m%d-%H%M%S).dump"

echo "▶ Sauvegarde de $(val DB_DATABASE) sur $(val DB_HOST)"
# Format « custom » (-Fc) : compressé, et restaurable table par table avec pg_restore.
docker run --rm -e PGPASSWORD="$(val DB_PASSWORD)" -v "$DOSSIER":/sauvegardes "$IMAGE" \
    pg_dump "host=$(val DB_HOST) port=$(val DB_PORT) dbname=$(val DB_DATABASE) user=$(val DB_USERNAME) sslmode=require" \
    -Fc --no-owner --no-acl -f "/sauvegardes/$(basename "$FICHIER")"

# Le conteneur écrit en root : on rend le fichier à l'utilisateur, toujours en 600.
docker run --rm -v "$DOSSIER":/sauvegardes "$IMAGE" chown "$(id -u):$(id -g)" "/sauvegardes/$(basename "$FICHIER")"
chmod 600 "$FICHIER"

echo "▶ Vérification"
TABLES=$(docker run --rm -v "$DOSSIER":/sauvegardes "$IMAGE" pg_restore --list "/sauvegardes/$(basename "$FICHIER")" | grep -c ' TABLE DATA ')
[ "$TABLES" -gt 0 ] || { echo "❌ Sauvegarde vide ou illisible : $FICHIER"; exit 1; }
echo "   $TABLES tables, $(du -h "$FICHIER" | cut -f1)"

# On garde les $GARDER plus récentes (le nom contient la date : l'ordre alphabétique suffit).
mapfile -t TOUTES < <(printf '%s\n' "$DOSSIER"/neon-*.dump | sort -r)
for ancienne in "${TOUTES[@]:$GARDER}"; do rm -f "$ancienne"; done
GARDEES=$(( ${#TOUTES[@]} < GARDER ? ${#TOUTES[@]} : GARDER ))
echo "✅ $FICHIER"
echo "   ($GARDEES sauvegarde(s) dans $DOSSIER, les $GARDER plus récentes sont gardées)"
