<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class PurgerComptesInactifs extends Command
{
    protected $signature = 'donnees:purger-comptes-inactifs';

    protected $description = 'Supprime (anonymise) les comptes sans connexion depuis 3 ans';

    // 📖 Durée annoncée dans la politique de confidentialité (docs/juridique) : la changer
    //    ici impose de mettre le texte à jour.
    private const ANNEES_INACTIVITE = 3;

    // 📖 Même suppression que DELETE /me (User::anonymiser) : l'historique de jeu reste pour
    //    les statistiques, sans lien avec la personne. Un compte qui ne s'est jamais connecté
    //    depuis son inscription (derniere_connexion vide) compte à partir de sa création.
    //    Les comptes du backoffice (avec un rôle) sont exclus : un admin peu actif ne doit
    //    pas perdre son accès sans qu'un super_admin l'ait décidé.
    //    V2 : prévenir la personne quelques semaines avant (« votre compte sera supprimé
    //    le … »), quand l'association aura une adresse d'envoi d'emails ; une notification
    //    push ne toucherait que ceux qui ont encore l'appli.
    public function handle(): int
    {
        $limite = now()->subYears(self::ANNEES_INACTIVITE);
        $supprimes = 0;

        User::nonSupprimes()
            ->doesntHave('roles')
            ->where(function ($q) use ($limite) {
                $q->where('derniere_connexion', '<', $limite)
                    ->orWhere(fn ($q) => $q->whereNull('derniere_connexion')->where('created_at', '<', $limite));
            })
            ->each(function (User $user) use (&$supprimes) {
                $user->anonymiser();
                $supprimes++;
            });

        $this->info("{$supprimes} compte(s) inactif(s) supprimé(s).");

        return self::SUCCESS;
    }
}
