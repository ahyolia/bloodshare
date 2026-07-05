<?php

use App\Http\Controllers\ScanController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/scan', [ScanController::class, 'scan']);
});
