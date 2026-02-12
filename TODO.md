# TODO: Add and Correct Swagger Annotations

## Global Setup
- [x] Add global @OA\Info and @OA\Server in AuthController or separate file

## Controllers Annotations
- [x] AuthController: Add missing annotations for getUserFonctionnalites, fix existing
- [x] UtilisateurController: Add missing annotations for updatePassword, fix path inconsistencies
- [x] GroupeController: Already has annotations
- [x] FonctionnaliteController: Already has annotations
- [x] TypeBeneficiaireController: Add missing annotations for indexPublic
- [x] FonctionController: Already has annotations
- [x] GradeController: Already has annotations
- [x] EcheanceController: Add all annotations
- [x] RegieController: Add all annotations
- [x] BanqueController: Fix syntax error in annotations
- [x] GuichetController: Add all annotations
- [x] BeneficiaireController: Add all annotations
- [x] DomicilierController: Add all annotations
- [x] ElementController: Add all annotations
- [x] PaiementController: Add all annotations
- [x] DetailsPaiementController: Add all annotations
- [x] DashbordController: Add all annotations
- [x] TypeMouvementController: Add all annotations
- [x] NiveauValidationController: Add all annotations
- [x] PositionController: Add all annotations
- [x] VirementController: Add all annotations
- [x] MouvementController: Add all annotations
- [x] HistoriquesValidationController: Add all annotations

## Schemas
- [x] Define @OA\Schema for models like Utilisateur, Groupe, etc.

## Generation
- [x] Run php artisan l5-swagger:generate to generate docs
- [x] Test accessing /api/documentation
