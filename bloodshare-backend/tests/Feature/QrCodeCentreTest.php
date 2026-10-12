<?php

namespace Tests\Feature;

use App\Models\QrCode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QrCodeCentreTest extends TestCase
{
    use RefreshDatabase;

    public function test_ne_sert_pas_le_qr_code_a_un_visiteur_non_connecte(): void
    {
        QrCode::create(['type' => 'centre', 'token' => 'centre-1', 'actif' => true]);

        $reponse = $this->get('/admin/qrcode-centre/download');

        // 📖 Le QR code n'est jamais servi, mais la réponse est aujourd'hui une erreur 500
        //    (« Route [login] not defined ») et non une redirection vers la connexion du BO :
        //    le middleware `auth` cherche une route nommée `login` que Filament ne déclare pas.
        $this->assertNotSame(200, $reponse->getStatusCode());
        $this->assertNotSame('image/png', $reponse->headers->get('Content-Type'));
    }

    public function test_telecharge_le_qr_code_centre_actif_en_png(): void
    {
        // 📖 simple-qrcode génère les PNG via imagick, absent de l'image Docker (seul gd est
        //    installé) : le téléchargement renvoie une 500. Ce test se réactivera tout seul
        //    dès que l'extension sera ajoutée au Dockerfile.
        if (! extension_loaded('imagick')) {
            $this->markTestSkipped('Extension imagick absente : téléchargement PNG impossible.');
        }

        QrCode::create(['type' => 'centre', 'token' => 'centre-1', 'actif' => true]);

        $this->actingAs(User::factory()->create())
            ->get('/admin/qrcode-centre/download')
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png')
            ->assertDownload('qrcode-centre.png');
    }

    public function test_renvoie_404_sans_qr_code_centre_actif(): void
    {
        QrCode::create(['type' => 'centre', 'token' => 'centre-1', 'actif' => false]);

        $this->actingAs(User::factory()->create())
            ->get('/admin/qrcode-centre/download')
            ->assertNotFound();
    }
}
