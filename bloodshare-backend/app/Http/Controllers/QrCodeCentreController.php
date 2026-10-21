<?php

namespace App\Http\Controllers;

use App\Models\QrCode;
use App\Services\QrCentreTournant;
use Barryvdh\DomPDF\Facade\Pdf;
use Filament\Facades\Filament;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode as QrCodeGenerator;

class QrCodeCentreController extends Controller
{
    /**
     * 📖 Page affichée en continu sur l'écran du centre. Ouverte par un lien signé (route
     *    `signed`) et pas par une session BO : l'écran est dans un lieu public, il ne doit
     *    donner accès à rien d'autre. Régénérer le QR centre désactive ce QrCode, donc le
     *    lien de l'ancien affichage répond 404.
     */
    public function affichage(QrCode $qrCode, QrCentreTournant $tournant)
    {
        abort_unless($qrCode->type === 'centre' && $qrCode->actif, 404);

        $svg = QrCodeGenerator::format('svg')
            ->size(420)
            ->errorCorrection('M')
            ->generate($tournant->jetonCourant($qrCode));

        return response()
            ->view('qrcode-centre.affichage', [
                'svg' => $svg,
                // 📖 +1 s : recharger juste après le changement de fenêtre, pas juste avant.
                'rechargement' => $tournant->secondesRestantes() + 1,
            ])
            ->header('Cache-Control', 'no-store')
            ->header('X-Robots-Tag', 'noindex');
    }

    /**
     * 📖 PNG ou PDF à imprimer : le QR fixe d'un événement, ou le QR de secours du centre
     *    (accepté seulement pendant le mode secours, voir QrCentreTournant). Le token brut
     *    du centre n'est jamais encodé : c'est la clé qui signe le QR tournant.
     */
    public function telecharger(QrCode $qrCode, string $format, QrCentreTournant $tournant)
    {
        abort_unless(auth()->user()->canAccessPanel(Filament::getPanel('admin')), 403);
        abort_unless($qrCode->actif, 404);

        $centre = $qrCode->type === 'centre';
        $contenu = $centre ? $tournant->jetonSecours($qrCode) : $qrCode->token;
        $nom = $centre ? 'qrcode-centre-secours' : 'qrcode-evenement-' . Str::slug($qrCode->evenement?->titre ?? $qrCode->id);

        $png = QrCodeGenerator::format('png')
            ->size(600)
            ->errorCorrection('H')
            ->generate($contenu);

        if ($format === 'png') {
            return response($png, 200, [
                'Content-Type'        => 'image/png',
                'Content-Disposition' => "attachment; filename=\"{$nom}.png\"",
            ]);
        }

        return Pdf::loadView('qrcode-centre.pdf', [
            'png' => base64_encode($png),
            'titre' => $centre ? 'QR Code de secours du centre' : ($qrCode->evenement?->titre ?? 'Événement'),
            'consigne' => $centre
                ? "Scanne ce QR Code avec l'app Aïma pour valider ton don."
                : "Scanne ce QR Code avec l'app Aïma pour valider ta participation.",
            'note' => $centre
                ? "À n'utiliser que si l'écran du centre est en panne : ce QR Code ne fonctionne que lorsque le mode secours est activé dans le backoffice."
                : null,
        ])->download("{$nom}.pdf");
    }
}
