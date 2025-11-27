<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Beneficiaire;
use Illuminate\Support\Facades\DB;

/**
 * @OA\Tag(
 *     name="Beneficiaire",
 *     description="Gestion des bénéficiaires et de leurs informations"
 * )
 */
class BeneficiaireController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/beneficiaires",
     *     tags={"Beneficiaires"},
     *     summary="Lister tous les beneficiaires",
     *     description="Retourne la liste complète des bénéficiaires enregistrés.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(response=200, description="Liste des bénéficiaires récupérée avec succès")
     * )
     */
    public function index()
    {
        //  Récupère l'utilisateur connecté
        $user = auth()->user();

        //  Vérifie qu'il est bien connecté
        if (!$user) {
            return response()->json(['message' => 'Utilisateur non authentifié.'], 401);
        }

        $beneficiaires = Beneficiaire::orderBy('BEN_CODE', 'desc')->get();

        return response()->json($beneficiaires);
    }

    public function getAll()
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non authentifié.'], 401);
        }

        $query = Beneficiaire::query()
            ->join('T_DOMICILIERS', function ($join) {
                $join->on('T_DOMICILIERS.BEN_CODE', '=', 'T_BENEFICIAIRES.BEN_CODE')
                    ->where('T_DOMICILIERS.DOM_STATUT', true); // RIB actif uniquement
            })
            ->leftJoin('T_BANQUES', 'T_BANQUES.BNQ_CODE', '=', 'T_DOMICILIERS.BNQ_CODE')
            ->leftJoin('T_GUICHETS', 'T_GUICHETS.GUI_ID', '=', 'T_DOMICILIERS.GUI_ID')
            ->leftJoin('T_TYPE_BENEFICIAIRES', 'T_TYPE_BENEFICIAIRES.TYP_CODE', '=', 'T_BENEFICIAIRES.TYP_CODE') // Type
            ->leftJoin('T_FONCTIONS', 'T_FONCTIONS.FON_CODE', '=', 'T_BENEFICIAIRES.FON_CODE') // Fonction
            ->leftJoin('T_GRADES', 'T_GRADES.GRD_CODE', '=', 'T_BENEFICIAIRES.GRD_CODE') // Grade
            ->select([
                'T_BENEFICIAIRES.BEN_CODE as CODE',
                'T_BENEFICIAIRES.BEN_MATRICULE as MATRICULE',
                DB::raw("CONCAT(T_BENEFICIAIRES.BEN_NOM, ' ', T_BENEFICIAIRES.BEN_PRENOM) as BENEFICIAIRE"),
                'T_BENEFICIAIRES.BEN_SEXE as SEXE',
                'T_BANQUES.BNQ_CODE',
                'T_BANQUES.BNQ_LIBELLE',
                'T_GUICHETS.GUI_CODE as GUICHET',
                'T_DOMICILIERS.DOM_NUMCPT as NUMERO_DE_COMPTE',
                'T_DOMICILIERS.DOM_RIB as CLE_RIB',
                'T_TYPE_BENEFICIAIRES.TYP_LIBELLE as TYPE_BENEFICIAIRE', // Type
                'T_FONCTIONS.FON_LIBELLE as FONCTION', // Fonction
                'T_GRADES.GRD_LIBELLE as GRADE', // Grade
            ]);

        // Plus de filtrage par régie : tout le monde peut consulter
        $beneficiaires = $query->orderBy('T_BENEFICIAIRES.BEN_CODE', 'asc')->get();

        // Formater le nom de la banque
        $beneficiaires->transform(function ($b) {
            $b->BANQUE = trim(($b->BNQ_CODE ? $b->BNQ_CODE . ' - ' : '') . ($b->BNQ_LIBELLE ?? '—'));
            unset($b->BNQ_CODE, $b->BNQ_LIBELLE);
            return $b;
        });

        return response()->json($beneficiaires);
    }

    /**
     * @OA\Get(
     *     path="/api/beneficiaires/{id}",
     *     tags={"Beneficiaires"},
     *     summary="Afficher les détails d’un bénéficiaire",
     *     description="Retourne les informations détaillées d’un bénéficiaire spécifique.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Bénéficiaire trouvé"),
     *     @OA\Response(response=404, description="Bénéficiaire non trouvé")
     * )
     */
    public function show($id)
    {
        $beneficiaire = Beneficiaire::find($id);

        if (!$beneficiaire) {
            return response()->json(['message' => 'Bénéficiaire non trouvé'], 404);
        }

        return response()->json($beneficiaire);
    }

    /**
     * @OA\Post(
     *     path="/api/beneficaire",
     *     tags={"Beneficaire"},
     *     summary="Créer un nouveau bénéficiaire",
     *     description="Ajoute un nouveau bénéficiaire dans le système.",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"BEN_NOM", "BEN_PRENOM", "TYP_CODE"},
     *             @OA\Property(property="BEN_MATRICULE", type="string"),
     *             @OA\Property(property="BEN_NOM", type="string"),
     *             @OA\Property(property="BEN_PRENOM", type="string"),
     *             @OA\Property(property="BEN_SEXE", type="string", nullable=true),
     *             @OA\Property(property="TYP_CODE", type="string"),
     *             @OA\Property(property="FON_CODE", type="string"),
     *             @OA\Property(property="GRD_CODE", type="string"),
     *             @OA\Property(property="REG_CODE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Bénéficiaire créé avec succès"),
     *     @OA\Response(response=409, description="Bénéficiaire déjà existant"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'BEN_MATRICULE' => [
                'nullable',
                'string',
                'max:10',
                // n’applique la règle unique que si une valeur est fournie
                function ($attribute, $value, $fail) {
                    if ($value && \App\Models\Beneficiaire::where('BEN_MATRICULE', $value)->exists()) {
                        $fail('Ce matricule existe déjà.');
                    }
                },
            ],
            'BEN_NOM' => 'required|string|max:100',
            'BEN_PRENOM' => 'required|string|max:100',
            'BEN_SEXE' => 'nullable|string|max:1',
            'TYP_CODE' => 'required|string',
        ]);

        $exists = Beneficiaire::where('BEN_NOM', $request->BEN_NOM)
            ->where('BEN_PRENOM', $request->BEN_PRENOM)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Un bénéficiaire avec ce nom et prénom existe déjà.'
            ], 409);
        }

        $beneficiaire = new Beneficiaire();
        $beneficiaire->BEN_MATRICULE = $request->BEN_MATRICULE ?: null;
        $beneficiaire->BEN_NOM = $request->BEN_NOM;
        $beneficiaire->BEN_PRENOM = $request->BEN_PRENOM;
        $beneficiaire->BEN_SEXE = $request->BEN_SEXE;
        $beneficiaire->BEN_DATE_CREER = now();
        $beneficiaire->BEN_CREER_PAR = auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM';
        $beneficiaire->TYP_CODE = $request->TYP_CODE;
        $beneficiaire->FON_CODE = $request->FON_CODE;
        $beneficiaire->GRD_CODE = $request->GRD_CODE;
        $beneficiaire->save();

        return response()->json([
                'message' => 'Bénéficiaire créé avec succès',
                'BEN_CODE' => $beneficiaire->BEN_CODE, //  on retourne le code créé
            ], 201);

    }

    /**
     * @OA\Put(
     *     path="/api/beneficiaires/{id}",
     *     tags={"Beneficiaire"},
     *     summary="Mettre à jour un bénéficiaire",
     *     description="Modifie les informations d’un bénéficiaire existant.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\RequestBody(
     *         required=false,
     *         @OA\JsonContent(
     *             @OA\Property(property="BEN_MATRICULE", type="string"),
     *             @OA\Property(property="BEN_NOM", type="string"),
     *             @OA\Property(property="BEN_PRENOM", type="string"),
     *             @OA\Property(property="BEN_SEXE", type="string", nullable=true),
     *             @OA\Property(property="TYP_CODE", type="string"),
     *             @OA\Property(property="FON_CODE", type="string"),
     *             @OA\Property(property="GRD_CODE", type="string"),
     *             @OA\Property(property="REG_CODE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Bénéficiaire mis à jour avec succès"),
     *     @OA\Response(response=404, description="Bénéficiaire non trouvé"),
     *     @OA\Response(response=409, description="Conflit : Bénéficiaire déjà existant"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function update(Request $request, $id)
    {
        $beneficiaire = Beneficiaire::find($id);

        if (!$beneficiaire) {
            return response()->json(['message' => 'Bénéficiaire non trouvé'], 404);
        }

        $nouvelleVersion = ($beneficiaire->BEN_VERSION ?? 0) + 1;

        $beneficiaire->update([
            'BEN_MATRICULE' => $request->BEN_MATRICULE ?? $beneficiaire->BEN_MATRICULE,
            'BEN_NOM' => $request->BEN_NOM ?? $beneficiaire->BEN_NOM,
            'BEN_PRENOM' => $request->BEN_PRENOM ?? $beneficiaire->BEN_PRENOM,
            'BEN_SEXE' => $request->BEN_SEXE ?? $beneficiaire->BEN_SEXE,
            'BEN_MODIFIER_PAR' => auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM',
            'BEN_DATE_MODIFIER' => now(),
            'BEN_VERSION' => $nouvelleVersion,
            'TYP_CODE' => $request->TYP_CODE ?? $beneficiaire->TYP_CODE,
            'FON_CODE' => $request->FON_CODE ?? $beneficiaire->FON_CODE,
            'GRD_CODE' => $request->GRD_CODE ?? $beneficiaire->GRD_CODE,
            'REG_CODE' => auth()->check() ? auth()->user()->REG_CODE : 'SYSTEM',
        ]);

        return response()->json(['message' => 'Bénéficiaire mis à jour avec succès']);
    }

    /**
     * @OA\Delete(
     *     path="/api/beneficiaires/{code}",
     *     tags={"Beneficiaires"},
     *     summary="Supprimer un bénéficiaire",
     *     description="Supprime un bénéficiaire par son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Bénéficiaire supprimé avec succès"),
     *     @OA\Response(response=404, description="Bénéficiaire non trouvé"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function destroy($code)
    {
        $beneficiaire = Beneficiaire::find($code);

        if (!$beneficiaire) {
            return response()->json(['message' => 'Bénéficiaire non trouvé'], 404);
        }

        $beneficiaire->delete();
        return response()->json(['message' => 'Bénéficiaire supprimé avec succès']);
    }
}
