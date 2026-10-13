<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banniere;
use App\Models\Contenu;
use App\Models\DocumentJuridique;
use App\Models\Evenement;
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
        return response()->json(
            Contenu::where('type', 'fiche_info')
                ->where('statut', 'publie')
                ->orderBy('published_at', 'asc')
                ->get(['id', 'titre', 'categorie', 'contenu', 'image_url', 'quiz_cta', 'le_saviez_vous', 'published_at'])
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
            Evenement::where('statut', 'publie')
                ->where('date_heure', '>=', now())
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

        if (! $banniere) {
            return response()->json(['active' => false]);
        }

        return response()->json([
            'active' => true,
            'type' => $banniere->type,
            'titre' => $banniere->titre,
            'message' => $banniere->message,
        ]);
    }
}
