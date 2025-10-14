<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Grade;

class GradeController extends Controller
{
    
    /**
     * @OA\Get(
     *     path="/api/grades",
     *     tags={"Grades"},
     *     summary="Lister tous les grades",
     *     description="Retourne la liste complète des grade.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des grade récupéré avec succès"
     *     )
     * )
     */
    public function index()
    {
        $grades = Grade::all();
        return response()->json($grades);
    }

    /**
     * @OA\Get(
     *     path="/api/grades/{code}",
     *     tags={"Grades"},
     *     summary="Afficher un grade",
     *     description="Retourne les détails d’un grade à partir de son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Grade trouvé"),
     *     @OA\Response(response=404, description="Grade non trouvé")
     * )
     */
    public function show($code)
    {
        $grade = Grade::find($code);

        if (!$grade) {
            return response()->json(['message' => 'Grade non trouvé.'], 404);
        }

        return response()->json($grade);
    }

    /**
     * @OA\Post(
     *     path="/api/grades",
     *     tags={"Grades"},
     *     summary="Créer un nouvel grade",
     *     description="Ajoute un nouvel grade.",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"GRD_LIBELLE"},
     *             @OA\Property(property="GRD_LIBELLE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Grade créé avec succès"),
     *     @OA\Response(response=409, description="Un grade avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'GRD_LIBELLE' => 'required|string|max:100',
        ]);

        $exists = Grade::where('GRD_LIBELLE', $request->GRD_LIBELLE)->exists();

        if ($exists) {
            return response()->json(['message' => 'Un grade avec ce nom existe déjà.'], 409);
        }

        $grade = new Grade();
        $grade->GRD_LIBELLE = $request->GRD_LIBELLE;
        $grade->GRD_DATE_CREER = now();
        $grade->GRD_CREER_PAR = auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM';
        $grade->save();

        return response()->json(['message' => 'Grade créé avec succès !'], 201);
    }

    /**
     * @OA\Put(
     *     path="/api/grades/{code}",
     *     tags={"Grades"},
     *     summary="Mettre à jour un grade",
     *     description="Modifie les informations d’un grade existant.",
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
     *             @OA\Property(property="GRD_LIBELLE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Grade mis à jour avec succès"),
     *     @OA\Response(response=404, description="Grade non trouvé"),
     *     @OA\Response(response=409, description="Un grade avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function update(Request $request, $code)
    {
        $grade = Grade::find($code);

        if (!$grade) {
            return response()->json(['message' => 'Grade non trouvé'], 404);
        }

        $exists = Grade::where('GRD_LIBELLE', $request->GRD_LIBELLE)
            ->where('GRD_CODE', '!=', $code)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Un grade avec ce nom existe déjà.'], 409);
        }

        $derniereVersion = ($grade->GRD_VERSION ?? 0) + 1;

        $grade->update([
            'GRD_LIBELLE' => $request->GRD_LIBELLE ?? $grade->GRD_LIBELLE,
            'GRD_DATE_MODIFIER' => now(),
            'GRD_MODIFIER_PAR' => auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM',
            'GRD_VERSION' => $derniereVersion,
        ]);

        return response()->json(['message' => 'Grade mis à jour avec succès !']);
    }

    /**
     * @OA\Delete(
     *     path="/api/grades/{code}",
     *     tags={"Grades"},
     *     summary="Supprimer un grade",
     *     description="Supprime un grade existant par son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Grade supprimé avec succès"),
     *     @OA\Response(response=404, description="Grade non trouvé"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function destroy($code)
    {
        $grade = Grade::find($code);

        if (!$grade) {
            return response()->json(['message' => 'Grade non trouvé'], 404);
        }

        $grade->delete();

        return response()->json(['message' => 'Grade supprimé avec succès !']);
    }
}
