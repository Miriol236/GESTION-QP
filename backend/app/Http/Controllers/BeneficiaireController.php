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
 * @OA\Schema(
 *     schema="Beneficiaire",
 *     type="object",
 *     title="Beneficiaire",
 *     description="Représentation d’un bénéficiaire",
 *
 *     @OA\Property(property="BEN_CODE", type="string"),
 *     @OA\Property(property="BEN_NOM", type="string"),
 *     @OA\Property(property="BEN_PRENOM", type="string"),
 *     @OA\Property(property="BEN_MATRICULE", type="string"),
 *     @OA\Property(property="BEN_SEXE", type="string", nullable=true),
 *     @OA\Property(property="BEN_TELEPHONE", type="string", nullable=true),
 *     @OA\Property(property="BEN_STATUT", type="boolean")
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

        $beneficiaires = Beneficiaire::orderBy('BEN_CODE', 'desc')->get();

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
                    ->where('t_domiciliers.DOM_STATUT', 3); // RIB actif uniquement
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
                't_beneficiaires.BEN_DATE_NAISSANCE as DATE_NAISSANCE',
                't_banques.BNQ_CODE',
                't_banques.BNQ_LIBELLE',
                't_guichets.GUI_CODE as GUICHET',
                't_domiciliers.DOM_NUMCPT as NUMERO_DE_COMPTE',
                't_domiciliers.DOM_RIB as CLE_RIB',
                't_type_beneficiaires.TYP_LIBELLE as TYPE_BENEFICIAIRE', // Type
                't_fonctions.FON_LIBELLE as FONCTION', // Fonction
                't_grades.GRD_LIBELLE as GRADE', // Grade
            ]);

        //  tout le monde peut consulter
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
                function ($attribute, $value, $fail) {
                    if ($value && Beneficiaire::where('BEN_MATRICULE', $value)->exists()) {
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
            ->where('BEN_DATE_NAISSANCE', $request->BEN_DATE_NAISSANCE)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Un bénéficiaire avec ce nom, prénom et cette date de naissance existe déjà.'
            ], 409);
        }

        $user = Auth::user();
        $now = Carbon::now();

        // Niveau de validation
        $nivValeur = DB::table('t_niveau_validations')
            ->join('t_groupes', 't_groupes.NIV_CODE', '=', 't_niveau_validations.NIV_CODE')
            ->where('t_groupes.GRP_CODE', $user->GRP_CODE)
            ->value('NIV_VALEUR');

        DB::transaction(function () use ($request, $user, $now, $nivValeur, &$beneficiaire) {

            /* =======================
            Création bénéficiaire
            ======================== */
            $beneficiaire = Beneficiaire::create([
                'BEN_MATRICULE'     => $request->BEN_MATRICULE,
                'BEN_NOM'           => $request->BEN_NOM,
                'BEN_PRENOM'        => $request->BEN_PRENOM,
                'BEN_SEXE'          => $request->BEN_SEXE,
                'BEN_DATE_NAISSANCE'=> $request->BEN_DATE_NAISSANCE,
                'BEN_STATUT'        => 1,
                'BEN_DATE_CREER'    => $now,
                'BEN_CREER_PAR'     => $user->UTI_NOM." ".$user->UTI_PRENOM,
                'TYP_CODE'          => $request->TYP_CODE,
                'FON_CODE'          => $request->FON_CODE,
                'GRD_CODE'          => $request->GRD_CODE,
                'POS_CODE'          => $request->POS_CODE,
            ]);

            /* =======================
                Mouvement
            ======================== */
            $mvtCode = $this->generateMvtCode($user->REG_CODE);

            Mouvement::create([
                'MVT_CODE'        => $mvtCode,
                'MVT_BEN_CODE'    => $beneficiaire->BEN_CODE,
                'MVT_DATE'        => $now->toDateString(),
                'MVT_NIV'         => $nivValeur,
                'MVT_UTI_CODE'    => $user->UTI_CODE,
                'MVT_CREER_PAR'   => $user->UTI_NOM." ".$user->UTI_PRENOM,
                'MVT_UTI_REG'     => $user->REG_CODE,
                'TYP_CODE'        => '20250001', // Création bénéficiaire
            ]);
        });

        return response()->json([
            'message' => "Bénéficiaire créé avec succès.",
            'BEN_CODE' => $beneficiaire->BEN_CODE,
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
            'BEN_DATE_NAISSANCE' => $request->BEN_DATE_NAISSANCE ?? $beneficiaire->BEN_DATE_NAISSANCE,
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
        $beneficiaire = Beneficiaire::where('BEN_CODE', $code)->first();

        if (!$beneficiaire) {
            return response()->json(['message' => 'Bénéficiaire non trouvé'], 404);
        }

        if ($beneficiaire->BEN_STATUT == 3) {
            return response()->json([
                'message' => 'Impossible de supprimer : bénéficiaire déjà approuvé.'
            ], 400);
        }

        DB::beginTransaction();

        try {
            DB::table('t_domiciliers')
                ->where('BEN_CODE', $code)
                ->delete();

            // récupérer les mouvements de type BÉNÉFICIAIRE
            $mvtCodes = DB::table('t_mouvements')
                ->where('MVT_BEN_CODE', $code)
                ->where('TYP_CODE', '20250001') // type mouvement bénéficiaire
                ->pluck('MVT_CODE');

            // récupérer les mouvements de type Domiciliation
            $mvtDomCodes = DB::table('t_mouvements')
                ->where('MVT_BEN_CODE', $code)
                ->where('TYP_CODE', '20250003') // type mouvement domiciliation
                ->pluck('MVT_CODE');

            if ($mvtCodes->isNotEmpty()) {

                // supprimer les historiques liés aux mouvements bénéficiaire
                DB::table('t_historiques_validations')
                    ->whereIn('MVT_CODE', $mvtCodes)
                    ->delete();

                // supprimer les mouvements bénéficiaire
                DB::table('t_mouvements')
                    ->whereIn('MVT_CODE', $mvtCodes)
                    ->delete();
            }

            if ($mvtDomCodes->isNotEmpty()) {

                // supprimer les historiques liés aux mouvements domiciliations
                DB::table('t_historiques_validations')
                    ->whereIn('MVT_CODE', $mvtDomCodes)
                    ->delete();

                // supprimer les mouvements domiciliations
                DB::table('t_mouvements')
                    ->whereIn('MVT_CODE', $mvtDomCodes)
                    ->delete();
            }

            // supprimer le bénéficiaire
            $beneficiaire->delete();

            DB::commit();

            return response()->json([
                'message' => 'Bénéficiaire supprimé avec succès.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
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

    private function generateValCode($regCode)
    {
        $echeance = DB::table('t_echeances')
            ->where('ECH_STATUT', 1)
            ->first();

        if (!$echeance) {
            throw new \Exception('Aucune échéance active.');
        }

        $echCode = $echeance->ECH_CODE;

        $lastNumber = DB::table('t_historiques_validations')
            ->where('VAL_CODE', 'like', $echCode . $regCode . '%')
            ->select(DB::raw("MAX(RIGHT(VAL_CODE,5)) as max_num"))
            ->value('max_num');

        $nextNumber = str_pad(((int)$lastNumber + 1), 6, '0', STR_PAD_LEFT);

        return $echCode . $regCode . $nextNumber;
    }

    public function validerBeneficiaire(Request $request, $id = null)
    {
        $user = Auth::user();
        $now = Carbon::now();

        // Récupération du niveau de validation
        $nivValeur = DB::table('t_niveau_validations')
            ->join('t_groupes', 't_groupes.NIV_CODE', '=', 't_niveau_validations.NIV_CODE')
            ->where('t_groupes.GRP_CODE', $user->GRP_CODE)
            ->value('NIV_VALEUR');

        // ===== VALIDATION UNIQUE =====
        if ($id) {
            $beneficiaire = Beneficiaire::where('BEN_CODE', $id)->first();

            if (!$beneficiaire) {
                return response()->json(['message' => 'Bénéficiaire introuvable.'], 404);
            }

            if ($beneficiaire->BEN_STATUT == 2) {
                return response()->json(['message' => 'Ce bénéficiaire est déjà en cours d\'approbation.'], 400);
            }

            if ($beneficiaire->BEN_STATUT == 3) {
                return response()->json(['message' => 'Ce bénéficiaire a déjà été approuvé.'], 400);
            }

            DB::transaction(function () use ($beneficiaire, $user, $nivValeur, $now) {
                $beneficiaire->BEN_STATUT = 2;
                $beneficiaire->BEN_MOTIF_REJET = null;
                $beneficiaire->save();

                // Mise à jour du dernier Mouvement de niveau 1 seulement
                $dernierMvt = Mouvement::where('MVT_BEN_CODE', $beneficiaire->BEN_CODE)
                    ->where('MVT_NIV', 1)
                    ->orderByDesc('MVT_DATE')
                    ->first();

                if ($dernierMvt) {
                    $dernierMvt->MVT_NIV += 1;
                    $dernierMvt->MVT_DATE = $now->toDateString();
                    $dernierMvt->save();
                }

                $valCode = $this->generateValCode($user->REG_CODE);

                // Création historique
                HistoriquesValidation::create([
                    'VAL_CODE'      => $valCode,
                    'VAL_DATE'      => $now->toDateString(),
                    'VAL_HEURE'     => $now->toTimeString(),
                    'VAL_UTI_CODE'  => $user->UTI_CODE,
                    'VAL_CREER_PAR' => $user->UTI_NOM . " " . $user->UTI_PRENOM,
                    'MVT_CODE'      => $dernierMvt ? $dernierMvt->MVT_CODE : null,
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
           $beneficiaires = Beneficiaire::whereIn('BEN_CODE', $ids)
            ->get()
            ->keyBy(fn($item) => (string) $item->BEN_CODE);

            foreach ($ids as $code) {
                 $beneficiaire = $beneficiaires->get((string)$code);

                if (!$beneficiaire) {
                    $results['failed'][] = [
                        'BEN_CODE' => $code, // ou null si tu veux
                        'name' => 'Inconnu',
                        'reason' => 'Bénéficiaire introuvable.'
                    ];
                    continue;
                }

                $fullName = trim($beneficiaire->BEN_NOM . ' ' . $beneficiaire->BEN_PRENOM);

                if ($beneficiaire->BEN_STATUT == 2) {
                    $results['failed'][] = [
                        'BEN_CODE' => $beneficiaire->BEN_CODE,
                        'name' => $fullName,
                        'reason' => 'Déjà en cours d\'approbation.'
                    ];
                    continue;
                }

                if ($beneficiaire->BEN_STATUT == 3) {
                    $results['failed'][] = [
                        'BEN_CODE' => $beneficiaire->BEN_CODE,
                        'name' => $fullName,
                        'reason' => 'Déjà approuvé.'
                    ];
                    continue;
                }

                $beneficiaire->BEN_STATUT = 2;
                $beneficiaire->BEN_MOTIF_REJET = null;
                $beneficiaire->save();

                // Mise à jour du dernier Mouvement de niveau 1 seulement
                $dernierMvt = Mouvement::where('MVT_BEN_CODE', $beneficiaire->BEN_CODE)
                    ->where('MVT_NIV', 1)
                    ->orderByDesc('MVT_DATE')
                    ->first();

                if ($dernierMvt) {
                    $dernierMvt->MVT_NIV += 1;
                    $dernierMvt->MVT_DATE = $now->toDateString();
                    $dernierMvt->save();
                }

                $valCode = $this->generateValCode($user->REG_CODE);

                // Création historique
                HistoriquesValidation::create([
                    'VAL_CODE'      => $valCode,
                    'VAL_DATE'      => $now->toDateString(),
                    'VAL_HEURE'     => $now->toTimeString(),
                    'VAL_UTI_CODE'  => $user->UTI_CODE,
                    'VAL_CREER_PAR' => $user->UTI_NOM . " " . $user->UTI_PRENOM,
                    'MVT_CODE'      => $dernierMvt ? $dernierMvt->MVT_CODE : null,
                ]);

                $results['success'][] = [
                    'BEN_CODE' => $beneficiaire->BEN_CODE,
                    'name' => $fullName
                ];
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
