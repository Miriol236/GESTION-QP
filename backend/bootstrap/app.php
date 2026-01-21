<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {

        // Middleware perso
        $middleware->alias([
            'fonctionnalite' => App\Http\Middleware\CheckFonctionnalite::class,
        ]);

    
        // Sanctum pour API
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

    })
    ->withExceptions(function (Exceptions $exceptions): void {
         // Non authentifié
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Session expirée. Veuillez vous reconnecter.'
                ], 401);
            }
        });

        // Route [login] manquante
        $exceptions->render(function (\Illuminate\Routing\Exceptions\UrlGenerationException | \Symfony\Component\Routing\Exception\RouteNotFoundException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => false,
                    'error' => 'unauthenticated',
                    'message' => 'Veuillez vous reconnecter pour continuer.'
                ], 401);
            }
        });

        //  Violation de contrainte (clé étrangère)
        $exceptions->render(function (Illuminate\Database\QueryException $e, $request) {
            if ($request->is('api/*')) {
                $sqlMessage = $e->getMessage();

                // Cas suppression avec clé étrangère
                if ($e->getCode() === '23000' && str_contains($sqlMessage, 'FOREIGN KEY')) {
                    return response()->json([
                        'message' => 'Impossible de supprimer cet élément car il est lié à d\'autres enregistrements.',
                    ], 409);
                }

                // Cas violation de NOT NULL (champ obligatoire)
                if ($e->getCode() === '23000' && str_contains($sqlMessage, 'cannot be null')) {
                    return response()->json([
                        'message' => 'Un ou plusieurs champs obligatoires ne sont pas remplis.',
                    ], 422);
                }

                // Autres erreurs SQL 23000
                return response()->json([
                    'message' => 'Erreur de base de données : '.$sqlMessage,
                ], 500);
            }
        });

        //  Si une route n’existe pas ou n’est pas autorisée
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Route introuvable ou accès refusé.'
                ], 404);
            }
        });

        //  Si une autre erreur inattendue survient
        $exceptions->render(function (Throwable $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => 500,
                    'error' => class_basename($e),
                    'message' => $e->getMessage(),
                ], 500);
            }
        });
    })->create();

