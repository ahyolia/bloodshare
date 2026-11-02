<?php

namespace Tests\Feature;

use App\Console\Commands\ImporterDocumentsJuridiques;
use App\Models\DocumentJuridique;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentsJuridiquesTest extends TestCase
{
    use RefreshDatabase;

    public function test_la_migration_cree_les_trois_documents(): void
    {
        $this->assertEqualsCanonicalizing(
            array_keys(DocumentJuridique::TYPES),
            DocumentJuridique::pluck('type')->all()
        );
    }

    public function test_renvoie_un_document_redige_sans_etre_connecte(): void
    {
        DocumentJuridique::where('type', 'cgu')->first()
            ->update(['contenu' => "## Objet\n\nAïma est éditée par l'ADSB-NC.", 'version' => '1.1']);

        $this->getJson('/api/documents-juridiques/cgu')
            ->assertOk()
            ->assertJsonPath('type', 'cgu')
            ->assertJsonPath('titre', "Conditions générales d'utilisation")
            ->assertJsonPath('contenu', "## Objet\n\nAïma est éditée par l'ADSB-NC.")
            ->assertJsonPath('version', '1.1')
            ->assertJsonStructure(['mis_a_jour_le']);
    }

    public function test_un_document_pas_encore_redige_renvoie_404(): void
    {
        $this->getJson('/api/documents-juridiques/mentions_legales')->assertNotFound();
    }

    public function test_un_type_inconnu_renvoie_404(): void
    {
        $this->getJson('/api/documents-juridiques/inconnu')->assertNotFound();
    }

    public function test_l_import_remplit_les_documents_vides_depuis_les_fichiers(): void
    {
        $this->artisan('juridique:importer')->assertSuccessful();

        foreach (ImporterDocumentsJuridiques::FICHIERS as $type => $fichier) {
            $this->assertSame(
                trim(file_get_contents(resource_path("juridique/{$fichier}"))),
                DocumentJuridique::where('type', $type)->value('contenu')
            );
        }
        $this->getJson('/api/documents-juridiques/mentions_legales')
            ->assertOk()
            ->assertJsonPath('version', '1.0');
    }

    public function test_les_textes_publies_n_ont_plus_de_champ_a_completer(): void
    {
        foreach (ImporterDocumentsJuridiques::FICHIERS as $fichier) {
            $this->assertStringNotContainsString('À COMPLÉTER', file_get_contents(resource_path("juridique/{$fichier}")));
        }
    }

    public function test_l_import_ne_remplace_pas_un_texte_modifie_dans_le_bo_sans_force(): void
    {
        DocumentJuridique::where('type', 'cgu')->update(['contenu' => 'Texte du BO', 'version' => '1.3']);

        $this->artisan('juridique:importer')->assertSuccessful();
        $this->assertSame('Texte du BO', DocumentJuridique::where('type', 'cgu')->value('contenu'));

        $this->artisan('juridique:importer', ['--force' => true, '--numero' => '1.4'])->assertSuccessful();
        $cgu = DocumentJuridique::where('type', 'cgu')->first();
        $this->assertSame(trim(file_get_contents(resource_path('juridique/cgu.md'))), $cgu->contenu);
        $this->assertSame('1.4', $cgu->version);
    }
}
