<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Banque;

/**
 * @OA\Tag(
 *     name="Banques",
 *     description="Gestion des banques"
 * )
 */

class BanqueController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/banques",
     *     tags={"Banques"},
     *     summary="Lister toutes les banques",
     *     description="Retourne la liste complète des banques.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des banques récupérée avec succès"
     *     )
     * )
     */
    public function index()
    {
        $banques = Banque::all();
        return response()->json($banques);
    }

    public function indexPublic()
    {
        return response()->json(
            \App\Models\Banque::select('BNQ_CODE', 'BNQ_LIBELLE')
                ->get()
        );
    }

    /**
     * @OA\Get(
     *     path="/api/banques/{code}",
     *     tags={"Banques"},
     *     summary="Afficher une banque",
     *     description="Retourne les détails d’une banque à partir de son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="banque trouvée"),
     *     @OA\Response(response=404, description="banque non trouvée")
     * )
     */
    public function show($code)
    {
        $banque = Banque::find($code);

        if (!$banque) {
            return response()->json(['message' => 'Banque non trouvée.'], 404);
        }

        return response()->json($banque);
    }

    /**
     * @OA\Post(
     *     path="/api/banques",
     *     tags={"Banques"},
     *     summary="Créer une nouvelle banque",
     *     description="Ajoute une nouvelle banque.",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"BNQ_CODE"},
     *             required={"BNQ_LIBELLE"},
     *             @OA\Property(property="BNQ_CODE", type"string"),
     *             @OA\Property(property="BNQ_LIBELLE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Banque créée avec succès"),
     *     @OA\Response(response=409, description="Une banque avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'BNQ_CODE' => 'required|string|max:10|unique:t_banques,BNQ_CODE',
            'BNQ_LIBELLE' => 'required|string|max:100',
        ],[
            'BNQ_CODE.unique' => 'Une banque avec ce code existe déjà.'
        ]);

        $exists = Banque::where('BNQ_LIBELLE', $request->BNQ_LIBELLE)->exists();

        if ($exists) {
            return response()->json(['message' => 'Une banque avec ce nom existe déjà.'], 409);
        }


        $banque = new Banque();
        $banque->BNQ_CODE = $request->BNQ_CODE;
        $banque->BNQ_LIBELLE = $request->BNQ_LIBELLE;
        $banque->BNQ_DATE_CREER = now();
        $banque->BNQ_CREER_PAR = auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM  : 'SYSTEM';
        $banque->save();

        return response()->json(['message' => 'Banque créée avec succès !'], 201);
    }

    /**
     * @OA\Put(
     *     path="/api/banques/{code}",
     *     tags={"Banques"},
     *     summary="Mettre à jour une banque",
     *     description="Modifie les informations d’une banque existante.",
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
     *             @OA\Property(property="BNQ_CODE", type="string"),
     *             @OA\Property(property="BNQ_LIBELLE", type="string"),
     *         )
     *     ),
     *     @OA\Response(response=200, description="Banque mise à jour avec succès"),
     *     @OA\Response(response=404, description="Banque non trouvée"),
     *     @OA\Response(response=409, description="Une banque avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function update(Request $request, $code)
    {
        $banque = Banque::find($code);

        if (!$banque) {
            return response()->json(['message' => 'Banque non trouvée'], 404);
        }

        $derniereVersion = ($banque->BNQ_VERSION ?? 0) + 1;

        $banque->update([
            'BNQ_CODE' => $request->BNQ_CODE ?? $banque->BNQ_CODE,
            'BNQ_LIBELLE' => $request->BNQ_LIBELLE ?? $banque->BNQ_LIBELLE,
            'BNQ_DATE_MODIFIER' => now(),
            'BNQ_MODIFIER_PAR' => auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM  : 'SYSTEM',
            'BNQ_VERSION' => $derniereVersion,
        ]);

        return response()->json(['message' => 'Banque mise à jour avec succès !']);
    }

    /**
     * @OA\Delete(
     *     path="/api/banques/{code}",
     *     tags={"Banques"},
     *     summary="Supprimer une banque",
     *     description="Supprime une banque existante par son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Banque supprimée avec succès"),
     *     @OA\Response(response=404, description="Banque non trouvée"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function destroy($code)
    {
        $banque = Banque::find($code);

        if (!$banque) {
            return response()->json(['message' => 'Banque non trouvée'], 404);
        }

        $banque->delete();

        return response()->json(['message' => 'Banque supprimée avec succès !']);
    }
}
