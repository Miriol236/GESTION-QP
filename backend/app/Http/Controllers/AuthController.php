<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Utilisateur;
use Illuminate\Support\Facades\DB;

/**
 * @OA\Info(
 *     title="API Gestion des Quotes-Parts - Authentification",
 *     version="1.0.0",
 *     description="Documentation des routes d’authentification (login, logout, me)."
 * )
 *
 * @OA\Server(
 *     url="http://127.0.0.1:8000",
 *     description="Serveur local"
 * )
 *
 * @OA\SecurityScheme(
 *     securityScheme="sanctum",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT"
 * )
 */
class AuthController extends Controller
{
    /**
     * @OA\Post(
     *     path="/api/login",
     *     tags={"Authentification"},
     *     summary="Connexion d’un utilisateur",
     *     description="Permet de se connecter avec un nom d'utilisateur et un mot de passe.",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"username", "password"},
     *             @OA\Property(property="username", type="string"),
     *             @OA\Property(property="password", type="string")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Connexion réussie",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="access_token", type="string"),
     *             @OA\Property(
     *                 property="user",
     *                 type="object",
     *                 @OA\Property(property="UTI_CODE", type="string"),
     *                 @OA\Property(property="UTI_NOM", type="string"),
     *                 @OA\Property(property="UTI_USERNAME", type="string"),
     *                 @OA\Property(property="UTI_STATUT", type="integer")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="Identifiants incorrects"),
     *     @OA\Response(response=403, description="Compte inactif")
     * )
     */
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ], [
            'username.required' => 'Le nom d\'utilisateur est obligatoire.',
            'password.required' => 'Le mot de passe est obligatoire.',
        ]);

        $credentials = [
            'UTI_USERNAME' => $request->username,
            'password' => $request->password,
        ];

        if (Auth::attempt($credentials)) {
            $user = Auth::user()->load('groupe.fonctionnalites', 'regie');

            if ($user->UTI_STATUT != 1) {
                return response()->json(['message' => 'Compte inactif, veuillez contacter l\'administrateur.'], 403);
            }

            // Génération du token
            $token = $user->createToken('api_token')->plainTextToken;

            // Récupération des fonctionnalités du groupe
            $fonctionnalites = $user->groupe
                ? $user->groupe->fonctionnalites->pluck('FON_CODE')->toArray()
                : [];

            return response()->json([
                'message' => 'Connexion réussie',
                'access_token' => $token,
                'user' => $user,
                'GRP_NOM' => $user->groupe->GRP_NOM ?? null,
                'REG_LIBELLE' => $user->regie->REG_LIBELLE ?? null,
                'REG_SIGLE' => $user->regie->REG_SIGLE ?? null,
                'fonctionnalites' => $fonctionnalites,
            ]);
        }

        return response()->json(['message' => 'Identifiants incorrects'], 401);
    }

    /**
     * @OA\Get(
     *     path="/api/me",
     *     tags={"Authentification"},
     *     summary="Obtenir les informations de l’utilisateur connecté",
     *     description="Retourne les informations du compte actuellement connecté.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Informations de l’utilisateur connecté",
     *         @OA\JsonContent(
     *             @OA\Property(property="UTI_CODE", type="string"),
     *             @OA\Property(property="UTI_NOM", type="string"),
     *             @OA\Property(property="UTI_USERNAME", type="string"),
     *             @OA\Property(property="UTI_STATUT", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function me(Request $request)
    {
        $user = $request->user()->load('groupe', 'regie');
        return response()->json($user);
    }

    /**
     * @OA\Post(
     *     path="/api/logout",
     *     tags={"Authentification"},
     *     summary="Déconnexion d’un utilisateur",
     *     description="Révoque le token d’accès actuel de l’utilisateur connecté.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Déconnexion réussie",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnexion réussie']);
    }

    /**
     * @OA\Get(
     *     path="/api/user-fonctionnalites",
     *     tags={"Authentification"},
     *     summary="Obtenir les fonctionnalités de l’utilisateur connecté",
     *     description="Retourne la liste des codes de fonctionnalités associées au groupe de l'utilisateur connecté.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des fonctionnalités récupérée avec succès",
     *         @OA\JsonContent(type="array", @OA\Items(type="string"))
     *     ),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function getUserFonctionnalites()
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non authentifié'], 401);
        }

        // Vérifie que l’utilisateur a bien un groupe
        if (empty($user->GRP_CODE)) {
            return response()->json([]);
        }

        // Récupère les FON_CODE liés à son groupe
        $fonctionnalites = DB::table('t_groupe_fonctionnalite')
            ->join('t_fonctionnalites', 't_fonctionnalites.FON_CODE', '=', 't_groupe_fonctionnalite.FON_CODE')
            ->where('t_groupe_fonctionnalite.GRP_CODE', $user->GRP_CODE)
            ->pluck('t_fonctionnalites.FON_CODE');

        return response()->json($fonctionnalites);
    }

}