<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ApiKeyMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // Récupère la clé dans le header
        $apiKey = $request->header('X-API-KEY');

        if (!$apiKey) {
            return response()->json(['message' => 'Clé manquante'], 401);
        }

        // Vérifie la clé contre celle dans .env
        if ($apiKey !== env('API_KEY_SYSTEME_LOCAL')) {
            return response()->json(['message' => 'Clé invalide'], 401);
        }

        return $next($request);
    }
}