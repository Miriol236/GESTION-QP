<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Beneficiaire;
use App\Models\Mouvement;
use App\Models\HistoriquesValidation;
use App\Models\Echeance;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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
        $beneficiaire->BEN_STATUT = 0;
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

        if ($beneficiaire->BEN_STATUT == 2) {
            return response()->json([
                'message' => 'Impossible de supprimer : bénéficiaire déjà approuvé.',
                'BEN_CODE' => $code
            ], 400);
        }

        $beneficiaire->delete();
        return response()->json(['message' => 'Bénéficiaire supprimé avec succès']);
    }

    private function generateMvtCode($regCode)
    {
        $echeance = DB::table('t_echeances')
            ->where('ECH_STATUT', 1)
            ->first();

        if (!$echeance) {
            throw new \Exception('Aucune échéance active.');
        }

        $echCode = $echeance->ECH_CODE;

        $lastNumber = DB::table('t_mouvements')
            ->where('MVT_CODE', 'like', $echCode . $regCode . '%')
            ->select(DB::raw("MAX(RIGHT(MVT_CODE,5)) as max_num"))
            ->value('max_num');

        $nextNumber = str_pad(((int)$lastNumber + 1), 5, '0', STR_PAD_LEFT);

        return $echCode . $regCode . $nextNumber;
    }


    public function validerBeneficiaire(Request $request, $id = null)
    {
        $user = Auth::user();
        $now = Carbon::now();

        // récupération du niveau de validation
        $nivValeur = DB::table('t_niveau_validations')
            ->join('t_groupes', 't_groupes.NIV_CODE', '=', 't_niveau_validations.NIV_CODE')
            ->where('t_groupes.GRP_CODE', $user->GRP_CODE)
            ->value('NIV_VALEUR');

        if ($id) {
            // ===== VALIDATION UNIQUE =====
            $beneficiaire = Beneficiaire::where('BEN_CODE', $id)->first();

            if (!$beneficiaire) {
                return response()->json(['message' => 'Bénéficiaire introuvable.'], 404);
            }

            if ($beneficiaire->BEN_STATUT == 1) {
                return response()->json(['message' => 'Ce bénéficiaire est déjà en cours d\'approbation.'], 400);
            }

            if ($beneficiaire->BEN_STATUT == 2) {
                return response()->json(['message' => 'Ce bénéficiaire a déjà été approuvé.'], 400);
            }

            DB::transaction(function () use ($beneficiaire, $user, $nivValeur, $now) {

                $beneficiaire->BEN_STATUT = 1;
                $beneficiaire->save();

                $mvtCode = $this->generateMvtCode($user->REG_CODE);

                Mouvement::create([
                    'MVT_CODE'          => $mvtCode,
                    'MVT_BEN_CODE'      => $beneficiaire->BEN_CODE,
                    'MVT_BEN_NOM_PRE'   => $beneficiaire->BEN_NOM. " " .$beneficiaire->BEN_PRENOM,
                    'MVT_DATE'          => $now->toDateString(),
                    'MVT_HEURE'         => $now->toTimeString(),
                    'MVT_NIV'           => $nivValeur,
                    'TYP_CODE'          => '20250001', // en dur
                ]);

                HistoriquesValidation::create([
                    'VAL_CODE'          => $mvtCode,
                    'VAL_BEN_CODE'      => $beneficiaire->BEN_CODE,
                    'VAL_BEN_NOM_PRE'   => $beneficiaire->BEN_NOM. " " .$beneficiaire->BEN_PRENOM,
                    'VAL_UTI_CODE'      => $user->UTI_CODE,
                    'VAL_DATE'          => $now->toDateString(),
                    'VAL_HEURE'         => $now->toTimeString(),
                    'VAL_NIV'           => $nivValeur,
                    'VAL_CREER_PAR'     => $user->UTI_NOM." ".$user->UTI_PRENOM,
                    'MVT_CODE'          => $mvtCode,
                ]);
            });

            return response()->json(['message' => "Soumission à l'approbation réussie."]);
        }

        // ===== VALIDATION MULTIPLE =====
        $ids = $request->input('ids', []);

        if (!is_array($ids) || count($ids) === 0) {
            return response()->json(['message' => 'Aucun ID fourni.'], 400);
        }

        $results = ['success' => [], 'failed' => []];

        DB::beginTransaction();
        try {
            $beneficiaires = Beneficiaire::whereIn('BEN_CODE', $ids)->get()->keyBy('BEN_CODE');

            foreach ($ids as $code) {
                $beneficiaire = $beneficiaires->get($code);

                if (!$beneficiaire) {
                    $results['failed'][] = ['BEN_CODE' => $code, 'reason' => 'Bénéficiaire introuvable.'];
                    continue;
                }

                if ($beneficiaire->BEN_STATUT == 1) {
                    $results['failed'][] = ['BEN_CODE' => $code, 'reason' => 'Déjà en cours d\'approbation.'];
                    continue;
                }

                if ($beneficiaire->BEN_STATUT == 2) {
                    $results['failed'][] = ['BEN_CODE' => $code, 'reason' => 'Déjà approuvé.'];
                    continue;
                }

                $beneficiaire->BEN_STATUT = 1;
                $beneficiaire->save();

                $mvtCode = $this->generateMvtCode($user->REG_CODE);

                Mouvement::create([
                    'MVT_CODE'          => $mvtCode,
                    'MVT_BEN_CODE'      => $beneficiaire->BEN_CODE,
                    'MVT_BEN_NOM_PRE'   => $beneficiaire->BEN_NOM. " " .$beneficiaire->BEN_PRENOM,
                    'MVT_DATE'          => $now->toDateString(),
                    'MVT_HEURE'         => $now->toTimeString(),
                    'MVT_NIV'           => $nivValeur,
                    'TYP_CODE'          => '20250001', // en dur
                ]);

                HistoriquesValidation::create([
                    'VAL_CODE'          => $mvtCode,
                    'VAL_BEN_CODE'      => $beneficiaire->BEN_CODE,
                    'VAL_BEN_NOM_PRE'   => $beneficiaire->BEN_NOM. " " .$beneficiaire->BEN_PRENOM,
                    'VAL_UTI_CODE'      => $user->UTI_CODE,
                    'VAL_DATE'          => $now->toDateString(),
                    'VAL_HEURE'         => $now->toTimeString(),
                    'VAL_NIV'           => $nivValeur,
                    'VAL_CREER_PAR'     => $user->UTI_NOM." ".$user->UTI_PRENOM,
                    'MVT_CODE'          => $mvtCode,
                ]);

                $results['success'][] = ['BEN_CODE' => $code];
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur de base de données : ' . $e->getMessage()
            ], 500);
        }

        return response()->json([
            'message' => 'Soumission à l\'approbation réussie.',
            'updated' => count($results['success']),
            'failed'  => $results['failed'],
            'success' => $results['success']
        ]);
    }

}
