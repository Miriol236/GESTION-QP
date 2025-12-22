<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Beneficiaire;
use App\Models\Mouvement;
use App\Models\HistoriquesValidation;
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
     *     tags={"Beneficiaire"},
     *     summary="Lister tous les bénéficiaires",
     *     description="Retourne la liste complète des bénéficiaires enregistrés.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des bénéficiaires récupérée avec succès",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/Beneficiaire")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Utilisateur non authentifié")
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

        $beneficiaires = Beneficiaire::orderBy('BEN_NOM', 'asc')->get();

        return response()->json($beneficiaires);
    }

    /**
     * @OA\Get(
     *     path="/api/beneficiaires/all",
     *     tags={"Beneficiaire"},
     *     summary="Lister tous les bénéficiaires avec détails",
     *     description="Retourne la liste complète avec banques, guichets, types, fonctions et grades.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste détaillée récupérée avec succès",
     *         @OA\JsonContent(type="array", @OA\Items(type="object"))
     *     ),
     *     @OA\Response(response=401, description="Utilisateur non authentifié")
     * )
     */
    public function getAll()
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non authentifié.'], 401);
        }

        $query = Beneficiaire::query()
            ->join('t_domiciliers', function ($join) {
                $join->on('t_domiciliers.BEN_CODE', '=', 't_beneficiaires.BEN_CODE')
                    ->where('t_domiciliers.DOM_STATUT', true); // RIB actif uniquement
            })
            ->leftJoin('t_banques', 't_banques.BNQ_CODE', '=', 't_domiciliers.BNQ_CODE')
            ->leftJoin('t_guichets', 't_guichets.GUI_ID', '=', 't_domiciliers.GUI_ID')
            ->leftJoin('t_type_beneficiaires', 't_type_beneficiaires.TYP_CODE', '=', 't_beneficiaires.TYP_CODE') // Type
            ->leftJoin('t_fonctions', 't_fonctions.FON_CODE', '=', 't_beneficiaires.FON_CODE') // Fonction
            ->leftJoin('t_grades', 't_grades.GRD_CODE', '=', 't_beneficiaires.GRD_CODE') // Grade
            ->select([
                't_beneficiaires.BEN_CODE as CODE',
                't_beneficiaires.BEN_MATRICULE as MATRICULE',
                DB::raw("CONCAT(t_beneficiaires.BEN_NOM, ' ', t_beneficiaires.BEN_PRENOM) as BENEFICIAIRE"),
                't_beneficiaires.BEN_SEXE as SEXE',
                't_banques.BNQ_CODE',
                't_banques.BNQ_LIBELLE',
                't_guichets.GUI_CODE as GUICHET',
                't_domiciliers.DOM_NUMCPT as NUMERO_DE_COMPTE',
                't_domiciliers.DOM_RIB as CLE_RIB',
                't_type_beneficiaires.TYP_LIBELLE as TYPE_BENEFICIAIRE', // Type
                't_fonctions.FON_LIBELLE as FONCTION', // Fonction
                't_grades.GRD_LIBELLE as GRADE', // Grade
            ]);

        // Plus de filtrage par régie : tout le monde peut consulter
        $beneficiaires = $query->orderBy('t_beneficiaires.BEN_CODE', 'asc')->get();

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
     *     tags={"Beneficiaire"},
     *     summary="Afficher les détails d’un bénéficiaire",
     *     description="Retourne les informations détaillées d’un bénéficiaire spécifique.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Code du bénéficiaire",
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Bénéficiaire trouvé", @OA\JsonContent(ref="#/components/schemas/Beneficiaire")),
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
     *     path="/api/beneficiaires",
     *     tags={"Beneficiaire"},
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
            'POS_CODE' => 'required|string',
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
        $beneficiaire->POS_CODE = $request->POS_CODE;
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
     *         description="Code du bénéficiaire à modifier",
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
            'POS_CODE' => $request->POS_CODE ?? $beneficiaire->POS_CODE, 
        ]);

        return response()->json(['message' => 'Bénéficiaire mis à jour avec succès']);
    }

    /**
     * @OA\Delete(
     *     path="/api/beneficiaires/{code}",
     *     tags={"Beneficiaire"},
     *     summary="Supprimer un bénéficiaire",
     *     description="Supprime un bénéficiaire par son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         description="Code du bénéficiaire à supprimer",
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

    // public function validerBeneficiaire(Request $request, $id = null)
    // {
    //     $STATUT_EN_ATTENTE = 0;
    //     $STATUT_EN_APPROBATION = 1;
    //     $STATUT_APPROUVE = 2;

    //     $traiterBeneficiaire = function ($beneficiaire) use ($STATUT_EN_APPROBATION, $STATUT_APPROUVE) {
    //         if ($beneficiaire->BEN_STATUT == $STATUT_EN_APPROBATION) {
    //             return 'Déjà en cours d\'approbation.';
    //         }

    //         if ($beneficiaire->BEN_STATUT == $STATUT_APPROUVE) {
    //             return 'Déjà approuvé.';
    //         }

    //         $beneficiaire->BEN_STATUT = $STATUT_EN_APPROBATION;
    //         $beneficiaire->BEN_DATE_SOUMISSION = now();
    //         $beneficiaire->BEN_SOUMIS_PAR = auth()->user()->UTI_NOM ?? 'SYSTEM';
    //         $beneficiaire->save();

    //         return true;
    //     };

    //     // 🔹 Validation unique
    //     if ($id) {
    //         $beneficiaire = Beneficiaire::where('BEN_CODE', $id)->first();

    //         if (!$beneficiaire) {
    //             return response()->json(['message' => 'Bénéficiaire introuvable.'], 404);
    //         }

    //         $result = $traiterBeneficiaire($beneficiaire);

    //         if ($result !== true) {
    //             return response()->json(['message' => $result], 400);
    //         }

    //         return response()->json(['message' => 'Soumission à l\'approbation effectuée avec succès.']);
    //     }

    //     // 🔹 Validation multiple
    //     $ids = $request->input('ids', []);
    //     if (!is_array($ids) || empty($ids)) {
    //         return response()->json(['message' => 'Aucun bénéficiaire sélectionné.'], 400);
    //     }

    //     $results = ['success' => [], 'failed' => []];

    //     DB::transaction(function () use ($ids, &$results, $traiterBeneficiaire) {
    //         $beneficiaires = Beneficiaire::whereIn('BEN_CODE', $ids)->get()->keyBy('BEN_CODE');

    //         foreach ($ids as $code) {
    //             $beneficiaire = $beneficiaires->get($code);

    //             if (!$beneficiaire) {
    //                 $results['failed'][] = ['BEN_CODE' => $code, 'reason' => 'Introuvable'];
    //                 continue;
    //             }

    //             $result = $traiterBeneficiaire($beneficiaire);

    //             if ($result === true) {
    //                 $results['success'][] = ['BEN_CODE' => $code];
    //             } else {
    //                 $results['failed'][] = ['BEN_CODE' => $code, 'reason' => $result];
    //             }
    //         }
    //     });

    //     return response()->json([
    //         'message' => count($results['success']) > 0
    //             ? 'Soumission à l\'approbation partiellement ou totalement réussie.'
    //             : 'Aucun bénéficiaire n\'a été soumis.',
    //         'updated' => count($results['success']),
    //         'success' => $results['success'],
    //         'failed' => $results['failed'],
    //     ]);
    // }

    private function genererMvtCode(string $echCode, string $regCode): string
    {
        $prefix = $echCode . $regCode; // ex: 20250301

        $lastCode = DB::table('t_mouvements')
            ->where('MVT_CODE', 'like', $prefix . '%')
            ->orderByDesc('MVT_CODE')
            ->value('MVT_CODE');

        $ordre = 1;

        if ($lastCode) {
            $ordre = intval(substr($lastCode, -5)) + 1;
        }

        return $prefix . str_pad($ordre, 5, '0', STR_PAD_LEFT);
    }

    public function validerBeneficiaire(Request $request, $id)
    {
        $user = auth()->user();

        DB::transaction(function () use ($id, $user) {

            /* ============================
            * 1. Bénéficiaire
            * ============================ */
            $beneficiaire = Beneficiaire::where('BEN_CODE', $id)->firstOrFail();

            if (in_array($beneficiaire->BEN_STATUT, [1, 2])) {
                abort(400, 'Bénéficiaire déjà soumis ou approuvé.');
            }

            /* ============================
            * 2. Échéance active
            * ============================ */
            $echCode = DB::table('t_echeances')
                ->where('ECH_STATUT', 1)
                ->value('ECH_CODE');

            if (!$echCode) {
                abort(400, 'Aucune échéance active.');
            }

            /* ============================
            * 3. REG_CODE utilisateur
            * ============================ */
            $regCode = $user->REG_CODE;

            if (!$regCode) {
                abort(400, 'REG_CODE utilisateur introuvable.');
            }

            /* ============================
            * 4. Niveau validation
            * ============================ */
            $nivCode = DB::table('t_groupes')
                ->where('GRP_CODE', $user->GRP_CODE)
                ->value('NIV_CODE');

            $nivValeur = DB::table('t_niveau_validations')
                ->where('NIV_CODE', $nivCode)
                ->value('NIV_VALEUR');

            /* ============================
            * 5. Mise à jour bénéficiaire
            * ============================ */
            $beneficiaire->update([
                'BEN_STATUT' => 1,
            ]);

            /* ============================
            * 6. Mouvement
            * ============================ */
            $mvtCode = $this->genererMvtCode($echCode, $regCode);

            Mouvement::create([
                'MVT_CODE' => $mvtCode,
                'BEN_CODE' => $beneficiaire->BEN_CODE,
                'MVT_DATE' => now()->toDateString(),
                'MVT_HEURE'=> now()->toTimeString(),
                'MVT_NIV'  => $nivValeur,
                'TYP_CODE' => '20250001',
            ]);

            /* ============================
            * 7. Historique validation
            * ============================ */
            HistoriquesValidation::create([
                'VAL_CODE'      => $mvtCode,
                'VAL_UTI_CODE'  => $user->UTI_CODE,
                'VAL_DATE'      => now()->toDateString(),
                'VAL_HEURE'     => now()->toTimeString(),
                'VAL_CREER_PAR' => $user->UTI_NOM . ' ' . $user->UTI_PRENOM,
                'MVT_CODE'      => $mvtCode,
            ]);
        });

        return response()->json([
            'message' => "Soumission à l'approbation effectuée avec succès."
        ]);
    }
}
