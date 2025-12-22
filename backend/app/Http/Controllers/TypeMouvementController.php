<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TypeMouvement;

/**
 * @OA\Tag(
 *     name="TypeMouvement",
 *     description="Gestion des types de mouvement (CRUD)"
 * )
 */
class TypeMouvementController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/typeMouvement",
     *     tags={"TypeMouvement"},
     *     summary="Lister tous les types de mouvement",
     *     description="Retourne la liste complète des types de mouvement.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des types de mouvement récupérée avec succès",
     *         @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/TypeMouvement"))
     *     ),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function index()
    {
        $types = TypeMouvement::all();
        return response()->json($types);
    }

    public function indexPublic()
    {
        return response()->json(
            \App\Models\TypeMouvement::select('TYP_CODE', 'TYP_LIBELLE')
            ->orderBy('TYP_LIBELLE')
            ->get()
        );
    }

    public function show($code)
    {
        $types = TypeMouvement::find($code);

        if (!$types) {
            return respnse()->json(['message' => 'Type mouvement non trouvé'], 404);
        }

        return response()->json($types);
    }

    public function store(Request $request)
    {
        $request->validate([
            'TYP_LIBELLE' => 'required|string|max:100',
        ]);

        $exists = TypeMouvement::where('TYP_LIBELLE', $request->TYP_LIBELLE)->exists();

        if ($exists) {
            return response()->json(['message' => 'Un type avec ce nom existe déjà.'], 409);
        }

        $type = new TypeMouvement();
        $type->TYP_LIBELLE = $request->TYP_LIBELLE;
        $type->TYP_DATE_CREER = now();
        $type->TYP_CREER_PAR = auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM';
        $type->save();

        return response()->json(['message' => 'Type créé avec succès !'], 201);
    }

    public function update(Request $request, $code)
    {
        $type = TypeMouvement::find($code);

        if (!$type) {
            return response()->json(['message' => 'Type non trouvé'], 404);
        }

        $exists = TypeMouvement::where('TYP_LIBELLE', $request->TYP_LIBELLE)
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

    public function destroy($code)
    {
        $type = TypeMouvement::find($code);

        if (!$type) {
            return response()->json(['message' => 'Type non trouvé'], 404);
        }

        $type->delete();

        return response()->json(['message' => 'Type supprimé avec succès !']);
    }
}