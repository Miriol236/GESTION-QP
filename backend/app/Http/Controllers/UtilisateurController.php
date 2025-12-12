<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Utilisateur;
use Illuminate\Support\Facades\Hash;

/**
 * @OA\Tag(
 *     name="Utilisateurs",
 *     description="Gestion des utilisateurs et de leurs informations"
 * )
 */
class UtilisateurController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/utilisateurs",
     *     tags={"Utilisateurs"},
     *     summary="Lister tous les utilisateurs",
     *     description="Retourne la liste complète des utilisateurs enregistrés.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des utilisateurs récupérée avec succès",
     *         @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/Utilisateur"))
     *     ),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function index()
    {
        $utilisateurs = Utilisateur::all();
        return response()->json($utilisateurs);
    }

    /**
     * @OA\Get(
     *     path="/api/utilisateurs/{id}",
     *     tags={"Utilisateurs"},
     *     summary="Afficher les détails d’un utilisateur",
     *     description="Retourne les informations détaillées d’un utilisateur spécifique.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string"),
     *         description="Identifiant unique de l'utilisateur"
     *     ),
     *     @OA\Response(response=200, description="Utilisateur trouvé", @OA\JsonContent(ref="#/components/schemas/Utilisateur")),
     *     @OA\Response(response=404, description="Utilisateur non trouvé")
     * )
     */
    public function show($id)
    {
        $utilisateur = Utilisateur::find($id);

        if (!$utilisateur) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        return response()->json($utilisateur);
    }

     /**
     * @OA\Post(
     *     path="/api/utilisateurs",
     *     tags={"Utilisateurs"},
     *     summary="Créer un nouvel utilisateur",
     *     description="Ajoute un nouvel utilisateur dans le système.",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"UTI_NOM", "UTI_PRENOM", "UTI_USERNAME", "UTI_PASSWORD", "GRP_CODE"},
     *             @OA\Property(property="UTI_NOM", type="string"),
     *             @OA\Property(property="UTI_PRENOM", type="string"),
     *             @OA\Property(property="UTI_USERNAME", type="string"),
     *             @OA\Property(property="UTI_PASSWORD", type="string"),
     *             @OA\Property(property="UTI_SEXE", type="string", nullable=true),
     *             @OA\Property(property="UTI_AVATAR", type="string", nullable=true),
     *             @OA\Property(property="GRP_CODE", type="string"),
     *             @OA\Property(property="REG_CODE", type="string", nullable=true)
     *         )
     *     ),
     *     @OA\Response(response=201, description="Utilisateur créé avec succès"),
     *     @OA\Response(response=409, description="Utilisateur déjà existant"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'UTI_NOM' => 'required|string|max:100',
            'UTI_PRENOM' => 'required|string|max:100',
            'UTI_USERNAME' => 'required|string|unique:t_utilisateurs,UTI_USERNAME',
            'UTI_PASSWORD' => 'required|string|min:6',
            'UTI_SEXE' => 'nullable|string|max:1',
            'GRP_CODE' => 'required|string',
        ], [
            'UTI_USERNAME.unique' => 'Ce username existe déjà.',
            'UTI_PASSWORD.min' => 'Le mot de passe prend minimum 6 caractères.',
        ]);

        $exists = Utilisateur::where('UTI_NOM', $request->UTI_NOM)
            ->where('UTI_PRENOM', $request->UTI_PRENOM)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Un utilisateur avec ce nom et prénom existe déjà.'
            ], 409);
        }

        $utilisateur = new Utilisateur();
        $utilisateur->UTI_NOM = $request->UTI_NOM;
        $utilisateur->UTI_PRENOM = $request->UTI_PRENOM;
        $utilisateur->UTI_SEXE = $request->UTI_SEXE;
        $utilisateur->UTI_USERNAME = $request->UTI_USERNAME;
        $utilisateur->UTI_PASSWORD = Hash::make($request->UTI_PASSWORD);
        $utilisateur->UTI_AVATAR = $request->UTI_AVATAR ?? '';
        $utilisateur->UTI_DATE_CREER = now();
        $utilisateur->UTI_CREER_PAR = auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM';
        $utilisateur->UTI_STATUT = true;
        $utilisateur->GRP_CODE = $request->GRP_CODE;
        $utilisateur->REG_CODE = $request->REG_CODE;
        $utilisateur->save();

        return response()->json(['message' => 'Utilisateur créé avec succès'], 201);
    }

    /**
     * @OA\Put(
     *     path="/api/utilisateurs/{id}",
     *     tags={"Utilisateurs"},
     *     summary="Mettre à jour un utilisateur",
     *     description="Modifie les informations d’un utilisateur existant.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\RequestBody(
     *         required=false,
     *         @OA\JsonContent(
     *             @OA\Property(property="UTI_NOM", type="string"),
     *             @OA\Property(property="UTI_PRENOM", type="string"),
     *             @OA\Property(property="UTI_SEXE", type="string"),
     *             @OA\Property(property="UTI_AVATAR", type="string"),
     *             @OA\Property(property="UTI_USERNAME", type="string"),
     *             @OA\Property(property="UTI_PASSWORD", type="string", nullable=true),
     *             @OA\Property(property="GRP_CODE", type="string"),
     *             @OA\Property(property="REG_CODE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Utilisateur mis à jour avec succès"),
     *     @OA\Response(response=404, description="Utilisateur non trouvé"),
     *     @OA\Response(response=409, description="Conflit : utilisateur déjà existant"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function update(Request $request, $id)
    {
        $utilisateur = Utilisateur::find($id);

        if (!$utilisateur) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        $exists = Utilisateur::where('UTI_NOM', $request->UTI_NOM)
            ->where('UTI_PRENOM', $request->UTI_PRENOM)
            ->where('UTI_CODE', '!=', $id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Un utilisateur avec ce nom et prénom existe déjà.'], 409);
        }

        $password = $request->filled('UTI_PASSWORD')
        ? Hash::make($request->UTI_PASSWORD)
        : $utilisateur->UTI_PASSWORD;

        $nouvelleVersion = ($utilisateur->UTI_VERSION ?? 0) + 1;

        $utilisateur->update([
            'UTI_NOM' => $request->UTI_NOM ?? $utilisateur->UTI_NOM,
            'UTI_PRENOM' => $request->UTI_PRENOM ?? $utilisateur->UTI_PRENOM,
            'UTI_SEXE' => $request->UTI_SEXE ?? $utilisateur->UTI_SEXE,
            'UTI_USERNAME' => $request->UTI_USERNAME ?? $utilisateur->UTI_USERNAME,
            'UTI_PASSWORD' => $password,
            'UTI_AVATAR' => $request->UTI_AVATAR ?? $utilisateur->UTI_AVATAR,
            'UTI_MODIFIER_PAR' => auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM',
            'UTI_DATE_MODIFIER' => now(),
            'UTI_VERSION' => $nouvelleVersion,
            'GRP_CODE' => $request->GRP_CODE ?? $utilisateur->GRP_CODE,
            'REG_CODE' => $request->REG_CODE ?? $utilisateur->REG_CODE,
        ]);

        return response()->json(['message' => 'Utilisateur mis à jour avec succès']);
    }

    /**
     * @OA\Delete(
     *     path="/api/utilisateurs/{code}",
     *     tags={"Utilisateurs"},
     *     summary="Supprimer un utilisateur",
     *     description="Supprime un utilisateur du système par son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Utilisateur supprimé avec succès"),
     *     @OA\Response(response=404, description="Utilisateur non trouvé"),
     *     @OA\Response(response=403, description="Impossible de supprimer un administrateur"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function destroy($code)
    {
        $utilisateur = Utilisateur::find($code);

        if (!$utilisateur) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        if ($utilisateur->GRP_CODE == '0001' || $utilisateur->GRP_NOM == 'ADMINISTRATEUR') {
            return response()->json(['message' => 'Impossible de supprimer un administrateur.'], 403);
        }

        $utilisateur->delete();
        return response()->json(['message' => 'Utilisateur supprimé avec succès']);
    }

    /**
     * @OA\Patch(
     *     path="/api/utilisateurs/{id}/toggle-status",
     *     tags={"Utilisateurs"},
     *     summary="Changer le statut d’un utilisateur (activer/désactiver)",
     *     description="Bascule le statut d’un utilisateur : actif ↔ inactif.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Statut changé avec succès"),
     *     @OA\Response(response=404, description="Utilisateur non trouvé"),
     *     @OA\Response(response=403, description="Impossible de désactiver un administrateur")
     * )
     */
    public function toggleStatus($id)
    {
        $utilisateur = \App\Models\Utilisateur::find($id);

        if (!$utilisateur) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        if ($utilisateur->GRP_CODE == '0001' || $utilisateur->GRP_NOM == 'ADMINISTRATEUR') {
            return response()->json(['message' => 'Impossible de désactiver un administrateur.'], 403);
        }

        // Inverser le statut (1 devient 0, 0 devient 1)
        $nouveauStatut = !$utilisateur->UTI_STATUT;
        $nouvelleVersion = ($utilisateur->UTI_VERSION ?? 0) + 1;

        $utilisateur->update([
            'UTI_STATUT' => $nouveauStatut,
            'UTI_MODIFIER_PAR' => auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM  : 'SYSTEM',
            'UTI_DATE_MODIFIER' => now(),
            'UTI_VERSION' => $nouvelleVersion,
        ]);

        return response()->json([
            'message' => 'Statut modifié avec succès',
            'nouveau_statut' => $nouveauStatut ? 'Actif' : 'Inactif',
            'utilisateur' => $utilisateur
        ]);
    }

}