<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Echeance;

class EcheanceController extends Controller
{
    
    /**
     * @OA\Get(
     *     path="/api/echeances",
     *     tags={"Echeances"},
     *     summary="Lister toutes les échéances",
     *     description="Retourne la liste complète des échéances.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des échéances récupérée avec succès"
     *     )
     * )
     */
    public function index()
    {
        $echeances = Echeance::all();
        return response()->json($echeances);
    }

    /**
     * @OA\Get(
     *     path="/api/echeances/{code}",
     *     tags={"Echeances"},
     *     summary="Afficher une échéance",
     *     description="Retourne les détails d’une échéance à partir de son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Echéance trouvée"),
     *     @OA\Response(response=404, description="Echéance non trouvée")
     * )
     */
    public function show($code)
    {
        $echeance = Echeance::find($code);

        if (!$echeance) {
            return response()->json(['message' => 'Echéance non trouvée.'], 404);
        }

        return response()->json($echeance);
    }

    /**
     * @OA\Post(
     *     path="/api/echeances",
     *     tags={"Echeances"},
     *     summary="Créer une nouvelle échéance",
     *     description="Ajoute une nouvelle échéance.",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"ECH_LIBELLE"},
     *             @OA\Property(property="ECH_LIBELLE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Echéance créée avec succès"),
     *     @OA\Response(response=409, description="Une échéance avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'ECH_LIBELLE' => 'required|string|max:100',
        ]);

        $exists = Echeance::where('ECH_LIBELLE', $request->ECH_LIBELLE)->exists();

        if ($exists) {
            return response()->json(['message' => 'Une échéance avec ce nom existe déjà.'], 409);
        }

        $echeance = new Echeance();
        $echeance->ECH_LIBELLE = $request->ECH_LIBELLE;
        $echeance->ECH_DATE_CREER = now();
        $echeance->ECH_CREER_PAR = auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM';
        $echeance->save();

        return response()->json(['message' => 'Echéance créée avec succès !'], 201);
    }

    /**
     * @OA\Put(
     *     path="/api/echeances/{code}",
     *     tags={"Echeances"},
     *     summary="Mettre à jour une échéance",
     *     description="Modifie les informations d’une échéance existante.",
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
     *             @OA\Property(property="ECH_LIBELLE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Echéance mise à jour avec succès"),
     *     @OA\Response(response=404, description="Echéance non trouvée"),
     *     @OA\Response(response=409, description="Une échéance avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function update(Request $request, $code)
    {
        $echeance = Echeance::find($code);

        if (!$echeance) {
            return response()->json(['message' => 'Echéance non trouvée'], 404);
        }

        $exists = Echeance::where('ECH_LIBELLE', $request->ECH_LIBELLE)
            ->where('ECH_CODE', '!=', $code)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Une échéance avec ce nom existe déjà.'], 409);
        }

        $derniereVersion = ($echeance->ECH_VERSION ?? 0) + 1;

        $echeance->update([
            'ECH_LIBELLE' => $request->ECH_LIBELLE ?? $echeance->ECH_LIBELLE,
            'ECH_DATE_MODIFIER' => now(),
            'ECH_MODIFIER_PAR' => auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM',
            'ECH_VERSION' => $derniereVersion,
        ]);

        return response()->json(['message' => 'Echéance mise à jour avec succès !']);
    }

    /**
     * @OA\Delete(
     *     path="/api/echeances/{code}",
     *     tags={"Echeances"},
     *     summary="Supprimer une échéance",
     *     description="Supprime une échéance existante par son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Echéance supprimée avec succès"),
     *     @OA\Response(response=404, description="Echéance non trouvée"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function destroy($code)
    {
        $echeance = Echeance::find($code);

        if (!$echeance) {
            return response()->json(['message' => 'Echéance non trouvée'], 404);
        }

        $echeance->delete();

        return response()->json(['message' => 'Echéance supprimée avec succès !']);
    }
}
