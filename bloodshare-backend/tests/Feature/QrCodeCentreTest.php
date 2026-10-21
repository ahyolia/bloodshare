<?php

namespace Tests\Feature;

use App\Filament\Pages\QrCodeCentre;
use App\Models\QrCode;
use App\Models\User;
use App\Services\QrCentreTournant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Livewire\Livewire;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class QrCodeCentreTest extends TestCase
{
    use RefreshDatabase;

    // ── Écran du centre ─────────────────────────────────────────

    public function test_affiche_le_qr_tournant_avec_un_lien_signe(): void
    {
        $qr = QrCode::create(['type' => 'centre', 'token' => 'centre-1', 'actif' => true]);

        $this->get($this->lienAffichage($qr))
            ->assertOk()
            ->assertSee('<svg', false)
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertSee('<meta http-equiv="refresh"', false);
    }

    public function test_n_affiche_jamais_le_token_secret(): void
    {
        $qr = QrCode::create(['type' => 'centre', 'token' => 'secret-centre-1', 'actif' => true]);

        $this->get($this->lienAffichage($qr))->assertOk()->assertDontSee('secret-centre-1');
        $this->actingAs($this->admin())->get('/admin/qr-code-centre')->assertOk()->assertDontSee('secret-centre-1');
    }

    public function test_refuse_un_lien_non_signe(): void
    {
        $qr = QrCode::create(['type' => 'centre', 'token' => 'centre-1', 'actif' => true]);

        $this->get("/qrcode-centre/affichage/{$qr->id}")->assertForbidden();
    }

    public function test_l_ancien_lien_ne_marche_plus_apres_regeneration(): void
    {
        $qr = QrCode::create(['type' => 'centre', 'token' => 'centre-1', 'actif' => true]);
        $lien = $this->lienAffichage($qr);

        $qr->update(['actif' => false]);

        $this->get($lien)->assertNotFound();
    }

    public function test_refuse_un_qr_d_evenement(): void
    {
        $qr = QrCode::create(['type' => 'evenement', 'token' => 'evt-1', 'actif' => true]);

        $this->get($this->lienAffichage($qr))->assertNotFound();
    }

    // ── Page du BO ──────────────────────────────────────────────

    public function test_la_page_du_bo_donne_le_lien_de_l_ecran(): void
    {
        QrCode::create(['type' => 'centre', 'token' => 'centre-1', 'actif' => true]);

        $this->actingAs($this->admin())
            ->get('/admin/qr-code-centre')
            ->assertOk()
            ->assertSee('/qrcode-centre/affichage/', false)
            // 📖 Chaque bouton dans la section qu'il concerne, pas en haut de page.
            ->assertSeeInOrder([
                'Régénérer le QR Code',
                "Lien de l'écran du centre", "Ouvrir l'affichage",
                'QR de secours (imprimé)', 'Imprimer', 'Télécharger (PNG)', 'Télécharger (PDF)', 'Activer le mode secours',
            ], false);
    }

    public function test_le_jeton_affiche_valide_un_don(): void
    {
        // 📖 Bout en bout : ce que l'écran encode est bien ce que /scan accepte.
        $qr = QrCode::create(['type' => 'centre', 'token' => 'centre-1', 'actif' => true]);

        $this->assertSame($qr->id, app(QrCentreTournant::class)->verifier(app(QrCentreTournant::class)->jetonCourant($qr))?->id);
    }

    // ── Téléchargement PNG / PDF ────────────────────────────────

    public function test_telecharge_le_qr_de_secours_du_centre_en_png(): void
    {
        $this->sansImagickSauter();
        $qr = QrCode::create(['type' => 'centre', 'token' => 'centre-1', 'actif' => true]);

        $this->actingAs($this->admin())
            ->get(route('qrcode.telecharger', ['qrCode' => $qr, 'format' => 'png']))
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png')
            ->assertDownload('qrcode-centre-secours.png');
    }

    public function test_telecharge_le_qr_d_un_evenement_en_pdf(): void
    {
        $this->sansImagickSauter();
        $qr = QrCode::create(['type' => 'evenement', 'token' => 'evt-1', 'actif' => true]);

        $reponse = $this->actingAs($this->admin())
            ->get(route('qrcode.telecharger', ['qrCode' => $qr, 'format' => 'pdf']))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');

        $this->assertStringStartsWith('%PDF', $reponse->getContent());
    }

    public function test_imprimer_ouvre_le_pdf_dans_l_onglet_au_lieu_de_le_telecharger(): void
    {
        $this->sansImagickSauter();
        $qr = QrCode::create(['type' => 'centre', 'token' => 'centre-1', 'actif' => true]);

        $reponse = $this->actingAs($this->admin())
            ->get(route('qrcode.telecharger', ['qrCode' => $qr, 'format' => 'pdf', 'imprimer' => 1]))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');

        $this->assertStringStartsWith('inline', $reponse->headers->get('Content-Disposition'));
    }

    public function test_active_puis_desactive_le_mode_secours_depuis_sa_section(): void
    {
        $qr = QrCode::create(['type' => 'centre', 'token' => 'centre-1', 'actif' => true]);
        $this->actingAs($this->admin());

        Livewire::test(QrCodeCentre::class)
            ->assertActionHidden('desactiverSecours')
            ->callAction('activerSecours')
            ->assertActionVisible('desactiverSecours')
            ->assertActionHidden('activerSecours');

        $this->assertTrue($qr->fresh()->secoursActif());

        Livewire::test(QrCodeCentre::class)->callAction('desactiverSecours');

        $this->assertFalse($qr->fresh()->secoursActif());
    }

    public function test_refuse_le_telechargement_sans_acces_au_backoffice(): void
    {
        $qr = QrCode::create(['type' => 'centre', 'token' => 'centre-1', 'actif' => true]);
        $lien = route('qrcode.telecharger', ['qrCode' => $qr, 'format' => 'png']);

        $this->actingAs(User::factory()->create())->get($lien)->assertForbidden();
        $this->actingAs($this->admin(['statut' => 'suspendu']))->get($lien)->assertForbidden();
    }

    public function test_redirige_un_visiteur_non_connecte_vers_la_connexion_du_bo(): void
    {
        $qr = QrCode::create(['type' => 'centre', 'token' => 'centre-1', 'actif' => true]);

        $this->get(route('qrcode.telecharger', ['qrCode' => $qr, 'format' => 'png']))
            ->assertRedirect(route('filament.admin.auth.login'));
    }

    private function sansImagickSauter(): void
    {
        // 📖 simple-qrcode génère les PNG via imagick, installé dans l'image Docker. Garde-fou
        //    pour un environnement qui ne l'aurait pas (ex. un PHP local).
        if (! extension_loaded('imagick')) {
            $this->markTestSkipped('Extension imagick absente : génération PNG impossible.');
        }
    }

    private function lienAffichage(QrCode $qr): string
    {
        return URL::signedRoute('qrcode.centre.affichage', ['qrCode' => $qr], absolute: false);
    }

    private function admin(array $attributs = []): User
    {
        Role::findOrCreate('admin');

        $admin = User::factory()->create(['statut' => 'actif', ...$attributs]);
        $admin->assignRole('admin');

        return $admin;
    }
}
