<?php

namespace App\Console\Commands;

use App\Models\DocumentJuridique;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ComptesForum extends Command
{
    protected $signature = 'forum:comptes {--supprimer : Supprime les comptes du forum au lieu de les remettre à neuf}';

    protected $description = 'Crée ou remet à neuf les 20 comptes prêtés aux visiteurs du forum';

    // 📖 Domaine sans existence réelle : aucun email ne peut partir vers ces adresses, et le
    //    domaine suffit à reconnaître un compte du forum en base.
    public const DOMAINE = 'forum.aima';

    // 📖 Identifiants imprimés sur les cartes distribuées au forum : en changer un impose de
    //    refaire la carte. Le mot de passe respecte la règle de l'inscription (8 caractères,
    //    majuscule, minuscule, chiffre) pour rester cohérent si le visiteur le change.
    public const COMPTES = [
        ['identifiant' => 'globule', 'pseudo' => 'Globule Farceur', 'mot_de_passe' => 'Rouge2Plaisir'],
        ['identifiant' => 'plaquette', 'pseudo' => 'Plaquette Pressée', 'mot_de_passe' => 'Colle3Tout'],
        ['identifiant' => 'plasma', 'pseudo' => 'Plasma Rigolo', 'mot_de_passe' => 'Jaune2Paille'],
        ['identifiant' => 'vampire', 'pseudo' => 'Vampire Végétarien', 'mot_de_passe' => 'Tofu4Ever'],
        ['identifiant' => 'moustique', 'pseudo' => 'Moustique Repenti', 'mot_de_passe' => 'Pique1Plus'],
        ['identifiant' => 'dracula', 'pseudo' => 'Dracula en Stage', 'mot_de_passe' => 'Croc2Lait'],
        ['identifiant' => 'poche', 'pseudo' => 'Poche Pleine', 'mot_de_passe' => 'Glou8Glou'],
        ['identifiant' => 'seringue', 'pseudo' => 'Seringue Timide', 'mot_de_passe' => 'Pik2Douceur'],
        ['identifiant' => 'garrot', 'pseudo' => 'Garrot Relax', 'mot_de_passe' => 'Serre1Pas'],
        ['identifiant' => 'biscuit', 'pseudo' => "Biscuit d'Après-Don", 'mot_de_passe' => 'Miam3Miam'],
        ['identifiant' => 'jus', 'pseudo' => "Jus d'Orange Héroïque", 'mot_de_passe' => 'Pulpe7Max'],
        ['identifiant' => 'heros', 'pseudo' => 'Héros Anonyme', 'mot_de_passe' => 'Cape2Rouge'],
        ['identifiant' => 'cagou', 'pseudo' => 'Cagou Généreux', 'mot_de_passe' => 'Kiou4Kiou'],
        ['identifiant' => 'roussette', 'pseudo' => 'Roussette Donneuse', 'mot_de_passe' => 'Fruit6Nuit'],
        ['identifiant' => 'tricot', 'pseudo' => 'Tricot Rayé Courageux', 'mot_de_passe' => 'Zebre3Mer'],
        ['identifiant' => 'notou', 'pseudo' => 'Notou Solidaire', 'mot_de_passe' => 'Rou2Rourou'],
        ['identifiant' => 'coeur', 'pseudo' => 'Cœur Battant', 'mot_de_passe' => 'Boum9Boum'],
        ['identifiant' => 'veine', 'pseudo' => 'Veine de Cocu', 'mot_de_passe' => 'Trefle4Feuilles'],
        ['identifiant' => 'groupe', 'pseudo' => 'Groupe O Positif', 'mot_de_passe' => 'Toujours1Partant'],
        ['identifiant' => 'bisou', 'pseudo' => 'Bisou de Moustique', 'mot_de_passe' => 'Smack5Pique'],
    ];

    // 📖 À lancer après chaque série de passages, une fois les cartes récupérées : chaque
    //    compte est supprimé puis recréé. La suppression en cascade (dons, scans, cartes,
    //    badges, défis, quiz, points, parrainages) garantit qu'il ne reste rien du visiteur
    //    précédent, même pour une table ajoutée plus tard, ce qu'un nettoyage table par
    //    table finirait par oublier. Les dons faits pendant le forum ne restent donc pas
    //    dans les statistiques de l'association.
    public function handle(): int
    {
        DB::transaction(function () {
            User::where('email', 'like', '%@' . self::DOMAINE)->each(function (User $user) {
                // 📖 Liens polymorphes, sans clé étrangère : la cascade ne les atteint pas.
                $user->tokens()->delete();
                $user->pushSubscriptions()->delete();
                $user->notifications()->delete();
                $user->delete();
            });

            if ($this->option('supprimer')) {
                return;
            }

            $versionCgu = DocumentJuridique::where('type', 'cgu')->value('version');

            foreach (self::COMPTES as $i => $compte) {
                // 📖 Même état qu'une inscription depuis l'app. Le sexe ne sert qu'au délai
                //    entre deux dons : alterné, sans lien avec le visiteur.
                User::create([
                    'pseudo' => $compte['pseudo'],
                    'email' => "{$compte['identifiant']}@" . self::DOMAINE,
                    'password' => $compte['mot_de_passe'],
                    'sexe' => $i % 2 === 0 ? 'femme' : 'homme',
                ])->forceFill([
                    'cgu_version' => $versionCgu,
                    'cgu_acceptees_at' => now(),
                    'consentement_sante_at' => now(),
                ])->save();
            }
        });

        if ($this->option('supprimer')) {
            $this->info('Comptes du forum supprimés.');

            return self::SUCCESS;
        }

        $this->table(
            ['Identifiant', 'Mot de passe', 'Pseudo'],
            array_map(fn ($c) => ["{$c['identifiant']}@" . self::DOMAINE, $c['mot_de_passe'], $c['pseudo']], self::COMPTES)
        );
        $this->info(count(self::COMPTES) . ' comptes du forum remis à neuf.');

        return self::SUCCESS;
    }
}
