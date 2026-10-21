<?php

namespace Tests\Feature;

use App\Filament\Pages\Auth\Connexion;
use App\Models\User;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Livewire\Livewire;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ConnexionBackofficeTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        Filament::setCurrentPanel(Filament::getPanel('admin'));
        Role::findOrCreate('admin');
        $this->admin = User::factory()->create([
            'email' => 'admin@example.test',
            'password' => Hash::make('BonMdp12345'),
            'statut' => 'actif',
        ]);
        $this->admin->assignRole('admin');
    }

    public function test_bloque_un_compte_apres_5_echecs_meme_si_l_ip_change(): void
    {
        for ($i = 1; $i <= Connexion::TENTATIVES_MAX; $i++) {
            $this->tenter('FauxMdp')->assertHasErrors('data.email');
            // 📖 Simule un changement d'IP : vide la limite par IP de Filament à chaque essai.
            RateLimiter::clear('livewire-rate-limiter:' . sha1(Connexion::class . '|authenticate|' . request()->ip()));
        }

        // Même le bon mot de passe est refusé tant que le compte est bloqué.
        $this->tenter('BonMdp12345')->assertNotified('Trop de tentatives de connexion');
        $this->assertGuest();
    }

    public function test_la_connexion_reussie_remet_le_compteur_a_zero(): void
    {
        $this->tenter('FauxMdp');
        $this->tenter('BonMdp12345')->assertHasNoErrors();

        $this->assertSame(0, RateLimiter::attempts(Connexion::cle('admin@example.test')));
    }

    private function tenter(string $motDePasse)
    {
        return Livewire::test(Connexion::class)
            ->set('data.email', 'admin@example.test')
            ->set('data.password', $motDePasse)
            ->call('authenticate');
    }
}
