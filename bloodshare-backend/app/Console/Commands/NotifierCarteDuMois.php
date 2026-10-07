<?php

namespace App\Console\Commands;

use App\Models\Carte;
use App\Models\Don;
use App\Models\User;
use App\Models\UserCarte;
use App\Notifications\CarteDuMoisNotification;
use Illuminate\Console\Command;

class NotifierCarteDuMois extends Command
{
    protected $signature = 'notifications:carte-du-mois';

    protected $description = "Invite les utilisateurs éligibles n'ayant pas encore la carte du mois, ~7 jours avant la fin du mois";

    // 📖 Même délai que ScanController::handleDon (56j homme / 84j femme) — dupliqué ici
    //    pour les mêmes raisons que NotifierFinIneligibilite (ne pas toucher au scan).
    public function handle(): int
    {
        if (now()->daysInMonth - now()->day !== 7) {
            $this->info("Pas encore à 7 jours de la fin du mois.");

            return self::SUCCESS;
        }

        $carteDuMois = Carte::where('categorie', 'mois_don')
            ->where('mois_numero', (int) now()->format('n'))
            ->where('statut', 'active')
            ->first();

        if (! $carteDuMois) {
            $this->info('Pas de carte du mois active.');

            return self::SUCCESS;
        }

        $notifies = 0;

        User::query()->each(function (User $user) use ($carteDuMois, &$notifies) {
            $dejaObtenue = UserCarte::where('user_id', $user->id)
                ->where('carte_id', $carteDuMois->id)
                ->exists();

            if ($dejaObtenue) {
                return;
            }

            $delaiJours = $user->sexe === 'femme' ? 84 : 56;
            $dernierDon = Don::where('user_id', $user->id)
                ->where('statut', 'valide')
                ->orderByDesc('date_don')
                ->first();

            if ($dernierDon && $dernierDon->date_don->addDays($delaiJours)->isFuture()) {
                return;
            }

            $user->notify(new CarteDuMoisNotification());
            $notifies++;
        });

        $this->info("{$notifies} utilisateur(s) notifié(s).");

        return self::SUCCESS;
    }
}
