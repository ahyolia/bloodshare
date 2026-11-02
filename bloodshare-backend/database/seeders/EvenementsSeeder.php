<?php

namespace Database\Seeders;

use App\Models\Carte;
use App\Models\Evenement;
use App\Models\QrCode;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

// 📖 Événements préparés par l'équipe. Un événement dont le titre existe déjà n'est jamais
//    modifié : une fois inséré, c'est le backoffice qui fait foi (horaires, carte...).
//    Lancement : php artisan db:seed --class=EvenementsSeeder
//
//    Publier un événement prévient tous les utilisateurs (hook saved d'Evenement), comme
//    depuis le backoffice.
class EvenementsSeeder extends Seeder
{
    public function run(): void
    {
        // whereHas plutôt que User::role() : ce dernier lève une exception si le rôle
        // n'existe pas encore (base vide, tests).
        $admin = User::whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))->first();

        foreach (self::evenements() as $donnees) {
            if (Evenement::where('titre', $donnees['titre'])->exists()) {
                continue;
            }

            DB::transaction(function () use ($donnees, $admin) {
                $evenement = Evenement::create([
                    'admin_id' => $admin?->id,
                    // Carte absente (base sans VisuelsSeeder) : carte Événement générique.
                    'carte_id' => Carte::where('titre', $donnees['carte'])->value('id'),
                    'titre' => $donnees['titre'],
                    'description' => $donnees['description'],
                    'lieu' => $donnees['lieu'],
                    'date_heure' => $donnees['date_heure'],
                    'horaire_fin' => $donnees['horaire_fin'],
                    'statut' => 'publie',
                ]);

                // 📖 Même QR Code que pour un événement créé dans le backoffice
                //    (CreateEvenement::afterCreate) : « Voir QR Code » l'affiche ensuite.
                $qrCode = QrCode::create([
                    'type' => 'evenement',
                    'token' => Str::random(40),
                    'evenement_id' => $evenement->id,
                    'actif' => true,
                ]);

                $evenement->update(['qr_code_id' => $qrCode->id]);
            });
        }
    }

    /**
     * @return array<int, array{titre: string, description: string, lieu: string, date_heure: string, horaire_fin: string, carte: string}>
     */
    public static function evenements(): array
    {
        return [
            [
                'titre' => 'Forum des projets tutorés 2026',
                'description' => "Viens découvrir Aïma, la vidéo 360° « Ça dit quoi le sang ? » et le jeu de réalité virtuelle sur le don du sang, présentés par le groupe BloodShare. Scanne le QR Code du stand pour gagner la carte du forum !",
                'lieu' => "IUT, Université de la Nouvelle-Calédonie",
                // Heures de Nouméa (APP_TIMEZONE). Après horaire_fin, le scan ne donne plus la carte.
                'date_heure' => '2026-10-29 13:30:00',
                'horaire_fin' => '2026-10-29 17:30:00',
                'carte' => VisuelsSeeder::TITRE_CARTE_FORUM,
            ],
        ];
    }
}
