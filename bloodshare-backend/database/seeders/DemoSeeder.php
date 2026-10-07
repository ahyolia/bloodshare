<?php

namespace Database\Seeders;

use App\Models\Avatar;
use App\Models\Banniere;
use App\Models\Contenu;
use App\Models\Defi;
use App\Models\Don;
use App\Models\Evenement;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\Reponse;
use App\Models\StockSang;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    // 📖 Données de démo (users, dons, événements...), à ne lancer qu'en local
    //    pour remplir l'app avant une démo. Jamais en production (voir le garde
    //    dans run()). Non rejoué si déjà présent, pour pouvoir relancer
    //    `db:seed` sans dupliquer à chaque fois.
    public function run(): void
    {
        if (! app()->environment('local')) {
            $this->command?->warn('DemoSeeder ignoré : environnement non local.');

            return;
        }

        $admin = User::role(['super_admin', 'admin'])->first();

        $users = $this->seedUsers();
        $this->seedDons($users);
        $this->seedDefi($admin);
        $this->seedEvenements($admin);
        $this->seedQuiz($admin);
        $this->seedStockSang($admin);
        $this->seedContenus($admin);
        $this->seedBannieres($admin);
    }

    private function seedUsers()
    {
        $existants = User::where('email', 'like', 'demo%@bloodshare.local')->get();

        if ($existants->count() >= 15) {
            return $existants;
        }

        $avatarIds = Avatar::pluck('id');
        $statuts = ['donneur_regulier', 'quelques_dons', 'jamais_donne'];
        $sexes = ['homme', 'femme'];

        $users = collect();

        for ($i = 1; $i <= 15; $i++) {
            $users->push(User::updateOrCreate(
                ['email' => "demo{$i}@bloodshare.local"],
                [
                    'pseudo' => "Donneur Demo {$i}",
                    'password' => 'password',
                    'sexe' => $sexes[array_rand($sexes)],
                    'statut_donneur' => $statuts[array_rand($statuts)],
                    'statut' => 'actif',
                    'points_cumules' => rand(0, 500),
                    'derniere_connexion' => now()->subDays(rand(0, 30)),
                    'avatar_id' => $avatarIds->isNotEmpty() ? $avatarIds->random() : null,
                ]
            ));
        }

        return $users;
    }

    private function seedDons($users): void
    {
        if (Don::count() >= 30) {
            return;
        }

        // 📖 Un tiers des dons sont datés du mois en cours pour que la progression
        //    du défi du mois (comptée sur date_don du mois courant) soit visible en démo.
        for ($i = 1; $i <= 30; $i++) {
            $dateDon = $i <= 10
                ? now()->startOfMonth()->addDays(rand(0, now()->day - 1))
                : now()->subDays(rand(1, 365));

            Don::create([
                'user_id' => $users->random()->id,
                'scan_id' => null,
                'date_don' => $dateDon,
                'statut' => rand(1, 10) === 1 ? 'en_attente' : 'valide',
            ]);
        }
    }

    private function seedDefi(?User $admin): void
    {
        if (Defi::whereIn('statut', ['actif', 'termine'])->exists()) {
            return;
        }

        Defi::create([
            'admin_id' => $admin?->id,
            'titre' => 'Objectif 50 dons ce mois-ci',
            'description' => 'Ensemble, atteignons 50 dons validés ce mois pour reconstituer les stocks de sang.',
            'type' => 'communautaire',
            'periode' => 'mensuel',
            'objectif_chiffre' => 50,
            'points_attribues' => 15,
            'date_fin' => now()->endOfMonth(),
            'statut' => 'actif',
        ]);
    }

    private function seedEvenements(?User $admin): void
    {
        if (Evenement::count() >= 5) {
            return;
        }

        $evenements = [
            ['titre' => 'Collecte mobile - Nouméa centre', 'lieu' => 'Place des Cocotiers, Nouméa'],
            ['titre' => 'Collecte - Mont-Dore', 'lieu' => 'Salle municipale, Mont-Dore'],
            ['titre' => 'Journée mondiale du don de sang', 'lieu' => 'CHT Médipôle, Nouméa'],
            ['titre' => 'Collecte - Dumbéa', 'lieu' => 'Centre commercial Dumbéa sur Mer'],
            ['titre' => 'Collecte - Païta', 'lieu' => 'Mairie de Païta'],
        ];

        foreach ($evenements as $i => $evenement) {
            Evenement::create([
                'admin_id' => $admin?->id,
                'titre' => $evenement['titre'],
                'description' => 'Venez donner votre sang et sauver des vies lors de cette collecte organisée par le CHT.',
                'lieu' => $evenement['lieu'],
                'date_heure' => now()->addDays(($i + 1) * 4)->setTime(8, 30),
                'horaire_fin' => now()->addDays(($i + 1) * 4)->setTime(15, 0),
                'statut' => 'publie',
            ]);
        }
    }

    private function seedQuiz(?User $admin): void
    {
        if (Quiz::count() >= 3) {
            return;
        }

        $quizzes = [
            [
                'titre' => 'Les bases du don de sang',
                'categorie' => 'don',
                'questions' => [
                    ['intitule' => 'Combien de temps dure un don de sang classique ?', 'reponses' => [
                        ['texte' => '8 à 10 minutes', 'ok' => true],
                        ['texte' => '1 heure', 'ok' => false],
                        ['texte' => '30 secondes', 'ok' => false],
                    ]],
                    ['intitule' => 'À partir de quel âge peut-on donner son sang ?', 'reponses' => [
                        ['texte' => '18 ans', 'ok' => true],
                        ['texte' => '16 ans', 'ok' => false],
                        ['texte' => '21 ans', 'ok' => false],
                    ]],
                ],
            ],
            [
                'titre' => 'Groupes sanguins et compatibilité',
                'categorie' => 'sante',
                'questions' => [
                    ['intitule' => 'Quel groupe sanguin est appelé "donneur universel" ?', 'reponses' => [
                        ['texte' => 'O-', 'ok' => true],
                        ['texte' => 'AB+', 'ok' => false],
                        ['texte' => 'A+', 'ok' => false],
                    ]],
                ],
            ],
            [
                'titre' => 'Après le don',
                'categorie' => 'don',
                'questions' => [
                    ['intitule' => 'Combien de temps faut-il attendre avant de redonner son sang ?', 'reponses' => [
                        ['texte' => '8 semaines', 'ok' => true],
                        ['texte' => '2 semaines', 'ok' => false],
                        ['texte' => '6 mois', 'ok' => false],
                    ]],
                ],
            ],
        ];

        foreach ($quizzes as $quizData) {
            $quiz = Quiz::create([
                'admin_id' => $admin?->id,
                'titre' => $quizData['titre'],
                'description' => 'Testez vos connaissances sur le don de sang.',
                'categorie' => $quizData['categorie'],
                'aleatoire' => false,
                'points_attribues' => 20,
                'statut' => 'actif',
            ]);

            foreach ($quizData['questions'] as $ordre => $questionData) {
                $question = Question::create([
                    'quiz_id' => $quiz->id,
                    'intitule' => $questionData['intitule'],
                    'type' => 'unique',
                    'ordre' => $ordre + 1,
                    'aleatoire' => false,
                ]);

                foreach ($questionData['reponses'] as $reponseData) {
                    Reponse::create([
                        'question_id' => $question->id,
                        'texte' => $reponseData['texte'],
                        'est_correcte' => $reponseData['ok'],
                    ]);
                }
            }
        }
    }

    private function seedStockSang(?User $admin): void
    {
        $niveaux = [
            'A+' => 'correct', 'A-' => 'bas', 'B+' => 'bon', 'B-' => 'critique',
            'AB+' => 'correct', 'AB-' => 'bas', 'O+' => 'critique', 'O-' => 'critique',
        ];

        foreach ($niveaux as $groupe => $niveau) {
            StockSang::updateOrCreate(
                ['groupe_sanguin' => $groupe],
                [
                    'admin_id' => $admin?->id,
                    'niveau' => $niveau,
                    'maj_at' => now(),
                ]
            );
        }
    }

    private function seedContenus(?User $admin): void
    {
        if (Contenu::count() >= 8) {
            return;
        }

        $actualites = [
            ['titre' => 'Grande collecte de sang ce week-end à Nouméa', 'categorie' => 'evenement'],
            ['titre' => 'Le stock de sang O- est au plus bas', 'categorie' => 'urgence'],
            ['titre' => 'Merci aux 200 donneurs du mois de septembre', 'categorie' => 'remerciement'],
        ];

        foreach ($actualites as $actualite) {
            Contenu::create([
                'admin_id' => $admin?->id,
                'type' => 'actualite',
                'titre' => $actualite['titre'],
                'contenu' => 'Lorem ipsum : contenu de démonstration pour illustrer cette actualité.',
                'categorie' => $actualite['categorie'],
                'statut' => 'publie',
                'published_at' => now()->subDays(rand(0, 10)),
            ]);
        }

        $fichesInfos = [
            ['titre' => 'Qui peut donner son sang ?', 'categorie' => 'eligibilite'],
            ['titre' => 'Comment se déroule un don de sang ?', 'categorie' => 'don'],
            ['titre' => 'Que faire avant de donner son sang ?', 'categorie' => 'preparation'],
            ['titre' => 'Les différents groupes sanguins', 'categorie' => 'sante'],
            ['titre' => 'Les bienfaits du don de sang', 'categorie' => 'sante'],
        ];

        foreach ($fichesInfos as $fiche) {
            Contenu::create([
                'admin_id' => $admin?->id,
                'type' => 'fiche_info',
                'titre' => $fiche['titre'],
                'contenu' => 'Lorem ipsum : contenu de démonstration pour illustrer cette fiche pratique.',
                'categorie' => $fiche['categorie'],
                'statut' => 'publie',
                'published_at' => now()->subDays(rand(0, 10)),
            ]);
        }
    }

    private function seedBannieres(?User $admin): void
    {
        if (Banniere::count() >= 3) {
            return;
        }

        $bannieres = [
            ['titre' => 'Stock critique', 'message' => 'Le stock de sang O- est critique, merci de donner rapidement.', 'type' => 'urgence'],
            ['titre' => 'Collecte ce week-end', 'message' => 'Une collecte mobile aura lieu ce week-end à Nouméa.', 'type' => 'info'],
            ['titre' => 'Nouvelle fonctionnalité', 'message' => 'Scannez le QR code du centre pour gagner des points.', 'type' => 'alerte'],
        ];

        foreach ($bannieres as $banniere) {
            Banniere::create([
                'admin_id' => $admin?->id,
                'titre' => $banniere['titre'],
                'message' => $banniere['message'],
                'type' => $banniere['type'],
                'active' => true,
            ]);
        }
    }
}
