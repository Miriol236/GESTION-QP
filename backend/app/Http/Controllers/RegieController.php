<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Regie;

/**
 * @OA\Tag(
 *     name="Regies",
 *     description="Gestion des régies"
 * )
 */
class RegieController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/regies",
     *     tags={"Regies"},
     *     summary="Lister toutes les régies",
     *     description="Retourne la liste complète des régies.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des régies récupérée avec succès"
     *     )
     * )
     */
    public function index()
    {
        $regies = Regie::all();
        return response()->json($regies);
    }

    /**
     * @OA\Get(
     *     path="/api/regies/{code}",
     *     tags={"Regies"},
     *     summary="Afficher une régie",
     *     description="Retourne les détails d’une régie à partir de son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Régie trouvée"),
     *     @OA\Response(response=404, description="Régie non trouvée")
     * )
     */
    public function show($code)
    {
        $regie = Regie::find($code);

        if (!$regie) {
            return response()->json(['message' => 'Régie non trouvée.'], 404);
        }

        return response()->json($regie);
    }

    /**
     * @OA\Post(
     *     path="/api/regies",
     *     tags={"Regies"},
     *     summary="Créer une nouvelle régie",
     *     description="Ajoute une nouvelle régie.",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"REG_LIBELLE"},
     *             required={"REG_SIGLE"},
     *             required={"REG_SIGLE_CODE"},
     *             @OA\Property(property="REG_LIBELLE", type="string"),
     *             @OA\Property(property="REG_SIGLE", type="string"),
     *             @OA\Property(property="REG_SIGLE_CODE", type"string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Régie créée avec succès"),
     *     @OA\Response(response=409, description="Une régie avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'REG_LIBELLE' => 'required|string|max:100',
            'REG_SIGLE' => 'required|string|max:10',
            'REG_SIGLE_CODE' => 'required|string|max:3',
        ],[
            'REG_SIGLE_CODE.max' => 'Le sigle code doit prendre maximum 3 caractères.',
        ]);

        $exists = Regie::where('REG_LIBELLE', $request->REG_LIBELLE)->exists();

        if ($exists) {
            return response()->json(['message' => 'Une régie avec ce nom existe déjà.'], 409);
        }

        $existsSigleCode = Regie::where('REG_SIGLE_CODE', $request->REG_SIGLE_CODE)->exists();

        if ($existsSigleCode) {
            return response()->json(['message' => 'Une régie avec ce sigle code existe déjà.', 409]);
        }

        $regie = new Regie();
        $regie->REG_LIBELLE = $request->REG_LIBELLE;
        $regie->REG_SIGLE = $request->REG_SIGLE;
        $regie->REG_SIGLE_CODE = $request->REG_SIGLE_CODE;
        $regie->REG_DATE_CREER = now();
        $regie->REG_CREER_PAR = auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM  : 'SYSTEM';
        $regie->save();

        return response()->json(['message' => 'Régie créée avec succès !'], 201);
    }

    /**
     * @OA\Put(
     *     path="/api/regies/{code}",
     *     tags={"Regies"},
     *     summary="Mettre à jour une régie",
     *     description="Modifie les informations d’une régie existante.",
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
     *             @OA\Property(property="REG_LIBELLE", type="string"),
     *             @OA\Property(property="REG_SIGLE", type="string"),
     *             @OA\Property(property="REG_SIGLE_CODE", type"string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Régie mise à jour avec succès"),
     *     @OA\Response(response=404, description="Régie non trouvée"),
     *     @OA\Response(response=409, description="Une régie avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function update(Request $request, $code)
    {
        $regie = Regie::find($code);

        if (!$regie) {
            return response()->json(['message' => 'Régie non trouvée'], 404);
        }

        $exists = Regie::where('REG_LIBELLE', $request->REG_LIBELLE)->exists();

        if ($exists) {
            return response()->json(['message' => 'Une régie avec ce nom existe déjà.'], 409);
        }

        $existsSigleCode = Regie::where('REG_SIGLE_CODE', $request->REG_SIGLE_CODE)->exists();

        if ($existsSigleCode) {
            return response()->json(['message' => 'Une régie avec ce sigle code existe déjà.', 409]);
        }

        $derniereVersion = ($regie->REG_VERSION ?? 0) + 1;

        $regie->update([
            'REG_LIBELLE' => $request->REG_LIBELLE ?? $regie->REG_LIBELLE,
            'REG_SIGLE' => $request->REG_SIGLE ?? $regie->REG_SIGLE,
            'REG_SIGLE_CODE' => $request->REG_SIGLE_CODE ?? $regie->REG_SIGLE_CODE,
            'REG_DATE_MODIFIER' => now(),
            'REG_MODIFIER_PAR' => auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM  : 'SYSTEM',
            'REG_VERSION' => $derniereVersion,
        ]);

        return response()->json(['message' => 'Régie mise à jour avec succès !']);
    }

    /**
     * @OA\Delete(
     *     path="/api/regies/{code}",
     *     tags={"Regies"},
     *     summary="Supprimer une régie",
     *     description="Supprime une régie existante par son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Régie supprimée avec succès"),
     *     @OA\Response(response=404, description="Régie non trouvée"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function destroy($code)
    {
        $regie = Regie::find($code);

        if (!$regie) {
            return response()->json(['message' => 'Régie non trouvée'], 404);
        }

        $regie->delete();

        return response()->json(['message' => 'Régie supprimée avec succès !']);
    }
}
