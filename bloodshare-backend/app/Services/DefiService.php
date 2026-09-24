<?php

namespace App\Services;

use App\Models\Defi;
use App\Models\Don;
use App\Models\PointsHistorique;
use App\Models\User;
use App\Models\UserDefi;
use Illuminate\Support\Facades\DB;

class DefiService
{
    /**
     * 📖 Jusqu'ici, GET /defis/actuel affichait un compteur collectif (tous les dons
     *    validés du mois) sans jamais savoir QUI avait contribué : user_defis existait en
     *    base mais aucun code n'y écrivait. Résultat : pas de progression personnelle
     *    affichable, pas de détection d'objectif atteint, pas de distribution de points, et
     *    les badges « Esprit d'équipe » / « Objectif atteint » ne pouvaient pas exister.
     *
     *    Appelée à chaque don validé (ScanController::handleDon). N'importe rien si aucun
     *    défi n'est actif — un don reste valide même sans défi en cours.
     */
    public function enregistrerContribution(User $user): void
    {
        $defi = Defi::where('statut', 'actif')->first();

        if (! $defi) {
            return;
        }

        // 📖 Upsert atomique (contrainte unique (user_id, defi_id), migration
        //    add_unique_constraint_to_user_defis_table) : deux dons concurrents ne peuvent
        //    ni créer deux lignes, ni se marcher dessus en incrémentant — Postgres sérialise
        //    les deux INSERT ... ON CONFLICT l'un après l'autre au niveau de la ligne.
        DB::statement(
            'insert into user_defis (user_id, defi_id, progression, complete)
             values (?, ?, 1, false)
             on conflict (user_id, defi_id)
             do update set progression = user_defis.progression + 1',
            [$user->id, $defi->id]
        );

        $this->verifierObjectifAtteint($defi);
    }

    /**
     * 📖 « progression_actuelle » (le total collectif affiché depuis le début, cf.
     *    DefiController::actuel) reste le nombre de dons validés dans le mois, pas la somme
     *    des lignes user_defis : un défi activé en cours de mois ne doit pas reprocher aux
     *    dons antérieurs à son activation de ne pas être tracés individuellement, et ce
     *    compteur ne change pas de définition avec cette US.
     */
    private function verifierObjectifAtteint(Defi $defi): void
    {
        if (! $defi->objectif_chiffre) {
            return;
        }

        $progressionActuelle = Don::where('statut', 'valide')
            ->whereMonth('date_don', now()->month)
            ->whereYear('date_don', now()->year)
            ->count();

        if ($progressionActuelle < $defi->objectif_chiffre) {
            return;
        }

        // 📖 UPDATE ... WHERE statut = 'actif' est atomique : si deux dons concurrents
        //    franchissent l'objectif au même instant, une seule des deux requêtes voit
        //    $lignesModifiees = 1 (l'autre trouve déjà statut != 'actif' et n'affecte aucune
        //    ligne) — la distribution de points ne peut donc jamais avoir lieu deux fois.
        $lignesModifiees = Defi::where('id', $defi->id)
            ->where('statut', 'actif')
            ->update(['statut' => 'termine']);

        if ($lignesModifiees === 0) {
            return;
        }

        $contributeurs = UserDefi::where('defi_id', $defi->id)
            ->where('progression', '>', 0)
            ->get();

        foreach ($contributeurs as $userDefi) {
            if ($defi->points_attribues > 0) {
                PointsHistorique::create([
                    'user_id' => $userDefi->user_id,
                    'points' => $defi->points_attribues,
                    'source' => 'defi',
                    'source_id' => $defi->id,
                ]);

                User::where('id', $userDefi->user_id)->increment('points_cumules', $defi->points_attribues);
            }

            $userDefi->update(['complete' => true, 'completed_at' => now()]);
        }
    }
}
