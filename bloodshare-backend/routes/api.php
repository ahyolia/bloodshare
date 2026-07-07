<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfilController;
use App\Http\Controllers\ScanController;
use Illuminate\Support\Facades\Route;

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
});
