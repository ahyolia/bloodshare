<?php

use App\Http\Controllers\QrCodeCentreController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/admin/qrcode-centre/download', [QrCodeCentreController::class, 'download'])
    ->name('qrcode.centre.download')
    ->middleware(['web', 'auth']);
