<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TypeBeneficiaire;

/**
 * @OA\Tag(
 *     name="TypeBeneficiaires",
 *     description="Gestion des types bénéficiaires (CRUD)"
 * )
 */

class TypeBeneficiaireController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/typeBeneficiaires",
     *     tags={"TypeBeneficiaires"},
     *     summary="Lister tous les types bénéficiaires",
     *     description="Retourne la liste complète des types bénéficiaires.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des types bénéficiaires récupérée avec succès"
     *     )
     * )
     */
    public function index()
    {
        $types = TypeBeneficiaire::all();
        return response()->json($types);
    }

    /**
     * @OA\Get(
     *     path="/api/typeBeneficiaires/{code}",
     *     tags={"TypeBeneficiaires"},
     *     summary="Afficher un type bénéficiaire",
     *     description="Retourne les détails d’un type bénéficiaire à partir de son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Type bénéficiaire trouvé"),
     *     @OA\Response(response=404, description="Type bénéficiaires non trouvé")
     * )
     */
    public function show($code)
    {
        $types = TypeBeneficiaire::find($code);

        if (!$types) {
            return response()->json(['message' => 'Type bénéficiaire non trouvé.'], 404);
        }

        return response()->json($types);
    }

    /**
     * @OA\Post(
     *     path="/api/typeBeneficiaires",
     *     tags={"TypeBeneficiaires"},
     *     summary="Créer un nouveau type bénéficiaires",
     *     description="Ajoute un nouveau type bénéficiaires.",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"TYP_LIBELLE"},
     *             @OA\Property(property="TYP_LIBELLE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Type bénéficiaires créé avec succès"),
     *     @OA\Response(response=409, description="Un type bénéficiaires avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'TYP_LIBELLE' => 'required|string|max:100',
        ]);

        $exists = TypeBeneficiaire::where('TYP_LIBELLE', $request->TYP_LIBELLE)->exists();

        if ($exists) {
            return response()->json(['message' => 'Un type avec ce nom existe déjà.'], 409);
        }

        $type = new TypeBeneficiaire();
        $type->TYP_LIBELLE = $request->TYP_LIBELLE;
        $type->TYP_DATE_CREER = now();
        $type->TYP_CREER_PAR = auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM';
        $type->save();

        return response()->json(['message' => 'Type créé avec succès !'], 201);
    }

    /**
     * @OA\Put(
     *     path="/api/typeBeneficiaires/{code}",
     *     tags={"TypeBeneficiaires"},
     *     summary="Mettre à jour un type bénéficiaires",
     *     description="Modifie les informations d’un type bénéficiaires existant.",
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
     *             @OA\Property(property="TYP_LIBELLE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Type bénéficiaires mis à jour avec succès"),
     *     @OA\Response(response=404, description="Type bénéficiaire non trouvé"),
     *     @OA\Response(response=409, description="Un type bénéficiaires avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function update(Request $request, $code)
    {
        $type = TypeBeneficiaire::find($code);

        if (!$type) {
            return response()->json(['message' => 'Type non trouvé'], 404);
        }

        $exists = TypeBeneficiaire::where('TYP_LIBELLE', $request->TYP_LIBELLE)
            ->where('TYP_CODE', '!=', $code)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Un type avec ce nom existe déjà.'], 409);
        }

        $derniereVersion = ($type->TYP_VERSION ?? 0) + 1;

        $type->update([
            'TYP_LIBELLE' => $request->TYP_LIBELLE ?? $type->TYP_LIBELLE,
            'TYP_DATE_MODIFIER' => now(),
            'TYP_MODIFIER_PAR' => auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM',
            'TYP_VERSION' => $derniereVersion,
        ]);

        return response()->json(['message' => 'Type mis à jour avec succès !']);
    }

    /**
     * @OA\Delete(
     *     path="/api/typeBeneficiaires/{code}",
     *     tags={"TypeBeneficiaires"},
     *     summary="Supprimer un type bénéficiaires",
     *     description="Supprime un type bénéficiaires existant par son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Type bénéficiaires supprimé avec succès"),
     *     @OA\Response(response=404, description="Type bénéficiaires non trouvé"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function destroy($code)
    {
        $type = TypeBeneficiaire::find($code);

        if (!$type) {
            return response()->json(['message' => 'Type non trouvé'], 404);
        }

        $type->delete();

        return response()->json(['message' => 'Type supprimé avec succès !']);
    }
}
