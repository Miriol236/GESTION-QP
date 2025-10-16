<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UtilisateurController;
use App\Http\Controllers\GroupeController;
use App\Http\Controllers\FonctionnaliteController;
use App\Http\Controllers\TypeBeneficiaireController;
use App\Http\Controllers\FonctionController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\EcheanceController;
use App\Http\Controllers\RegieController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Routes utilisateurs
    Route::get('/utilisateurs', [UtilisateurController::class, 'index'])
        ->middleware('fonctionnalite:0001');

    Route::get('/utilisateurs/{id}', [UtilisateurController::class, 'show'])
        ->middleware('fonctionnalite:0001');

    Route::post('/utilisateurs', [UtilisateurController::class, 'store'])
        ->middleware('fonctionnalite:0001');

    Route::put('/utilisateurs/{id}', [UtilisateurController::class, 'update'])
        ->middleware('fonctionnalite:0001');

    Route::delete('/utilisateurs/{id}', [UtilisateurController::class, 'destroy'])
        ->middleware('fonctionnalite:0001');
    
    Route::patch('/utilisateurs/{id}/toggle-status', [UtilisateurController::class, 'toggleStatus']);

    // Routes groupes
    Route::get('/groupes', [GroupeController::class, 'index'])->middleware('fonctionnalite:0002');
    Route::get('/groupes/{id}', [GroupeController::class, 'show'])->middleware('fonctionnalite:0002');
    Route::post('/groupes', [GroupeController::class, 'store'])->middleware('fonctionnalite:0002');
    Route::put('/groupes/{id}', [GroupeController::class, 'update'])->middleware('fonctionnalite:0002');
    Route::delete('/groupes/{id}', [GroupeController::class, 'destroy'])->middleware('fonctionnalite:0002');

    // Routes fonctionnalités
    Route::get('/fonctionnalites', [FonctionnaliteController::class, 'index'])->middleware('fonctionnalite:0003');
    Route::get('/fonctionnalites/{id}', [FonctionnaliteController::class, 'show'])->middleware('fonctionnalite:0003');
    Route::post('/fonctionnalites', [FonctionnaliteController::class, 'store'])->middleware('fonctionnalite:0003');
    Route::put('/fonctionnalites/{id}', [FonctionnaliteController::class, 'update'])->middleware('fonctionnalite:0003');
    Route::delete('/fonctionnalites/{id}', [FonctionnaliteController::class, 'destroy'])->middleware('fonctionnalite:0003');

    // Routes pour les droits d'accès
    Route::get('/groupes/{grpCode}/fonctionnalites', [GroupeController::class, 'getFonctionnalites']);
    Route::post('/groupes/{grpCode}/fonctionnalites', [GroupeController::class, 'updateFonctionnalites']);

    // Routes types bénéficiaires
    Route::get('/typeBeneficiaires', [TypeBeneficiaireController::class, 'index'])->middleware('fonctionnalite:0004');
    Route::get('/typeBeneficiaires/{id}', [TypeBeneficiaireController::class, 'show'])->middleware('fonctionnalite:0004');
    Route::post('/typeBeneficiaires', [TypeBeneficiaireController::class, 'store'])->middleware('fonctionnalite:0004');
    Route::put('/typeBeneficiaires/{id}', [TypeBeneficiaireController::class, 'update'])->middleware('fonctionnalite:0004');
    Route::delete('/typeBeneficiaires/{id}', [TypeBeneficiaireController::class, 'destroy'])->middleware('fonctionnalite:0004');

    // Routes fonctions
    Route::get('/fonctions', [FonctionController::class, 'index'])->middleware('fonctionnalite:0005');
    Route::get('/fonctions/{id}', [FonctionController::class, 'show'])->middleware('fonctionnalite:0005');
    Route::post('/fonctions', [FonctionController::class, 'store'])->middleware('fonctionnalite:0005');
    Route::put('/fonctions/{id}', [FonctionController::class, 'update'])->middleware('fonctionnalite:0005');
    Route::delete('/fonctions/{id}', [FonctionController::class, 'destroy'])->middleware('fonctionnalite:0005');

    // Routes grades
    Route::get('/grades', [GradeController::class, 'index'])->middleware('fonctionnalite:0006');
    Route::get('/grades/{id}', [GradeController::class, 'show'])->middleware('fonctionnalite:0006');
    Route::post('/grades', [GradeController::class, 'store'])->middleware('fonctionnalite:0006');
    Route::put('/grades/{id}', [GradeController::class, 'update'])->middleware('fonctionnalite:0006');
    Route::delete('/grades/{id}', [GradeController::class, 'destroy'])->middleware('fonctionnalite:0006');

    // Routes grades
    Route::get('/echeances', [EcheanceController::class, 'index'])->middleware('fonctionnalite:0007');
    Route::get('/echeances/{id}', [EcheanceController::class, 'show'])->middleware('fonctionnalite:0007');
    Route::post('/echeances', [EcheanceController::class, 'store'])->middleware('fonctionnalite:0007');
    Route::put('/echeances/{id}', [EcheanceController::class, 'update'])->middleware('fonctionnalite:0007');
    Route::delete('/echeances/{id}', [EcheanceController::class, 'destroy'])->middleware('fonctionnalite:0007');

    // Routes régies
    Route::get('/regies', [RegieController::class, 'index'])->middleware('fonctionnalite:0008');
    Route::get('/regies/{id}', [RegieController::class, 'show'])->middleware('fonctionnalite:0008');
    Route::post('/regies', [RegieController::class, 'store'])->middleware('fonctionnalite:0008');
    Route::put('/regies/{id}', [RegieController::class, 'update'])->middleware('fonctionnalite:0008');
    Route::delete('/regies/{id}', [RegieController::class, 'destroy'])->middleware('fonctionnalite:0008');
});