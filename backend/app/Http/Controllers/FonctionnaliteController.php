<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Fonctionnalite;

/**
 * @OA\Tag(
 *     name="Fonctionnalités",
 *     description="Gestion des fonctionnalités (CRUD)"
 * )
 */
class FonctionnaliteController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/fonctionnalites",
     *     tags={"Fonctionnalités"},
     *     summary="Lister toutes les fonctionnalités",
     *     description="Retourne la liste complète des fonctionnalités disponibles.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des fonctionnalités récupérée avec succès"
     *     )
     * )
     */
    public function index()
    {
        $fonctionnalites = Fonctionnalite::all();
        return response()->json($fonctionnalites);
    }

    /**
     * @OA\Get(
     *     path="/api/fonctionnalites/{code}",
     *     tags={"Fonctionnalités"},
     *     summary="Afficher une fonctionnalité",
     *     description="Retourne les détails d'une fonctionnalité à partir de son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Détails de la fonctionnalité récupérés avec succès"
     *     ),
     *     @OA\Response(response=404, description="Fonctionnalité non trouvée")
     * )
     */
    public function show($code)
    {
        $fonctionnalite = Fonctionnalite::find($code);

        if (!$fonctionnalite) {
            return response()->json(['message' => 'Fonctionnalité non trouvée.'], 404);
        }

        return response()->json($fonctionnalite);
    }

    /**
     * @OA\Post(
     *     path="/api/fonctionnalites",
     *     tags={"Fonctionnalités"},
     *     summary="Créer une nouvelle fonctionnalité",
     *     description="Ajoute une nouvelle fonctionnalité dans le système.",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"FON_NOM"},
     *             @OA\Property(property="FON_NOM", type="string")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Fonctionnalité créée avec succès"
     *     ),
     *     @OA\Response(response=409, description="Une fonctionnalité avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'FON_NOM' => 'required|string|max:100',
        ]);

        $exists = Fonctionnalite::where('FON_NOM', $request->FON_NOM)->exists();

        if ($exists) {
            return response()->json(['message' => 'Une fonctionnalité avec ce nom existe déjà.'], 409);
        }

        $fonctionnalite = new Fonctionnalite();
        $fonctionnalite->FON_NOM = $request->FON_NOM;
        $fonctionnalite->FON_DATE_CREER = now();
        $fonctionnalite->FON_CREER_PAR = auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM';
        $fonctionnalite->save();

        return response()->json(['message' => 'Fonctionnalité créée avec succès !'], 201);
    }

    /**
     * @OA\Put(
     *     path="/api/fonctionnalites/{code}",
     *     tags={"Fonctionnalités"},
     *     summary="Mettre à jour une fonctionnalité",
     *     description="Modifie les informations d'une fonctionnalité existante.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="FON_NOM", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Fonctionnalité mise à jour avec succès"),
     *     @OA\Response(response=404, description="Fonctionnalité non trouvée"),
     *     @OA\Response(response=409, description="Une fonctionnalité avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function update(Request $request, $code)
    {
        $fonctionnalite = Fonctionnalite::find($code);

        if (!$fonctionnalite) {
            return response()->json(['message' => 'Fonctionnalité non trouvée.'], 404);
        }

        $exists = Fonctionnalite::where('FON_NOM', $request->FON_NOM)
            ->where('FON_CODE', '!=', $code)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Une fonctionnalité avec ce nom existe déjà.'], 409);
        }

        $derniereVersion = ($fonctionnalite->FON_VERSION ?? 0) + 1;

        $fonctionnalite->update([
            'FON_NOM' => $request->FON_NOM ?? $fonctionnalite->FON_NOM,
            'FON_DATE_MODIFIER' => now(),
            'FON_MODIFIER_PAR' => auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM  : 'SYSTEM',
            'FON_VERSION' => $derniereVersion,
        ]);

        return response()->json(['message' => 'Fonctionnalité mise à jour avec succès !']);
    }

    /**
     * @OA\Delete(
     *     path="/api/fonctionnalites/{code}",
     *     tags={"Fonctionnalités"},
     *     summary="Supprimer une fonctionnalité",
     *     description="Supprime une fonctionnalité existante par son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Fonctionnalité supprimée avec succès"),
     *     @OA\Response(response=404, description="Fonctionnalité non trouvée"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function destroy($code)
    {
        $fonctionnalite = Fonctionnalite::find($code);

        if (!$fonctionnalite) {
            return response()->json(['message' => 'Fonctionnalité non trouvée'], 404);
        }

        $fonctionnalite->delete();
        return response()->json(['message' => 'Fonctionnalité supprimée avec succès !']);
    }
}