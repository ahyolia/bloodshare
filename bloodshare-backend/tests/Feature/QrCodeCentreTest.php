<?php

namespace Tests\Feature;

use App\Models\QrCode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class QrCodeCentreTest extends TestCase
{
    use RefreshDatabase;

    public function test_redirige_un_visiteur_non_connecte_vers_la_connexion_du_bo(): void
    {
        QrCode::create(['type' => 'centre', 'token' => 'centre-1', 'actif' => true]);

        $this->get('/admin/qrcode-centre/download')
            ->assertRedirect(route('filament.admin.auth.login'));
    }

    public function test_telecharge_le_qr_code_centre_actif_en_png(): void
    {
        // 📖 simple-qrcode génère les PNG via imagick, installé dans l'image Docker. Garde-fou
        //    pour un environnement qui ne l'aurait pas (ex. un PHP local) : test sauté plutôt
        //    qu'en échec.
        if (! extension_loaded('imagick')) {
            $this->markTestSkipped('Extension imagick absente : téléchargement PNG impossible.');
        }

        QrCode::create(['type' => 'centre', 'token' => 'centre-1', 'actif' => true]);

        $this->actingAs($this->admin())
            ->get('/admin/qrcode-centre/download')
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png')
            ->assertDownload('qrcode-centre.png');
    }

    public function test_renvoie_404_sans_qr_code_centre_actif(): void
    {
        QrCode::create(['type' => 'centre', 'token' => 'centre-1', 'actif' => false]);

        $this->actingAs($this->admin())
            ->get('/admin/qrcode-centre/download')
            ->assertNotFound();
    }

    public function test_refuse_une_session_sans_acces_au_backoffice(): void
    {
        QrCode::create(['type' => 'centre', 'token' => 'centre-1', 'actif' => true]);

        $this->actingAs(User::factory()->create())
            ->get('/admin/qrcode-centre/download')
            ->assertForbidden();
    }

    public function test_refuse_un_admin_suspendu(): void
    {
        QrCode::create(['type' => 'centre', 'token' => 'centre-1', 'actif' => true]);

        $this->actingAs($this->admin(['statut' => 'suspendu']))
            ->get('/admin/qrcode-centre/download')
            ->assertForbidden();
    }

    private function admin(array $attributs = []): User
    {
        Role::findOrCreate('admin');

        $admin = User::factory()->create(['statut' => 'actif', ...$attributs]);
        $admin->assignRole('admin');

        return $admin;
    }
}
