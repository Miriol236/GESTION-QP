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
use App\Http\Controllers\BanqueController;
use App\Http\Controllers\GuichetController;
use App\Http\Controllers\BeneficiaireController;
use App\Http\Controllers\DomicilierController;
use App\Http\Controllers\ElementController;
use App\Http\Controllers\PaiementController;
use App\Http\Controllers\DetailsPaiementController;
use App\Http\Controllers\DashbordController;
use App\Http\Controllers\TypeMouvementController;
use App\Http\Controllers\NiveauValidationController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\VirementController;
use App\Http\Controllers\MouvementController;
use App\Http\Controllers\BeneficiaireLocalController;
use App\Http\Controllers\PaiementLocalController;

Route::post('/login', [AuthController::class, 'login']);
Route::middleware('api.key')->get('/liste-beneficiaires', [BeneficiaireLocalController::class, 'index']);
Route::middleware('api.key')->get('/liste-paiements', [PaiementLocalController::class, 'index']);
Route::middleware('auth:sanctum')->get('/user-fonctionnalites', [AuthController::class, 'getUserFonctionnalites']);

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
    
    Route::put('/profile-update', [UtilisateurController::class, 'updatePassword']);

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
    Route::put('/echeances/{code}/activer', [EcheanceController::class, 'activer']);
    Route::get('/echeance/active', [EcheanceController::class, 'active']);
    Route::get('/echeances-publique', [EcheanceController::class, 'indexPublic']);
    Route::get('/echeances-anciennes', [EcheanceController::class, 'getAnciennesEcheances']);

    // Routes régies
    Route::get('/regies', [RegieController::class, 'index'])->middleware('fonctionnalite:0008');
    Route::get('/regies/{id}', [RegieController::class, 'show'])->middleware('fonctionnalite:0008');
    Route::post('/regies', [RegieController::class, 'store'])->middleware('fonctionnalite:0008');
    Route::put('/regies/{id}', [RegieController::class, 'update'])->middleware('fonctionnalite:0008');
    Route::delete('/regies/{id}', [RegieController::class, 'destroy'])->middleware('fonctionnalite:0008');
    Route::get('/regies-publiques', [RegieController::class, 'indexPublic']);

    // Routes banques
    Route::get('/banques', [BanqueController::class, 'index'])->middleware('fonctionnalite:0009');
    Route::get('/banques/{id}', [BanqueController::class, 'show'])->middleware('fonctionnalite:0009');
    Route::post('/banques', [BanqueController::class, 'store'])->middleware('fonctionnalite:0009');
    Route::put('/banques/{id}', [BanqueController::class, 'update'])->middleware('fonctionnalite:0009');
    Route::delete('/banques/{id}', [BanqueController::class, 'destroy'])->middleware('fonctionnalite:0009');

    // Routes guichets
    Route::get('/guichets', [GuichetController::class, 'index'])->middleware('fonctionnalite:0010');
    Route::get('/guichets/{id}', [GuichetController::class, 'show'])->middleware('fonctionnalite:0010');
    Route::post('/guichets', [GuichetController::class, 'store'])->middleware('fonctionnalite:0010');
    Route::put('/guichets/{id}', [GuichetController::class, 'update'])->middleware('fonctionnalite:0010');
    Route::delete('/guichets/{id}', [GuichetController::class, 'destroy'])->middleware('fonctionnalite:0010');

    // Routes bénéficiaires
    Route::get('/beneficiaires', [BeneficiaireController::class, 'index'])->middleware('fonctionnalite:0011');
    // Route::get('/liste-beneficiaires', [BeneficiaireController::class, 'getAll'])->middleware('fonctionnalite:0012');
    Route::get('/beneficiaires/{id}', [BeneficiaireController::class, 'show'])->middleware('fonctionnalite:0011');
    Route::get('/beneficiaires-search', [BeneficiaireController::class, 'search']);
    Route::post('/beneficiaires', [BeneficiaireController::class, 'store'])->middleware('fonctionnalite:0011');
    Route::post('/domiciliations', [DomicilierController::class, 'store']);
    Route::put('/beneficiaires/valider/{id?}', [BeneficiaireController::class, 'validerBeneficiaire']);
    Route::put('/beneficiaires/approuver/{id?}', [MouvementController::class, 'approuverBeneficiaire']);
    Route::put('/beneficiaires/rejeter/{id?}', [MouvementController::class, 'rejeterBeneficiaire']);
    Route::put('beneficiaires/valider-domicilier/{BEN_CODE}', [MouvementController::class, 'validerBeneficiaireEtDomicilier']);
    Route::put('/beneficiaires/{id}', [BeneficiaireController::class, 'update'])->middleware('fonctionnalite:0011');
    Route::delete('/beneficiaires/{id}', [BeneficiaireController::class, 'destroy'])->middleware('fonctionnalite:0011');
    Route::get('/domiciliations/{BEN_CODE}', [DomicilierController::class, 'showByBeneficiaire']);
    Route::put('/domiciliations/{DOM_CODE}', [DomicilierController::class, 'update']);
    Route::delete('/domiciliations/{DOM_CODE}', [DomicilierController::class, 'destroy']);
    Route::put('/domiciliations/valider/{id?}', [DomicilierController::class, 'validerDomicilier']);
    Route::put('/domiciliers/approuver/{id?}', [MouvementController::class, 'approuverDomicilier']);
    Route::put('/domiciliers/rejeter/{id?}', [MouvementController::class, 'rejeterDomicilier']);
    Route::get('/rib/preview/{DOM_CODE}', [DomicilierController::class, 'previewRib']);
    Route::get('/domiciliations/{DOM_CODE}/telecharger-rib', [DomicilierController::class, 'telechargerRib']);
    
    // Routes éléments
    Route::get('/elements', [ElementController::class, 'index'])->middleware('fonctionnalite:0013');
    Route::get('/elements/{id}', [ElementController::class, 'show'])->middleware('fonctionnalite:0013');
    Route::post('/elements', [ElementController::class, 'store'])->middleware('fonctionnalite:0013');
    Route::put('/elements/{id}', [ElementController::class, 'update'])->middleware('fonctionnalite:0013');
    Route::delete('/elements/{id}', [ElementController::class, 'destroy'])->middleware('fonctionnalite:0013');
    Route::get('/elements-publics', [ElementController::class, 'indexPublic']);
    
    // Routes paiements
    Route::get('/paiements', [PaiementController::class, 'index'])->middleware('fonctionnalite:0014');
    Route::get('/beneficiaires-rib', [PaiementController::class, 'getBenStatus']);
    Route::get('/info-beneficiaires', [PaiementController::class, 'getAll']);
    Route::get('/search-beneficiaires', [BeneficiaireController::class, 'searchBeneficiaires']);
    Route::get('/paiements/{id}', [PaiementController::class, 'show'])->middleware('fonctionnalite:0014');
    Route::post('/paiements', [PaiementController::class, 'store'])->middleware('fonctionnalite:0014');
    Route::post('/paiements/generate', [PaiementController::class, 'generatePaiementsFromOldEcheance']);
    Route::put('/paiements/valider-virement/{id?}', [PaiementController::class, 'validerVirement']);
    Route::put('/paiements/approuver/{id?}', [MouvementController::class, 'approuverPaiement']);
    Route::put('/paiements/rejeter/{id?}', [MouvementController::class, 'rejeterPaiement']);
    Route::put('paiements/valider-terminer/{PAI_CODE}', [PaiementController::class, 'validerPaiementTerminer']);
    Route::put('/paiements/valider/{id?}', [PaiementController::class, 'validerPaiement']);
    Route::put('/paiements/{id}', [PaiementController::class, 'update'])->middleware('fonctionnalite:0014');
    Route::delete('/paiements/supprimer-virements', [PaiementController::class, 'deletePaiement']);
    Route::delete('/paiements/{id}', [PaiementController::class, 'destroy'])->middleware('fonctionnalite:0014');

    Route::get('/details-paiement/{PAI_CODE}', [DetailsPaiementController::class, 'showByPaiement']);
    Route::get('/total-paiement', [DetailsPaiementController::class, 'getTotalsByUser']);
    Route::post('/details-paiement', [DetailsPaiementController::class, 'store']);
    Route::put('/details-paiement/{id}', [DetailsPaiementController::class, 'update']);
    Route::delete('/details-paiement/{id}', [DetailsPaiementController::class, 'destroy']);


    // Lecture ouverte à tout utilisateur authentifié
    Route::get('/typeBeneficiaires-public', [TypeBeneficiaireController::class, 'indexPublic']);
    Route::get('/fonctions-public', [FonctionController::class, 'indexPublic']);
    Route::get('/grades-public', [GradeController::class, 'indexPublic']);
    Route::get('banques-public', [BanqueController::class, 'indexPublic']);
    Route::get('guichets-public', [GuichetController::class, 'indexPublic']);
    Route::get('positions-publiques', [PositionController::class, 'indexPublic']);

    Route::get('/totals-by-user', [DashbordController::class, 'getTotalsByUser']);
    Route::get('/totals-by-regie', [DashbordController::class, 'getTotalsByRegie']);

    // Routes types mouvements
    Route::get('/typeMouvements', [TypeMouvementController::class, 'index'])->middleware('fonctionnalite:0015');
    Route::get('/typeMouvements/{id}', [TypeMouvementController::class, 'show'])->middleware('fonctionnalite:0015');
    Route::post('/typeMouvements', [TypeMouvementController::class, 'store'])->middleware('fonctionnalite:0015');
    Route::put('/typeMouvements/{id}', [TypeMouvementController::class, 'update'])->middleware('fonctionnalite:0015');
    Route::delete('/typeMouvements/{id}', [TypeMouvementController::class, 'destroy'])->middleware('fonctionnalite:0015');

    // Routes niveaux de validation
    Route::get('/niveau-validations', [NiveauValidationController::class, 'index'])->middleware('fonctionnalite:0016');
    Route::get('/niveau-validations/{id}', [NiveauValidationController::class, 'show'])->middleware('fonctionnalite:0016');
    Route::post('/niveau-validations', [NiveauValidationController::class, 'store'])->middleware('fonctionnalite:0016');
    Route::put('/niveau-validations/{id}', [NiveauValidationController::class, 'update'])->middleware('fonctionnalite:0016');
    Route::delete('/niveau-validations/{id}', [NiveauValidationController::class, 'destroy'])->middleware('fonctionnalite:0016');

    // Routes positions
    Route::get('/positions', [PositionController::class, 'index'])->middleware('fonctionnalite:0017');
    Route::get('/positions/{id}', [PositionController::class, 'show'])->middleware('fonctionnalite:0017');
    Route::post('/positions', [PositionController::class, 'store'])->middleware('fonctionnalite:0017');
    Route::put('/positions/{id}', [PositionController::class, 'update'])->middleware('fonctionnalite:0017');
    Route::delete('/positions/{id}', [PositionController::class, 'destroy'])->middleware('fonctionnalite:0017');

    // Routes virements
    Route::get('/virements', [VirementController::class, 'index'])->middleware('fonctionnalite:0018');
    Route::get('/virements/{id}', [VirementController::class, 'show'])->middleware('fonctionnalite:0018');
    Route::post('/virements', [VirementController::class, 'store'])->middleware('fonctionnalite:0018');
    Route::put('/virements/{id}', [VirementController::class, 'update'])->middleware('fonctionnalite:0018');
    Route::delete('/virements/{id}', [VirementController::class, 'destroy'])->middleware('fonctionnalite:0018');

    // Routes mouvements
    Route::get('/mouvements/beneficiaires', [MouvementController::class, 'getMouvementsBeneficiairesEnCours'])->middleware('fonctionnalite:0019');
    Route::get('/mouvements/domiciliers', [MouvementController::class, 'getMouvementsDomiciliersEnCours'])->middleware('fonctionnalite:0020');
    Route::get('/mouvements/paiements', [MouvementController::class, 'getMouvementsPaiementsEnCours'])->middleware('fonctionnalite:0021');
    Route::get('/mouvements/totaux', [MouvementController::class, 'getTotauxMouvementsEnCours']);

    Route::get('/paiements-filters', [\App\Http\Controllers\Report\PaiementReportController::class, 'filters']);
    Route::get('/beneficiaires-export', [\App\Http\Controllers\Report\BeneficiaireReportController::class, 'export']);
    Route::get('/paiements-export', [\App\Http\Controllers\Report\PaiementReportController::class, 'exportEtatGlobal']);
});