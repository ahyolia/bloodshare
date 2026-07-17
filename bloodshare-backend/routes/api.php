<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BadgeController;
use App\Http\Controllers\Api\CarteController;
use App\Http\Controllers\Api\ContenuController;
use App\Http\Controllers\Api\DefiController;
use App\Http\Controllers\Api\DonController;
use App\Http\Controllers\Api\ParrainageController;
use App\Http\Controllers\Api\PointsController;
use App\Http\Controllers\Api\ProfilController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\ScanController;
use Illuminate\Support\Facades\Route;

// Contenu éditorial (public, pas besoin d'être connecté)
Route::get('/actualites', [ContenuController::class, 'actualites']);
Route::get('/fiches-infos', [ContenuController::class, 'fichesInfos']);
Route::get('/faq', [ContenuController::class, 'faq']);
Route::get('/eligibilite', [ContenuController::class, 'eligibilite']);
Route::get('/stock-sang', [ContenuController::class, 'stockSang']);
Route::get('/evenements', [ContenuController::class, 'evenements']);
Route::get('/bannieres', [ContenuController::class, 'bannieres']);

// Auth (pas besoin d'être connecté)
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/logout', [AuthController::class, 'logout'])
        ->middleware('auth:sanctum');
});

// Profil (connecté obligatoire)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [ProfilController::class, 'show']);
    Route::put('/me', [ProfilController::class, 'update']);
    Route::delete('/me', [ProfilController::class, 'destroy']);

    // Scan (déjà existant — ne pas toucher)
    Route::post('/scan', [ScanController::class, 'scan']);

    // Données personnelles
    Route::get('/dons', [DonController::class, 'index']);
    Route::get('/cartes', [CarteController::class, 'index']);
    Route::get('/badges', [BadgeController::class, 'index']);
    Route::get('/points/historique', [PointsController::class, 'index']);
    Route::get('/parrainage/code', [ParrainageController::class, 'index']);

    // Gamification
    Route::get('/quiz', [QuizController::class, 'index']);
    Route::get('/quiz/{id}', [QuizController::class, 'show']);
    Route::post('/quiz/{id}/soumettre', [QuizController::class, 'soumettre']);
    Route::get('/defis/actuel', [DefiController::class, 'actuel']);
});
