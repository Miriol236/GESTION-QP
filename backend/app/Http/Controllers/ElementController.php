<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Element;

  /**
 * @OA\Tag(
 *     name="Elements",
 *     description="Gestion des éléments"
 * )
 */

class ElementController extends Controller
{
      /**
     * @OA\Get(
     *     path="/api/elements",
     *     tags={"Elements"},
     *     summary="Lister tous les éléments",
     *     description="Retourne la liste complète des éléments.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des éléments récupéré avec succès"
     *     )
     * )
     */
    public function index()
    {
        $elements = Element::all();
        return response()->json($elements);
    }

    public function indexPublic()
    {
        return response()->json(
            \App\Models\Element::select('ELT_CODE', 'ELT_LIBELLE', 'ELT_SENS')
                ->orderBy('ELT_CODE')
                ->get()
        );
    }

    /**
     * @OA\Get(
     *     path="/api/elements/{code}",
     *     tags={"Elements"},
     *     summary="Afficher un élément",
     *     description="Retourne les détails d’un élément à partir de son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Elément trouvé"),
     *     @OA\Response(response=404, description="Elément non trouvé")
     * )
     */
    public function show($code)
    {
        $elements = Element::find($code);

        if (!$elements) {
            return response()->json(['message' => 'Elément non trouvé.'], 404);
        }

        return response()->json($elements);
    }

    /**
     * @OA\Post(
     *     path="/api/elements",
     *     tags={"Elements"},
     *     summary="Créer un nouveau élément",
     *     description="Ajoute un nouveau élément.",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"ELT_LIBELLE"},
     *             required={"ELT_SENS"},
     *             @OA\Property(property="ELT_LIBELLE", type="string");
     *             @OA\Property(property="ELT_SENS", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Elément créé avec succès"),
     *     @OA\Response(response=409, description="Un élément avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'ELT_LIBELLE' => 'required|string|max:100',
            'ELT_SENS' => 'required|integer|max:2',
        ]);

        $exists = Element::where('ELT_LIBELLE', $request->ELT_LIBELLE)->exists();

        if ($exists) {
            return response()->json(['message' => 'Un élément avec ce nom existe déjà.'], 409);
        }

        $element = new Element();
        $element->ELT_LIBELLE = $request->ELT_LIBELLE;
        $element->ELT_SENS = $request->ELT_SENS;
        $element->ELT_DATE_CREER = now();
        $element->ELT_CREER_PAR = auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM';
        $element->save();

        return response()->json(['message' => 'Elément créé avec succès !'], 201);
    }

    /**
     * @OA\Put(
     *     path="/api/elements/{code}",
     *     tags={"Elements"},
     *     summary="Mettre à jour un élément",
     *     description="Modifie les informations d’un élément existant.",
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
     *             @OA\Property(property="ELT_LIBELLE", type="string"),
     *             @OA\Property(property="ELT_SENS", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Elément mis à jour avec succès"),
     *     @OA\Response(response=404, description="Elément non trouvé"),
     *     @OA\Response(response=409, description="Un élément avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function update(Request $request, $code)
    {
        $element = Element::find($code);

        if (!$element) {
            return response()->json(['message' => 'Elément non trouvé'], 404);
        }

        $derniereVersion = ($element->ELT_VERSION ?? 0) + 1;

        $element->update([
            'ELT_LIBELLE' => $request->ELT_LIBELLE ?? $guichet->ELT_LIBELLE,
            'ELT_SENS' => $request->ELT_SENS ?? $guichet->ELT_SENS,
            'ELT_DATE_MODIFIER' => now(),
            'ELT_MODIFIER_PAR' => auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM',
            'ELT_VERSION' => $derniereVersion,
        ]);

        return response()->json(['message' => 'Elément mis à jour avec succès !']);
    }

    /**
     * @OA\Delete(
     *     path="/api/elements/{code}",
     *     tags={"Elements"},
     *     summary="Supprimer un élément",
     *     description="Supprime un élément existant par son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Elément supprimé avec succès"),
     *     @OA\Response(response=404, description="Elément non trouvé"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function destroy($code)
    {
        $element = Element::find($code);

        if (!$element) {
            return response()->json(['message' => 'Elément non trouvé'], 404);
        }

        $element->delete();

        return response()->json(['message' => 'Elément supprimé avec succès !']);
    }
}
