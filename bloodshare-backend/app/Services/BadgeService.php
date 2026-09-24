<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\Don;
use App\Models\Parrainage;
use App\Models\Quiz;
use App\Models\User;
use App\Models\UserBadge;
use App\Models\UserCarte;
use App\Models\UserDefi;
use App\Models\UserQuiz;
use Illuminate\Database\QueryException;

class BadgeService
{
    /**
     * 📖 Avant ce service, chaque badge n'était vérifié qu'au moment précis de
     *    l'action qui le déclenche (un scan, une validation de parrainage, un quiz
     *    soumis). Un utilisateur qui remplissait déjà la condition AVANT que cette
     *    vérification existe, ou dont le don a été enregistré autrement (BO, import),
     *    ne recevait jamais son badge : rien ne revenait vérifier son état après coup.
     *
     *    synchroniser() calcule l'état réel de l'utilisateur (dons validés,
     *    parrainages validés, quiz terminés) et attribue tout badge éligible non
     *    encore obtenu, quelle que soit la raison pour laquelle il ne l'était pas.
     *    Appelé à la fois juste après une action (scan, quiz...) et à chaque
     *    consultation de GET /badges, pour que l'écran se corrige tout seul.
     */
    public function synchroniser(User $user): array
    {
        $dejaObtenuIds = UserBadge::where('user_id', $user->id)->pluck('badge_id');

        $nbDons = Don::where('user_id', $user->id)->where('statut', 'valide')->count();

        $nbParrainagesValides = Parrainage::where('parrain_id', $user->id)
            ->where('statut', 'valide')
            ->count();

        // 📖 Ne compte que les quiz COMPLÉTÉS DONT LE QUIZ EST ENCORE ACTIF : sinon, un quiz
        //    complété puis désactivé compterait quand même dans $nbQuizCompletes, comparé plus
        //    bas à $nbQuizActifs (qui lui ne compte que les quiz actifs) — un utilisateur ayant
        //    complété d'anciens quiz depuis retirés obtiendrait « Incollable » sans avoir fait
        //    un seul des quiz actuellement actifs.
        $nbQuizCompletes = UserQuiz::where('user_id', $user->id)
            ->where('complete', true)
            ->whereHas('quiz', fn ($q) => $q->where('statut', 'actif'))
            ->count();

        $nbQuizActifs = Quiz::where('statut', 'actif')->count();

        // 📖 « Cartes Mois du don obtenues » = nombre de cartes DISTINCTES pour la catégorie
        //    mois_don. user_cartes n'a pas de contrainte d'unicité sur (user_id, carte_id)
        //    (seulement sa clé primaire) : un simple count() gonflerait le total au moindre
        //    doublon. distinct('carte_id') s'en protège même si un doublon apparaissait.
        $nbCartesMoisDon = UserCarte::where('user_id', $user->id)
            ->whereHas('carte', fn ($q) => $q->where('categorie', 'mois_don'))
            ->distinct('carte_id')
            ->count('carte_id');

        $nbCartesEvenement = (int) UserCarte::where('user_id', $user->id)
            ->whereHas('carte', fn ($q) => $q->where('categorie', 'evenement'))
            ->sum('quantite');

        $actionsEligibles = collect([
            'premier_don' => $nbDons >= 1,
            'premier_parrainage' => $nbParrainagesValides >= 1,
            'trois_parrainages' => $nbParrainagesValides >= 3,
            'premier_quiz' => $nbQuizCompletes >= 1,
            'cinq_quiz' => $nbQuizCompletes >= 5,
            // 📖 « Toutes les catégories de quiz complétées » revient à dire « tous les quiz
            //    actifs terminés » : une catégorie n'est qu'un regroupement d'affichage, elle
            //    n'a pas d'état de complétion propre — il n'y a rien à vérifier en plus par quiz.
            'toutes_categories_quiz' => $nbQuizActifs > 0 && $nbQuizCompletes >= $nbQuizActifs,
            // 📖 Côté filleul, pas de condition de validation : le badge récompense le fait
            //    de s'être inscrit avec un code (n'importe quel statut de parrainage).
            'inscrit_avec_code' => Parrainage::where('filleul_id', $user->id)->exists(),
            'six_cartes_mois' => $nbCartesMoisDon >= 6,
            'douze_cartes_mois' => $nbCartesMoisDon >= 12,
            'trois_cartes_evenement' => $nbCartesEvenement >= 3,
            // 📖 « Esprit d'équipe » récompense la participation, pas le résultat : dès qu'un
            //    don a compté pour un défi (progression > 0), peu importe si ce défi a ensuite
            //    réussi ou non. « Objectif atteint » ne s'obtient que si ce défi est allé au
            //    bout (complete=true, posé par DefiService quand l'objectif collectif est
            //    franchi et les points distribués).
            'defi_contribue' => UserDefi::where('user_id', $user->id)->where('progression', '>', 0)->exists(),
            'defi_remporte' => UserDefi::where('user_id', $user->id)->where('complete', true)->exists(),
        ])->filter()->keys();

        $badgesEligibles = Badge::where('statut', 'actif')
            ->whereNotIn('id', $dejaObtenuIds)
            ->where(function ($query) use ($nbDons, $actionsEligibles) {
                $query->where(function ($q) use ($nbDons) {
                    $q->where('condition_type', 'nb_dons')
                        ->where('condition_valeur', '<=', $nbDons);
                });

                if ($actionsEligibles->isNotEmpty()) {
                    $query->orWhere(function ($q) use ($actionsEligibles) {
                        $q->where('condition_type', 'action_specifique')
                            ->whereIn('action_specifique', $actionsEligibles);
                    });
                }
            })
            ->get();

        $nouveauxBadges = [];

        foreach ($badgesEligibles as $badge) {
            try {
                UserBadge::create([
                    'user_id' => $user->id,
                    'badge_id' => $badge->id,
                    'obtenu_at' => now(),
                ]);
            } catch (QueryException $e) {
                // 📖 Deux requêtes concurrentes (ex. un scan et un GET /badges au même
                //    instant) peuvent toutes les deux passer la vérification whereNotIn
                //    ci-dessus avant qu'aucune n'ait inséré : la contrainte unique sur
                //    (user_id, badge_id) — migration add_unique_constraint_to_user_badges_table
                //    — fait respecter la règle au niveau base. Un doublon veut juste dire que
                //    l'autre requête a gagné la course ; le badge est obtenu, rien d'autre à faire.
                if (! str_contains($e->getMessage(), 'user_badges_user_id_badge_id_unique')) {
                    throw $e;
                }

                continue;
            }

            $nouveauxBadges[] = [
                'id' => $badge->id,
                'nom' => $badge->nom,
                'image_url' => $badge->image_url,
                'action_specifique' => $badge->action_specifique,
            ];
        }

        return $nouveauxBadges;
    }
}
