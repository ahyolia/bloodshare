<?php

namespace Tests\Feature;

use App\Models\QuestionEligibilite;
use Database\Seeders\QuestionEligibiliteSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuestionEligibiliteSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_insere_les_15_criteres_du_don_du_sang(): void
    {
        $this->seed(QuestionEligibiliteSeeder::class);

        $this->assertSame(15, QuestionEligibilite::where('actif', true)->count());
    }

    public function test_alcool_et_drogue_sur_72_heures_et_non_plus_un_refus_definitif(): void
    {
        $this->seed(QuestionEligibiliteSeeder::class);

        $derniere = QuestionEligibilite::where('ordre', 15)->sole();
        $this->assertStringContainsString("l'alcool", $derniere->question);
        $this->assertStringContainsString('72', $derniere->question);
        $this->assertSame(0, QuestionEligibilite::where('message_refus', 'ilike', '%définitiv%')->count());
        $this->assertSame(0, QuestionEligibilite::where('message_refus', 'like', '%CHT%')->count());
    }

    public function test_relancer_le_seeder_met_a_jour_sans_dupliquer(): void
    {
        $this->seed(QuestionEligibiliteSeeder::class);
        QuestionEligibilite::where('ordre', 15)->update(['question' => 'As-tu consommé de la drogue ?']);

        $this->seed(QuestionEligibiliteSeeder::class);

        $this->assertSame(15, QuestionEligibilite::count());
        $this->assertStringContainsString('72', QuestionEligibilite::where('ordre', 15)->value('question'));
    }
}
