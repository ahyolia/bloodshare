<?php

namespace App\Console\Commands;

use App\Models\DocumentJuridique;
use Illuminate\Console\Command;

class ImporterDocumentsJuridiques extends Command
{
    protected $signature = 'juridique:importer
        {--force : Remplace aussi un document déjà rédigé dans le backoffice}
        {--numero= : Numéro de version à enregistrer sur les documents importés (ex. 1.1)}';

    protected $description = 'Charge en base les textes juridiques de resources/juridique';

    /** Fichier de resources/juridique pour chaque type de document. */
    public const FICHIERS = [
        'cgu' => 'cgu.md',
        'confidentialite' => 'politique-confidentialite.md',
        'mentions_legales' => 'mentions-legales.md',
    ];

    // 📖 Lancée à chaque déploiement (installer.sh, entrypoint.sh) : sans --force, elle ne
    //    remplit que les documents encore vides, et ne touche jamais un texte modifié
    //    depuis le backoffice. --force sert à publier une nouvelle version des fichiers.
    public function handle(): int
    {
        $force = (bool) $this->option('force');
        $version = $this->option('numero');

        foreach (self::FICHIERS as $type => $fichier) {
            $document = DocumentJuridique::where('type', $type)->first();
            $contenu = trim((string) file_get_contents(resource_path("juridique/{$fichier}")));

            if (! $document) {
                $this->warn("{$type} : document absent de la base, migrations à lancer.");

                continue;
            }

            if (filled($document->contenu) && ! $force) {
                $this->line("{$type} : déjà rédigé, conservé.");

                continue;
            }

            if ($document->contenu === $contenu && ! $version) {
                $this->line("{$type} : déjà à jour.");

                continue;
            }

            $document->update(array_filter([
                'contenu' => $contenu,
                'version' => $version,
            ]));
            $this->info("{$type} : importé (version {$document->version}).");
        }

        return self::SUCCESS;
    }
}
