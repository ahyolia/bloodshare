<?php

use App\Http\Controllers\QrCodeCentreController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// 📖 Lien signé (sans expiration) généré depuis la page « QR Code centre » du BO, ouvert
//    sur l'écran du centre. Remplace le téléchargement PNG : un QR fixe imprimé ne valide
//    plus de don.
Route::get('/qrcode-centre/affichage/{qrCode}', [QrCodeCentreController::class, 'affichage'])
    ->name('qrcode.centre.affichage')
    // 📖 Signature relative (sans l'hôte) : derrière ngrok/Dokploy, l'hôte du lien généré
    //    dans le BO et celui de la requête de l'écran peuvent différer.
    ->middleware('signed:relative');

Route::get('/admin/qrcodes/{qrCode}/telecharger/{format}', [QrCodeCentreController::class, 'telecharger'])
    ->whereIn('format', ['png', 'pdf'])
    ->name('qrcode.telecharger')
    ->middleware(['web', 'auth']);
