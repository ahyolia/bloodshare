<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * 📖 Lancée par entrypoint.sh avant de démarrer le serveur en production : une config
 *    dangereuse (debug affiché aux visiteurs, mots de passe du .env.example) empêche le
 *    conteneur de démarrer, plutôt que de passer inaperçue (audit cybersécurité).
 */
class VerifierConfigSecurite extends Command
{
    protected $signature = 'securite:verifier-config';

    protected $description = 'Refuse une configuration de production dangereuse (debug, mots de passe de développement...)';

    // 📖 Valeurs de .env.example et docker-compose.yml : publiques, puisque le dépôt l'est.
    private const MOTS_DE_PASSE_DE_DEV = ['bloodshare123', 'Admin-local-1234'];

    public function handle(): int
    {
        if (! app()->isProduction()) {
            $this->info('Environnement ' . app()->environment() . ' : vérification réservée à la production.');

            return self::SUCCESS;
        }

        $problemes = array_keys(array_filter([
            'APP_DEBUG est actif : les erreurs détaillées (requêtes SQL, chemins, variables) seraient affichées aux visiteurs.' => config('app.debug'),
            "APP_KEY est vide : les sessions et les liens signés ne seraient pas protégés." => empty(config('app.key')),
            'DB_PASSWORD reprend le mot de passe de développement.' => in_array(config('database.connections.pgsql.password'), self::MOTS_DE_PASSE_DE_DEV, true),
            'SEED_ADMIN_PASSWORD reprend le mot de passe de développement.' => in_array(config('app.seed_admin_password'), self::MOTS_DE_PASSE_DE_DEV, true),
            "SESSION_SECURE_COOKIE est désactivé : le cookie de session du BO partirait aussi en HTTP." => ! config('session.secure'),
            "CORS_ALLOWED_ORIGINS vaut * : n'importe quel site pourrait appeler l'API depuis le navigateur de ses visiteurs. Y mettre l'URL exacte du front." => in_array('*', (array) config('cors.allowed_origins'), true),
        ]));

        if ($problemes === []) {
            $this->info('Configuration de production vérifiée.');

            return self::SUCCESS;
        }

        foreach ($problemes as $probleme) {
            $this->error($probleme);
        }

        return self::FAILURE;
    }
}
