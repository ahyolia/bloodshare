<?php

namespace Tests\Feature;

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
}
