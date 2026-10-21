<?php

namespace Tests\Feature;

use App\Filament\Resources\AdminResource\Pages\EditAdmin;
use App\Filament\Resources\AdminResource\Pages\ViewAdmin;
use App\Filament\Resources\QuestionEligibiliteResource\Pages\ListQuestionsEligibilite;
use App\Filament\Resources\UserResource\Pages\ListUsers;
use App\Models\QuestionEligibilite;
use App\Models\User;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Livewire\Livewire;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * 📖 Droits du BO (audit cybersécurité) : super_admin partout, admin partout sauf les
 *    pages listées dans SUPER_ADMIN_SEULEMENT. Chaque page du BO doit être classée dans
 *    l'une des deux listes : une nouvelle page non classée fait échouer le test, pour
 *    obliger à décider qui y a accès.
 */
class RolesBackofficeTest extends TestCase
{
    use RefreshDatabase;

    private const SUPER_ADMIN_SEULEMENT = [
        'filament.admin.pages.configuration-globale',
        'filament.admin.resources.admins.index',
        'filament.admin.resources.admins.create',
        'filament.admin.resources.admins.view',
        'filament.admin.resources.admins.edit',
        'filament.admin.resources.document-juridiques.edit',
        'filament.admin.resources.question-eligibilites.create',
        'filament.admin.resources.question-eligibilites.edit',
    ];

    private const ADMIN_AUTORISE = [
        'filament.admin.pages.dashboard',
        'filament.admin.pages.qr-code-centre',
        'filament.admin.resources.badges.index',
        'filament.admin.resources.badges.create',
        'filament.admin.resources.badges.edit',
        'filament.admin.resources.bannieres.index',
        'filament.admin.resources.bannieres.create',
        'filament.admin.resources.bannieres.edit',
        'filament.admin.resources.cartes.index',
        'filament.admin.resources.cartes.create',
        'filament.admin.resources.cartes.edit',
        'filament.admin.resources.contenus.index',
        'filament.admin.resources.contenus.create',
        'filament.admin.resources.contenus.edit',
        'filament.admin.resources.defis.index',
        'filament.admin.resources.defis.create',
        'filament.admin.resources.defis.edit',
        'filament.admin.resources.document-juridiques.index',
        'filament.admin.resources.evenements.index',
        'filament.admin.resources.evenements.create',
        'filament.admin.resources.evenements.edit',
        'filament.admin.resources.parrainages.index',
        'filament.admin.resources.question-eligibilites.index',
        'filament.admin.resources.quizzes.index',
        'filament.admin.resources.quizzes.create',
        'filament.admin.resources.quizzes.edit',
        'filament.admin.resources.stock-sangs.index',
        'filament.admin.resources.stock-sangs.create',
        'filament.admin.resources.stock-sangs.edit',
        'filament.admin.resources.users.index',
        'filament.admin.resources.users.view',
    ];

    private User $admin;

    private User $superAdmin;

    private User $donneur;

    protected function setUp(): void
    {
        parent::setUp();

        // 📖 Données de référence : chaque page /{record} a besoin d'un enregistrement.
        $this->seed();

        $this->admin = $this->compteBo('admin');
        $this->superAdmin = $this->compteBo('super_admin');
        $this->donneur = User::factory()->create(['statut' => 'actif']);
    }

    public function test_chaque_page_du_bo_respecte_les_droits_de_son_role(): void
    {
        foreach ($this->pagesDuBo() as $nom => $uri) {
            $this->assertContains($nom, [...self::SUPER_ADMIN_SEULEMENT, ...self::ADMIN_AUTORISE],
                "Page du BO non classée : {$nom}. Ajoute-la à SUPER_ADMIN_SEULEMENT ou ADMIN_AUTORISE.");

            $attendu = in_array($nom, self::SUPER_ADMIN_SEULEMENT, true) ? 403 : 200;

            $this->assertSame($attendu, $this->actingAs($this->admin)->get($uri)->getStatusCode(), "admin sur {$uri}");
            $this->assertSame(200, $this->actingAs($this->superAdmin)->get($uri)->getStatusCode(), "super_admin sur {$uri}");
        }
    }

    public function test_un_admin_ne_voit_pas_les_comptes_du_bo_dans_les_utilisateurs(): void
    {
        $this->actingAs($this->admin);

        Livewire::test(ListUsers::class)
            ->searchTable($this->donneur->pseudo)
            ->assertCanSeeTableRecords([$this->donneur])
            ->searchTable($this->superAdmin->pseudo)
            ->assertCanNotSeeTableRecords([$this->superAdmin]);

        $this->get("/admin/users/{$this->superAdmin->id}")->assertNotFound();
        $this->get("/admin/users/{$this->admin->id}")->assertNotFound();
    }

    public function test_un_admin_ne_peut_pas_supprimer_les_questions_d_eligibilite(): void
    {
        $this->actingAs($this->admin);

        Livewire::test(ListQuestionsEligibilite::class)
            ->assertTableBulkActionHidden('delete');

        $this->assertDatabaseCount('questions_eligibilite', QuestionEligibilite::count());
    }

    public function test_le_super_admin_ne_peut_ni_se_suspendre_ni_se_supprimer(): void
    {
        $this->actingAs($this->superAdmin);

        Livewire::test(ViewAdmin::class, ['record' => $this->superAdmin->getRouteKey()])
            ->assertActionHidden('suspendre')
            ->assertActionHidden('supprimer');

        Livewire::test(EditAdmin::class, ['record' => $this->superAdmin->getRouteKey()])
            ->assertActionHidden('delete');
    }

    public function test_supprimer_un_admin_l_anonymise_au_lieu_d_effacer_la_ligne(): void
    {
        $this->actingAs($this->superAdmin);

        Livewire::test(ViewAdmin::class, ['record' => $this->admin->getRouteKey()])
            ->callAction('supprimer');

        $this->admin->refresh();
        $this->assertSame('supprime', $this->admin->statut);
        $this->assertSame(0, $this->admin->roles()->count());
    }

    /** @return array<string, string> nom de route => URL à appeler */
    private function pagesDuBo(): array
    {
        $pages = [];

        foreach (Route::getRoutes() as $route) {
            $nom = (string) $route->getName();

            if (! str_starts_with($nom, 'filament.admin.') || ! in_array('GET', $route->methods(), true)
                || str_contains($nom, '.auth.')) {
                continue;
            }

            $uri = '/' . $route->uri();

            if (str_contains($uri, '{record}')) {
                $uri = str_replace('{record}', (string) $this->enregistrementPour($nom)->getRouteKey(), $uri);
            }

            $pages[$nom] = $uri;
        }

        return $pages;
    }

    private function enregistrementPour(string $nomRoute)
    {
        if (str_contains($nomRoute, '.resources.users.')) {
            return $this->donneur;
        }

        if (str_contains($nomRoute, '.resources.admins.')) {
            return $this->admin;
        }

        foreach (Filament::getPanel('admin')->getResources() as $resource) {
            if (str_contains($nomRoute, '.resources.' . $resource::getSlug() . '.')) {
                return $resource::getModel()::query()->firstOrFail();
            }
        }

        $this->fail("Aucun enregistrement pour {$nomRoute}");
    }

    private function compteBo(string $role): User
    {
        Role::findOrCreate($role);

        $compte = User::factory()->create(['statut' => 'actif']);
        $compte->assignRole($role);

        return $compte;
    }
}
