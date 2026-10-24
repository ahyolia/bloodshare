<?php

namespace Tests\Feature;

use App\Models\Badge;
use App\Models\User;
use App\Notifications\BadgeDebloqueNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BadgesAFeterTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Badge $badge;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->badge = Badge::create(['nom' => 'Premier Pas', 'condition_type' => 'nb_dons', 'condition_valeur' => 1, 'statut' => 'actif']);
        Sanctum::actingAs($this->user);
    }

    public function test_la_notification_garde_l_identifiant_du_badge(): void
    {
        $this->user->notify(new BadgeDebloqueNotification($this->badge));

        $this->assertSame($this->badge->id, $this->user->notifications()->first()->data['badge_id']);
    }

    public function test_liste_les_badges_dont_la_notification_n_est_pas_lue(): void
    {
        $id = $this->creerNotification(['badge_id' => $this->badge->id]);

        $this->getJson('/api/badges/a-feter')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.notification_id', $id)
            ->assertJsonPath('0.id', $this->badge->id)
            ->assertJsonPath('0.nom', 'Premier Pas');
    }

    public function test_n_affiche_plus_un_badge_deja_fete(): void
    {
        $id = $this->creerNotification(['badge_id' => $this->badge->id]);

        $this->putJson("/api/notifications/{$id}/lue")->assertOk();

        $this->getJson('/api/badges/a-feter')->assertOk()->assertJsonCount(0);
    }

    public function test_retrouve_le_badge_par_son_nom_pour_les_anciennes_notifications(): void
    {
        $this->creerNotification(['body' => 'Tu as obtenu le badge « Premier Pas ».']);

        $this->getJson('/api/badges/a-feter')->assertOk()->assertJsonPath('0.id', $this->badge->id);
    }

    public function test_ignore_les_autres_notifications_et_celles_des_autres(): void
    {
        $this->creerNotification(['badge_id' => $this->badge->id], type: 'App\\Notifications\\NouveauQuizNotification');
        $this->creerNotification(['badge_id' => $this->badge->id], User::factory()->create());

        $this->getJson('/api/badges/a-feter')->assertOk()->assertJsonCount(0);
    }

    private function creerNotification(array $data, ?User $user = null, string $type = BadgeDebloqueNotification::class): string
    {
        $id = (string) Str::uuid();
        ($user ?? $this->user)->notifications()->create([
            'id' => $id,
            'type' => $type,
            'data' => $data + ['title' => 'Nouveau badge débloqué !', 'body' => ''],
            'read_at' => null,
        ]);

        return $id;
    }
}
