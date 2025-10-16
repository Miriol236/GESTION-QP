<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Groupe;
use App\Models\Fonctionnalite;

/**
 * @OA\Tag(
 *     name="Groupes",
 *     description="Gestion des groupes et de leurs droits d’accès"
 * )
 */
class GroupeController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/groupes",
     *     tags={"Groupes"},
     *     summary="Lister tous les groupes",
     *     description="Retourne la liste complète des groupes d’utilisateurs.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des groupes récupérée avec succès"
     *     )
     * )
     */
    public function index()
    {
        $groupes = Groupe::all();
        return response()->json($groupes);
    }

    /**
     * @OA\Get(
     *     path="/api/groupes/{code}",
     *     tags={"Groupes"},
     *     summary="Afficher un groupe",
     *     description="Retourne les détails d’un groupe à partir de son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Groupe trouvé"),
     *     @OA\Response(response=404, description="Groupe non trouvé")
     * )
     */
    public function show($code)
    {
        $groupes = Groupe::find($code);

        if (!$groupes) {
            return response()->json(['message' => 'Groupe non trouvé.'], 404);
        }

        return response()->json($groupes);
    }

    /**
     * @OA\Post(
     *     path="/api/groupes",
     *     tags={"Groupes"},
     *     summary="Créer un nouveau groupe",
     *     description="Ajoute un nouveau groupe d’utilisateurs.",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"GRP_NOM"},
     *             @OA\Property(property="GRP_NOM", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Groupe créé avec succès"),
     *     @OA\Response(response=409, description="Un groupe avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'GRP_NOM' => 'required|string|max:100',
        ]);

        $exists = Groupe::where('GRP_NOM', $request->GRP_NOM)->exists();

        if ($exists) {
            return response()->json(['message' => 'Un groupe avec ce nom existe déjà.'], 409);
        }

        $groupe = new Groupe();
        $groupe->GRP_NOM = $request->GRP_NOM;
        $groupe->GRP_DATE_CREER = now();
        $groupe->GRP_CREER_PAR = auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM';
        $groupe->save();

        return response()->json(['message' => 'Groupe créé avec succès !'], 201);
    }

    /**
     * @OA\Put(
     *     path="/api/groupes/{code}",
     *     tags={"Groupes"},
     *     summary="Mettre à jour un groupe",
     *     description="Modifie les informations d’un groupe existant.",
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
     *             @OA\Property(property="GRP_NOM", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Groupe mis à jour avec succès"),
     *     @OA\Response(response=404, description="Groupe non trouvé"),
     *     @OA\Response(response=409, description="Un groupe avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function update(Request $request, $code)
    {
        $groupe = Groupe::find($code);

        if (!$groupe) {
            return response()->json(['message' => 'Groupe non trouvé'], 404);
        }

        $exists = Groupe::where('GRP_NOM', $request->GRP_NOM)
            ->where('GRP_CODE', '!=', $code)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Un groupe avec ce nom existe déjà.'], 409);
        }

        $derniereVersion = ($groupe->GRP_VERSION ?? 0) + 1;

        $groupe->update([
            'GRP_NOM' => $request->GRP_NOM ?? $groupe->GRP_NOM,
            'GRP_DATE_MODIFIER' => now(),
            'GRP_MODIFIER_PAR' => auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM',
            'GRP_VERSION' => $derniereVersion,
        ]);

        return response()->json(['message' => 'Groupe mis à jour avec succès !']);
    }

    /**
     * @OA\Delete(
     *     path="/api/groupes/{code}",
     *     tags={"Groupes"},
     *     summary="Supprimer un groupe",
     *     description="Supprime un groupe existant par son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Groupe supprimé avec succès"),
     *     @OA\Response(response=404, description="Groupe non trouvé"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function destroy($code)
    {
        $groupe = Groupe::find($code);

        if (!$groupe) {
            return response()->json(['message' => 'Groupe non trouvé'], 404);
        }

        $groupe->delete();

        return response()->json(['message' => 'Groupe supprimé avec succès !']);
    }

    /**
     * @OA\Get(
     *     path="/api/groupes/{code}/fonctionnalites",
     *     tags={"Groupes"},
     *     summary="Lister les fonctionnalités associées à un groupe",
     *     description="Retourne les fonctionnalités liées à un groupe.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Fonctionnalités du groupe récupérées avec succès"),
     *     @OA\Response(response=404, description="Groupe non trouvé")
     * )
     */
    public function getFonctionnalites($grpCode)
    {
        $groupe = Groupe::with('fonctionnalites')->find($grpCode);

        if (!$groupe) {
            return response()->json(['message' => 'Groupe non trouvé.'], 404);
        }

        return response()->json([
            'groupe' => $groupe,
            'fonctionnalites_associees' => $groupe->fonctionnalites->pluck('FON_CODE'),
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/groupes/{code}/fonctionnalites",
     *     tags={"Groupes"},
     *     summary="Mettre à jour les droits d’un groupe",
     *     description="Associe ou retire des fonctionnalités à un groupe via un tableau de codes.",
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
     *             @OA\Property(property="fonctionnalites", type="array", @OA\Items(type="string"))
     *         )
     *     ),
     *     @OA\Response(response=200, description="Droits du groupe mis à jour avec succès"),
     *     @OA\Response(response=404, description="Groupe non trouvé"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function updateFonctionnalites(Request $request, $grpCode)
    {
        $request->validate([
            'fonctionnalites' => 'array',
            'fonctionnalites.*' => 'string|exists:T_FONCTIONNALITES,FON_CODE',
        ]);

        $groupe = Groupe::find($grpCode);

        if (!$groupe) {
            return response()->json(['message' => 'Groupe non trouvé.'], 404);
        }

        $groupe->fonctionnalites()->sync($request->fonctionnalites ?? []);

        return response()->json(['message' => 'Droits du groupe mis à jour avec succès !']);
    }
}