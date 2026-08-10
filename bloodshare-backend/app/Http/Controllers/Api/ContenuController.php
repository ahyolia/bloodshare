<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banniere;
use App\Models\Contenu;
use App\Models\Evenement;
use App\Models\Faq;
use App\Models\StockSang;

class ContenuController extends Controller
{
    public function actualites()
    {
        return response()->json(
            Contenu::where('type', 'actualite')
                ->where('statut', 'publie')
                ->orderBy('published_at', 'desc')
                ->get(['id', 'titre', 'image_url', 'published_at'])
        );
    }

    public function fichesInfos()
    {
        return response()->json(
            Contenu::where('type', 'fiche_info')
                ->where('statut', 'publie')
                ->orderBy('published_at', 'asc')
                ->get(['id', 'titre', 'categorie', 'contenu', 'image_url', 'published_at'])
        );
    }

    public function faq()
    {
        return response()->json(
            Faq::where('actif', true)
                ->orderBy('ordre', 'asc')
                ->get(['id', 'categorie', 'question', 'reponse'])
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
                ->get(['id', 'titre', 'date_heure', 'horaire_fin', 'lieu', 'image_url'])
        );
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
