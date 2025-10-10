<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckFonctionnalite
{
    public function handle(Request $request, Closure $next, $fonctionnaliteCode)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        //  Récupérer la fonctionnalité
        $fonctionnalite = DB::table('T_FONCTIONNALITES')
            ->where('FON_CODE', '=', $fonctionnaliteCode)
            ->first();

        if (!$fonctionnalite) {
            return response()->json([
                'message' => "La fonctionnalité avec le code « {$fonctionnaliteCode} » est introuvable."
            ], 404);
        }

        //  Récupérer les infos du groupe de l'utilisateur
        $groupe = DB::table('T_GROUPES')
            ->where('GRP_CODE', '=', $user->GRP_CODE)
            ->first();

        if (!$groupe) {
            return response()->json([
                'message' => "Le groupe associé à cet utilisateur (code {$user->GRP_CODE}) est introuvable."
            ], 404);
        }

        //  Vérifier le droit d'accès dans la table pivot
        $hasAccess = DB::table('T_GROUPE_FONCTIONNALITE')
            ->where('GRP_CODE', '=', $user->GRP_CODE)
            ->where('FON_CODE', '=', $fonctionnaliteCode)
            ->exists();

        if (!$hasAccess) {
            return response()->json([
                'message' => "Accès refusé. Vous n'avez pas la permission d'accéder à la fonctionnalité « {$fonctionnalite->FON_NOM} »."
            ], 403);
        }

        //  Autorisé
        return $next($request);
    }
}