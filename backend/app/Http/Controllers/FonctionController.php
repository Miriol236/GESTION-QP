<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Fonction;

class FonctionController extends Controller
{
    
    /**
     * @OA\Get(
     *     path="/api/fonctions",
     *     tags={"Fonctions"},
     *     summary="Lister toutes les fonctions",
     *     description="Retourne la liste complète des fonctions.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des fonctions récupérée avec succès"
     *     )
     * )
     */
    public function index()
    {
        $fonctions = Fonction::all();
        return response()->json($fonctions);
    }

    /**
     * @OA\Get(
     *     path="/api/fonctions/{code}",
     *     tags={"Fonctions"},
     *     summary="Afficher une fonction",
     *     description="Retourne les détails d’une fonction à partir de son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Fonction trouvée"),
     *     @OA\Response(response=404, description="Fonction non trouvée")
     * )
     */
    public function show($code)
    {
        $fonction = Fonction::find($code);

        if (!$fonction) {
            return response()->json(['message' => 'Fonction non trouvée.'], 404);
        }

        return response()->json($fonction);
    }

    /**
     * @OA\Post(
     *     path="/api/fonctions",
     *     tags={"Fonctions"},
     *     summary="Créer une nouvelle fonction",
     *     description="Ajoute une nouvelle fonction.",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"FON_LIBELLE"},
     *             @OA\Property(property="FON_LIBELLE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Fonction créée avec succès"),
     *     @OA\Response(response=409, description="Une fonction avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'FON_LIBELLE' => 'required|string|max:100',
        ]);

        $exists = Fonction::where('FON_LIBELLE', $request->FON_LIBELLE)->exists();

        if ($exists) {
            return response()->json(['message' => 'Une fonction avec ce nom existe déjà.'], 409);
        }

        $fonction = new Fonction();
        $fonction->FON_LIBELLE = $request->FON_LIBELLE;
        $fonction->FON_DATE_CREER = now();
        $fonction->FON_CREER_PAR = auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM';
        $fonction->save();

        return response()->json(['message' => 'Fonction créée avec succès !'], 201);
    }

    /**
     * @OA\Put(
     *     path="/api/fonctions/{code}",
     *     tags={"Fonctions"},
     *     summary="Mettre à jour une fonction",
     *     description="Modifie les informations d’une fonction existante.",
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
     *             @OA\Property(property="FON_LIBELLE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Fonction mise à jour avec succès"),
     *     @OA\Response(response=404, description="Fonction non trouvée"),
     *     @OA\Response(response=409, description="Une fonction avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function update(Request $request, $code)
    {
        $fonction = Fonction::find($code);

        if (!$fonction) {
            return response()->json(['message' => 'Fonction non trouvée'], 404);
        }

        $exists = Fonction::where('FON_LIBELLE', $request->FON_LIBELLE)
            ->where('FON_CODE', '!=', $code)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Une fonction avec ce nom existe déjà.'], 409);
        }

        $derniereVersion = ($fonction->FON_VERSION ?? 0) + 1;

        $fonction->update([
            'FON_LIBELLE' => $request->FON_LIBELLE ?? $fonction->FON_LIBELLE,
            'FON_DATE_MODIFIER' => now(),
            'FON_MODIFIER_PAR' => auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM',
            'FON_VERSION' => $derniereVersion,
        ]);

        return response()->json(['message' => 'Fonction mise à jour avec succès !']);
    }

    /**
     * @OA\Delete(
     *     path="/api/fonctions/{code}",
     *     tags={"Fonctions"},
     *     summary="Supprimer une fonction",
     *     description="Supprime une fonction existante par son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Fonction supprimée avec succès"),
     *     @OA\Response(response=404, description="Fonction non trouvée"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function destroy($code)
    {
        $fonction = Fonction::find($code);

        if (!$fonction) {
            return response()->json(['message' => 'Fonction non trouvée'], 404);
        }

        $fonction->delete();

        return response()->json(['message' => 'Fonction supprimée avec succès !']);
    }
}
