<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banniere;
use App\Models\Contenu;
use App\Models\DocumentJuridique;
use App\Models\Evenement;
use App\Models\Question;
use App\Models\QuestionEligibilite;
use App\Models\StockSang;

class ContenuController extends Controller
{
    public function actualites()
    {
        // 📖 Le corps de l'article (`contenu`) manquait de cette sélection : l'écran de détail
        //    mobile le lit depuis les params de navigation construits à partir de cette liste
        //    (pas d'appel dédié par id), donc une actualité s'ouvrait toujours avec un contenu
        //    vide.
        return response()->json(
            Contenu::where('type', 'actualite')
                ->where('statut', 'publie')
                ->orderBy('published_at', 'desc')
                ->get(['id', 'titre', 'contenu', 'image_url', 'published_at'])
        );
    }

    public function fichesInfos()
    {
        $fiches = Contenu::where('type', 'fiche_info')
            ->where('statut', 'publie')
            ->orderBy('published_at', 'asc')
            ->get(['id', 'titre', 'categorie', 'contenu', 'image_url', 'quiz_cta', 'le_saviez_vous', 'published_at']);

        // 📖 Quiz liés à chaque fiche : ceux dont au moins une question renvoie vers elle
        //    (questions.contenu_id, posé dans le BO ou par QuizContenuSeeder). La fiche peut
        //    ainsi proposer « Teste-toi » sur le bon quiz, sans lien à maintenir en double.
        //    Seuls les quiz actifs comptent : un brouillon n'est pas jouable dans l'app.
        $quizParFiche = Question::whereIn('contenu_id', $fiches->pluck('id'))
            ->whereHas('quiz', fn ($q) => $q->where('statut', 'actif'))
            ->with('quiz:id,titre')
            ->get(['quiz_id', 'contenu_id'])
            ->groupBy('contenu_id')
            ->map(fn ($questions) => $questions->pluck('quiz')->unique('id')->sortBy('id')
                ->map(fn ($quiz) => ['id' => $quiz->id, 'titre' => $quiz->titre])
                ->values());

        return response()->json(
            $fiches->map(fn (Contenu $fiche) => $fiche->toArray() + [
                'quiz_lies' => $quizParFiche->get($fiche->id, collect()),
            ])
        );
    }

    public function stockSang()
    {
        return response()->json(
            StockSang::orderBy('groupe_sanguin')->get(['groupe_sanguin', 'niveau'])
        );
    }

    public function evenements()
    {
        return response()->json(
            // 📖 Un événement reste listé jusqu'à sa fin, pas seulement jusqu'à son début :
            //    filtré sur date_heure, le Forum disparaissait de l'accueil dès 13 h 30, en
            //    plein pendant. Même règle que les cartes d'événement (CarteController) :
            //    sans heure de fin, jusqu'à la fin de son jour.
            Evenement::where('statut', 'publie')
                ->where(fn ($q) => $q->where('horaire_fin', '>=', now())
                    ->orWhere(fn ($q) => $q->whereNull('horaire_fin')->where('date_heure', '>=', today())))
                ->orderBy('date_heure', 'asc')
                ->get(['id', 'titre', 'description', 'date_heure', 'horaire_fin', 'lieu', 'image_url'])
        );
    }

    public function eligibilite()
    {
        return response()->json(
            QuestionEligibilite::where('actif', true)
                ->orderBy('ordre')
                ->get(['id', 'ordre', 'question', 'type_reponse', 'reponse_bloquante', 'message_refus'])
        );
    }

    public function documentJuridique(string $type)
    {
        $document = DocumentJuridique::where('type', $type)->first();

        // 📖 Un document pas encore rédigé dans le BO est traité comme absent : l'app
        //    affiche alors « bientôt disponible » plutôt qu'une page vide.
        if (! $document || blank($document->contenu)) {
            return response()->json(['message' => "Ce document n'est pas encore disponible."], 404);
        }

        return response()->json([
            'type' => $document->type,
            'titre' => $document->titre,
            'contenu' => $document->contenu,
            'version' => $document->version,
            'mis_a_jour_le' => $document->updated_at->toDateString(),
        ]);
    }

    public function bannieres()
    {
        $banniere = Banniere::where('active', true)->latest()->first();

        // 📖 Sans bannière activée dans le BO, une pénurie s'annonce d'elle-même : calculée à
        //    chaque appel depuis les stocks, rien n'est stocké, donc elle disparaît dès que plus
        //    aucun groupe n'est critique. Une bannière du BO reste prioritaire (message choisi
        //    par l'association).
        if (! $banniere) {
            $critiques = StockSang::where('niveau', 'critique')
                ->orderBy('groupe_sanguin')
                ->pluck('groupe_sanguin');

            if ($critiques->isEmpty()) {
                return response()->json(['active' => false]);
            }

            return response()->json([
                'active' => true,
                'type' => 'urgence',
                'titre' => 'Stock critique',
                'message' => 'Les réserves de '.$critiques->join(', ', ' et ')
                    .' sont au plus bas. Ton don peut tout changer.',
            ]);
        }

        return response()->json([
            'active' => true,
            'type' => $banniere->type,
            'titre' => $banniere->titre,
            'message' => $banniere->message,
        ]);
    }
}
