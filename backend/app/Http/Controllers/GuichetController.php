<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Guichet;

/**
 * @OA\Tag(
 *     name="Guichets",
 *     description="Gestion des guichets"
 * )
 */


class GuichetController extends Controller
{ 
    /**
     * @OA\Get(
     *     path="/api/guichets",
     *     tags={"Guichets"},
     *     summary="Lister tous les guichets",
     *     description="Retourne la liste complète des guichets.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des guichets récupéré avec succès"
     *     )
     * )
     */
    public function index()
    {
        $guichets = Guichet::all();
        return response()->json($guichets);
    }

    public function indexPublic()
    {
        return response()->json(
            \App\Models\Guichet::select('GUI_ID', 'GUI_CODE', 'GUI_NOM', 'BNQ_CODE')
                ->get()
        );
    }

    /**
     * @OA\Get(
     *     path="/api/guichets/{code}",
     *     tags={"Guichets"},
     *     summary="Afficher un guichet",
     *     description="Retourne les détails d’un guichet à partir de son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Guichet trouvé"),
     *     @OA\Response(response=404, description="Guichet non trouvé")
     * )
     */
    public function show($code)
    {
        $guichet = Guichet::find($code);

        if (!$guichet) {
            return response()->json(['message' => 'Guichet non trouvé.'], 404);
        }

        return response()->json($guichet);
    }

    /**
     * @OA\Post(
     *     path="/api/guichets",
     *     tags={"Guichets"},
     *     summary="Créer un nouveau guichet",
     *     description="Ajoute un nouveau guichet.",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"GUI_NOM"},
     *             required={"GUI_CODE"},
     *             required={"BNQ_CODE"},
     *             @OA\Property(property="GUI_NOM", type="string"),
     *             @OA\Property(property="GUI_CODE", type="string")
     *             @OA\Property(property="BNQ_CODE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Guichet créé avec succès"),
     *     @OA\Response(response=409, description="Un guichet avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'GUI_CODE' => 'required|string|max:10',
            'BNQ_CODE' => 'required|string|max:10',
        ]);

        // $exists = Guichet::where('GUI_NOM', $request->GUI_NOM)->exists();

        // if ($exists) {
        //     return response()->json(['message' => 'Un guichet avec ce nom existe déjà.'], 409);
        // }

        $guichet = new Guichet();
        $guichet->GUI_NOM = $request->GUI_NOM;
        $guichet->GUI_CODE = $request->GUI_CODE;
        $guichet->GUI_DATE_CREER = now();
        $guichet->GUI_CREER_PAR = auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM';
        $guichet->BNQ_CODE = $request->BNQ_CODE;
        $guichet->save();

        return response()->json(['message' => 'Guichet créé avec succès !'], 201);
    }

    /**
     * @OA\Put(
     *     path="/api/guichets/{code}",
     *     tags={"Guichets"},
     *     summary="Mettre à jour un guichet",
     *     description="Modifie les informations d’un guichet existant.",
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
     *             @OA\Property(property="GUI_NOM", type="string"),
     *             @OA\Property(property="GUI_CODE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Guichet mis à jour avec succès"),
     *     @OA\Response(response=404, description="Guichet non trouvé"),
     *     @OA\Response(response=409, description="Un guichet avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function update(Request $request, $code)
    {
        $guichet = Guichet::find($code);

        if (!$guichet) {
            return response()->json(['message' => 'Guichet non trouvé'], 404);
        }

        $derniereVersion = ($guichet->GUI_VERSION ?? 0) + 1;

        $guichet->update([
            'GUI_NOM' => $request->GUI_NOM ?? $guichet->GUI_NOM,
            'GUI_CODE' => $request->GUI_CODE ?? $guichet->GUI_CODE,
            'GUI_DATE_MODIFIER' => now(),
            'GUI_MODIFIER_PAR' => auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM',
            'GUI_VERSION' => $derniereVersion,
            'BNQ_CODE' => $request->BNQ_CODE ?? $guichet->BNQ_CODE,
        ]);

        return response()->json(['message' => 'Guichet mis à jour avec succès !']);
    }

    /**
     * @OA\Delete(
     *     path="/api/guichets/{code}",
     *     tags={"Guichets"},
     *     summary="Supprimer un guichet",
     *     description="Supprime un guichet existant par son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Guichet supprimé avec succès"),
     *     @OA\Response(response=404, description="Guichet non trouvé"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function destroy($code)
    {
        $guichet = Guichet::find($code);

        if (!$guichet) {
            return response()->json(['message' => 'Guichet non trouvé'], 404);
        }

        $guichet->delete();

        return response()->json(['message' => 'Guichet supprimé avec succès !']);
    }
}
