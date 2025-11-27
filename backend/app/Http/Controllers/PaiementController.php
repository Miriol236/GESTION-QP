<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Paiement;
use App\Models\Beneficiaire;
use App\Models\Echeance;
use Illuminate\Support\Facades\DB;

/**
* @OA\Tag(
*     name="Paiements",
*     description="Gestion des paiements des quôtes-parts"
* )
*/
class PaiementController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/paiements",
     *     tags={"Paiements"},
     *     summary="Lister tous les paiements",
     *     description="Retourne la liste complète des paiements enregistrés.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(response=200, description="Liste des paiements récupérée avec succès")
     * )
     */
    public function index()
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Utilisateur non authentifié.'], 401);
        }

        // Sous-requête pour calculer total gain et total retenu par paiement
        $totauxSub = DB::table('T_DETAILS_PAIEMENT')
            ->join('T_ELEMENTS', 'T_ELEMENTS.ELT_CODE', '=', 'T_DETAILS_PAIEMENT.ELT_CODE')
            ->select(
                'T_DETAILS_PAIEMENT.PAI_CODE',
                DB::raw('SUM(CASE WHEN T_ELEMENTS.ELT_SENS = 1 THEN T_DETAILS_PAIEMENT.PAI_MONTANT ELSE 0 END) AS TOTAL_GAIN'),
                DB::raw('SUM(CASE WHEN T_ELEMENTS.ELT_SENS = 2 THEN T_DETAILS_PAIEMENT.PAI_MONTANT ELSE 0 END) AS TOTAL_RETENU'),
                DB::raw('(SUM(CASE WHEN T_ELEMENTS.ELT_SENS = 1 THEN T_DETAILS_PAIEMENT.PAI_MONTANT ELSE 0 END) -
                        SUM(CASE WHEN T_ELEMENTS.ELT_SENS = 2 THEN T_DETAILS_PAIEMENT.PAI_MONTANT ELSE 0 END)) AS MONTANT_NET')
            )
            ->groupBy('T_DETAILS_PAIEMENT.PAI_CODE');

        // Requête principale
        $paiements = Paiement::query()
            ->select(
                'T_PAIEMENTS.*',
                'T_BENEFICIAIRES.BEN_MATRICULE',
                DB::raw("CONCAT(T_BENEFICIAIRES.BEN_NOM, ' ', T_BENEFICIAIRES.BEN_PRENOM) as BENEFICIAIRE"),
                'T_BENEFICIAIRES.BEN_SEXE',
                'T_TYPE_BENEFICIAIRES.TYP_LIBELLE as TYPE_BENEFICIAIRE',
                'T_BANQUES.BNQ_CODE',
                'T_BANQUES.BNQ_LIBELLE',
                'T_GUICHETS.GUI_CODE',
                'T_GUICHETS.GUI_NOM',
                'T_DOMICILIERS.DOM_NUMCPT as NUMERO_DE_COMPTE',
                'T_DOMICILIERS.DOM_RIB as CLE_RIB',
                'totaux.TOTAL_GAIN',
                'totaux.TOTAL_RETENU',
                'totaux.MONTANT_NET'
            )
            ->join('T_BENEFICIAIRES', 'T_BENEFICIAIRES.BEN_CODE', '=', 'T_PAIEMENTS.BEN_CODE')
            ->leftJoin('T_DOMICILIERS', function($join){
                $join->on('T_DOMICILIERS.BEN_CODE', '=', 'T_BENEFICIAIRES.BEN_CODE')
                    ->where('T_DOMICILIERS.DOM_STATUT', true); // RIB actif
            })
            ->leftJoin('T_BANQUES', 'T_BANQUES.BNQ_CODE', '=', 'T_DOMICILIERS.BNQ_CODE')
            ->leftJoin('T_GUICHETS', 'T_GUICHETS.GUI_ID', '=', 'T_DOMICILIERS.GUI_ID')
            ->leftJoin('T_TYPE_BENEFICIAIRES', 'T_TYPE_BENEFICIAIRES.TYP_CODE', '=', 'T_BENEFICIAIRES.TYP_CODE')
            ->leftJoinSub($totauxSub, 'totaux', function($join){
                $join->on('totaux.PAI_CODE', '=', 'T_PAIEMENTS.PAI_CODE');
            })
            ->when($user->REG_CODE, fn($q) => $q->where('T_PAIEMENTS.REG_CODE', $user->REG_CODE))
            ->orderBy('T_PAIEMENTS.BEN_CODE', 'desc')
            ->get();

        return response()->json($paiements);
    }

    public function getBenStatus()
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non authentifié.'], 401);
        }

        // Récupérer les bénéficiaires avec au moins un RIB actif
        $beneficiaires = Beneficiaire::whereHas('domiciliations', function($query) {
            $query->where('DOM_STATUT', 1);
        })->get();

        return response()->json($beneficiaires);
    }

    /**
     * @OA\Get(
     *     path="/api/paiements/{id}",
     *     tags={"Paiements"},
     *     summary="Afficher les détails d’un paiement",
     *     description="Retourne les informations détaillées d’un paiement spécifique.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Paiement trouvé"),
     *     @OA\Response(response=404, description="Paiement non trouvé")
     * )
     */
    public function show($id)
    {
        $paiement = Paiement::find($id);

        if (!$paiement) {
            return response()->json(['message' => 'Paiement non trouvé'], 404);
        }

        return response()->json($paiement);
    }

    public function getAll()
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non authentifié.'], 401);
        }

        // Sous-requête pour calculer total gain et total retenu par paiement
        $totauxSub = DB::table('T_DETAILS_PAIEMENT')
            ->join('T_ELEMENTS', 'T_ELEMENTS.ELT_CODE', '=', 'T_DETAILS_PAIEMENT.ELT_CODE')
            ->select(
                'T_DETAILS_PAIEMENT.PAI_CODE',
                DB::raw('SUM(CASE WHEN T_ELEMENTS.ELT_SENS = 1 THEN T_DETAILS_PAIEMENT.PAI_MONTANT ELSE 0 END) AS TOTAL_GAIN'),
                DB::raw('SUM(CASE WHEN T_ELEMENTS.ELT_SENS = 2 THEN T_DETAILS_PAIEMENT.PAI_MONTANT ELSE 0 END) AS TOTAL_RETENU'),
                DB::raw('(SUM(CASE WHEN T_ELEMENTS.ELT_SENS = 1 THEN T_DETAILS_PAIEMENT.PAI_MONTANT ELSE 0 END) -
                        SUM(CASE WHEN T_ELEMENTS.ELT_SENS = 2 THEN T_DETAILS_PAIEMENT.PAI_MONTANT ELSE 0 END)) AS MONTANT_NET')
            )
            ->groupBy('T_DETAILS_PAIEMENT.PAI_CODE');

        $query = Beneficiaire::query()
            ->join('T_DOMICILIERS', function ($join) {
                $join->on('T_DOMICILIERS.BEN_CODE', '=', 'T_BENEFICIAIRES.BEN_CODE')
                    ->where('T_DOMICILIERS.DOM_STATUT', true); // RIB actif uniquement
            })
            ->leftJoin('T_PAIEMENTS', 'T_PAIEMENTS.BEN_CODE', '=', 'T_BENEFICIAIRES.BEN_CODE')
            ->leftJoinSub($totauxSub, 'totaux', function($join){
                $join->on('totaux.PAI_CODE', '=', 'T_PAIEMENTS.PAI_CODE');
            })
            ->leftJoin('T_BANQUES', 'T_BANQUES.BNQ_CODE', '=', 'T_DOMICILIERS.BNQ_CODE')
            ->leftJoin('T_GUICHETS', 'T_GUICHETS.GUI_ID', '=', 'T_DOMICILIERS.GUI_ID')
            ->leftJoin('T_TYPE_BENEFICIAIRES', 'T_TYPE_BENEFICIAIRES.TYP_CODE', '=', 'T_BENEFICIAIRES.TYP_CODE')
            ->leftJoin('T_FONCTIONS', 'T_FONCTIONS.FON_CODE', '=', 'T_BENEFICIAIRES.FON_CODE')
            ->leftJoin('T_GRADES', 'T_GRADES.GRD_CODE', '=', 'T_BENEFICIAIRES.GRD_CODE')
            ->leftJoin('T_REGIES', 'T_REGIES.REG_CODE', '=', 'T_PAIEMENTS.REG_CODE')
            ->select([
                'T_BENEFICIAIRES.BEN_CODE as CODE',
                'T_BENEFICIAIRES.BEN_MATRICULE as MATRICULE',
                DB::raw("CONCAT(T_BENEFICIAIRES.BEN_NOM, ' ', T_BENEFICIAIRES.BEN_PRENOM) as BENEFICIAIRE"),
                'T_BENEFICIAIRES.BEN_SEXE as SEXE',
                'T_BANQUES.BNQ_CODE',
                'T_BANQUES.BNQ_LIBELLE as BANQUE',
                'T_GUICHETS.GUI_CODE',
                'T_GUICHETS.GUI_NOM',
                'T_DOMICILIERS.DOM_NUMCPT as NUMERO_DE_COMPTE',
                'T_DOMICILIERS.DOM_RIB as CLE_RIB',
                'T_TYPE_BENEFICIAIRES.TYP_LIBELLE as TYPE_BENEFICIAIRE',
                'T_FONCTIONS.FON_LIBELLE as FONCTION',
                'T_GRADES.GRD_LIBELLE as GRADE',
                'T_REGIES.REG_LIBELLE',
                'totaux.TOTAL_GAIN',
                'totaux.TOTAL_RETENU',
                'totaux.MONTANT_NET',
                'T_PAIEMENTS.PAI_STATUT as STATUT'
            ]);

        $beneficiaires = $query->orderBy('T_BENEFICIAIRES.BEN_CODE', 'asc')->get();

        // Formater Banque
        // $beneficiaires->transform(function ($b) {
        //     $b->BANQUE = trim(($b->BNQ_CODE ? $b->BNQ_CODE . ' - ' : '') . ($b->BNQ_LIBELLE ?? '—'));
        //     unset($b->BNQ_CODE, $b->BNQ_LIBELLE);
        //     return $b;
        // });

        // Formater Guichet
        $beneficiaires->transform(function ($g) {
            $g->GUICHET = trim(($g->GUI_CODE ? $g->GUI_CODE . ' - ' : '') . ($g->GUI_NOM ?? '—'));
            unset($g->GUI_CODE, $g->GUI_NOM);
            return $g;
        });

        // Formater Régie
        $beneficiaires->transform(function ($r) {
            $r->REGIE = trim($r->REG_LIBELLE ?? '—');
            unset($r->REG_LIBELLE);
            return $r;
        });

        return response()->json($beneficiaires);
    }

    /**
     * @OA\Post(
     *     path="/api/paiements",
     *     tags={"Paiements"},
     *     summary="Créer un nouveau paiement",
     *     description="Ajoute un nouveau paiement dans le système.",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"BEN_CODE", "REG_CODE"},
     *             @OA\Property(property="BEN_CODE", type="string"),
     *             @OA\Property(property="REG_CODE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Paiement créé avec succès"),
     *     @OA\Response(response=409, description="Paiement déjà existant"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'BEN_CODE' => 'required|string',
        ]);

        // Récupérer l'échéance active
        $echeance = Echeance::where('ECH_STATUT', true)->first();

        if (!$echeance) {
            return response()->json(['message' => 'Aucune échéance active trouvée.'], 404);
        }

        $echCode = $echeance->ECH_CODE;

        // Vérifier si le bénéficiaire existe déjà pour cette échéance
        $exist = Paiement::where('BEN_CODE', $request->BEN_CODE)
            ->where('ECH_CODE', $echCode)
            ->exists();
        
        if ($exist) {
            return response()->json(['message' => 'Ce bénéficiaire est déjà créé dans le paiement pour cette échéance.'], 409);
        }

        // Génération automatique du PAI_CODE
        $dernierPaiement = Paiement::where('ECH_CODE', $echCode)
            ->orderBy('PAI_CODE', 'desc')
            ->first();

        $ordre = 1;
        if ($dernierPaiement && preg_match('/(\d{4})$/', $dernierPaiement->PAI_CODE, $matches)) {
            $ordre = intval($matches[1]) + 1;
        }

        $numeroOrdre = str_pad($ordre, 4, '0', STR_PAD_LEFT);
        $paiementCode = $echCode . $numeroOrdre;

        $paiement = new Paiement();
        $paiement->PAI_CODE = $paiementCode;

        // Récupération du bénéficiaire
        $beneficiaire = Beneficiaire::with(['domiciliations' => function ($query) {
                $query->where('DOM_STATUT', true)
                    ->with(['banque', 'guichet']);
            }, 'typeBeneficiaire'])
            ->where('BEN_CODE', $request->BEN_CODE)
            ->first();

        if ($beneficiaire) {
            $paiement->TYP_BENEFICIAIRE = $beneficiaire->typeBeneficiaire 
                ? $beneficiaire->typeBeneficiaire->TYP_LIBELLE 
                : null;

            $paiement->PAI_BENEFICIAIRE = trim($beneficiaire->BEN_NOM . ' ' . $beneficiaire->BEN_PRENOM);

            $domiciliation = $beneficiaire->domiciliations->first();
            if ($domiciliation) {
                $paiement->PAI_NUMCPT = $domiciliation->DOM_NUMCPT;
                $paiement->PAI_RIB = $domiciliation->DOM_RIB;
                $paiement->PAI_BNQ_CODE = $domiciliation->banque?->BNQ_CODE;
                $paiement->PAI_GUI_CODE = $domiciliation->guichet?->GUI_CODE;
            }
        }

        $paiement->PAI_STATUT    = false;
        $paiement->PAI_VIREMENT  = 0;
        $paiement->PAI_DATE_CREER = now();
        $paiement->PAI_CREER_PAR = auth()->check()
            ? auth()->user()->UTI_NOM . ' ' . auth()->user()->UTI_PRENOM
            : 'SYSTEM';
        $paiement->BEN_CODE = $request->BEN_CODE;
        $paiement->REG_CODE = auth()->check() ? auth()->user()->REG_CODE : 'SYSTEM';
        $paiement->ECH_CODE = $echCode;

        $paiement->save();

        return response()->json([
            'message' => 'Bénéficiaire créé dans paiement avec succès',
            'PAI_CODE' => $paiement->PAI_CODE,
        ], 201);
    }

    /**
     * @OA\Put(
     *     path="/api/paiements/{id}",
     *     tags={"Paiements"},
     *     summary="Mettre à jour un paiement",
     *     description="Modifie les informations d’un paiement existant.",
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
     *             @OA\Property(property="BEN_CODE", type="string"),
     *             @OA\Property(property="REG_CODE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Paiement mis à jour avec succès"),
     *     @OA\Response(response=404, description="Paiement non trouvé"),
     *     @OA\Response(response=409, description="Conflit : Paiement déjà existant"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function update(Request $request, $id)
    {
        $paiement = Paiement::find($id);

        if (!$paiement) {
            return response()->json(['message' => 'Information non trouvée'], 404);
        }

        // Validation minimale
        $request->validate([
            'BEN_CODE' => 'required|string',
        ]);

        // Récupération du bénéficiaire avec la domiciliation active
        $beneficiaire = Beneficiaire::with(['domiciliations' => function ($query) {
                $query->where('DOM_STATUT', true)
                    ->with(['banque', 'guichet']);
            }])
            ->where('BEN_CODE', $request->BEN_CODE)
            ->first();

        // Valeurs par défaut
        $nomComplet = null;
        $bnqNumero  = null;
        $guiCode    = null;
        $numCpt     = null;
        $rib        = null;

        if ($beneficiaire) {
            $nomComplet = trim($beneficiaire->BEN_NOM . ' ' . $beneficiaire->BEN_PRENOM);

            // Récupération de la domiciliation active
            $domiciliation = $beneficiaire->domiciliations->first();

            if ($domiciliation) {
                $numCpt = $domiciliation->DOM_NUMCPT;
                $rib    = $domiciliation->DOM_RIB;

                if ($domiciliation->banque) {
                    $bnqNumero = $domiciliation->banque->BNQ_CODE;
                }

                if ($domiciliation->guichet) {
                    $guiCode = $domiciliation->guichet->GUI_CODE;
                }
            }
        }

        // Incrémentation de la version
        $nouvelleVersion = ($paiement->PAI_VERSION ?? 0) + 1;

        // Mise à jour des données
        $paiement->update([
            'PAI_BENEFICIAIRE'  => $nomComplet,
            'PAI_BNQ_CODE'    => $bnqNumero,
            'PAI_GUI_CODE'      => $guiCode,
            'PAI_NUMCPT'        => $numCpt,
            'PAI_RIB'           => $rib,
            'PAI_DATE_MODIFIER' => now(),
            'PAI_MODIFIER_PAR'  => auth()->check()
                ? auth()->user()->UTI_NOM . " " . auth()->user()->UTI_PRENOM
                : 'SYSTEM',
            'PAI_VERSION'       => $nouvelleVersion,
            'BEN_CODE'          => $request->BEN_CODE ?? $paiement->BEN_CODE,
            'REG_CODE'          => auth()->check() ? auth()->user()->REG_CODE : $paiement->REG_CODE,
        ]);

        return response()->json([
            'message' => 'Informations du bénéficiaire pour le paiement sont mises à jour avec succès',
            'PAI_CODE' => $paiement->PAI_CODE,
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/api/paiements/{code}",
     *     tags={"Paiements"},
     *     summary="Supprimer un paiement",
     *     description="Supprime un paiement par son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Paiement supprimé avec succès"),
     *     @OA\Response(response=404, description="Paiement non trouvé"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function destroy($code)
    {
        $paiement = Paiement::find($code);

        if (!$paiement) {
            return response()->json(['message' => 'Information non trouvée'], 404);
        }

        if ($paiement->PAI_STATUT != 0) {
            return response()->json([
                'message' => 'Impossible de supprimer : paiement déjà traité.',
                'PAI_CODE' => $code
            ], 400);
        }

        $paiement->delete();
        return response()->json(['message' => 'Informations du bénéficiaire pour le paiement supprimées avec succès']);
    }

    private function traiterValidationPaiements(array $ids, callable $callback)
    {
        $results = ['success' => [], 'failed' => []];

        DB::beginTransaction();
        try {
            $paiements = Paiement::whereIn('PAI_CODE', $ids)->get()->keyBy('PAI_CODE');

            foreach ($ids as $code) {
                $paiement = $paiements->get($code);
                if (!$paiement) {
                    $results['failed'][] = ['PAI_CODE' => $code, 'reason' => 'Paiement introuvable.'];
                    continue;
                }

                $callback($paiement, $results);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return $results;
    }

    public function validerStatut(Request $request, $id = null)
    {
        if ($id) {
            // Single validation
            $paiement = Paiement::where('PAI_CODE', $id)->first();

            if (!$paiement) {
                return response()->json(['message' => 'Paiement introuvable.'], 404);
            }

            if ($paiement->PAI_STATUT == 1) {
                return response()->json(['message' => 'Le paiement est déjà marqué comme payé.'], 400);
            }

            $paiement->PAI_STATUT = 1;
            $paiement->PAI_DATE_MODIFIER = now();
            $paiement->PAI_MODIFIER_PAR = auth()->check()
                ? auth()->user()->UTI_NOM . ' ' . auth()->user()->UTI_PRENOM
                : 'SYSTEM';
            $paiement->save();

            return response()->json(['message' => "Statut mis à jour pour $id"]);
        } else {
            // Multiple validation
            $ids = $request->input('ids', []);

            if (!is_array($ids) || count($ids) === 0) {
                return response()->json(['message' => 'Aucun ID fourni.'], 400);
            }

            $results = ['success' => [], 'failed' => []];

            DB::beginTransaction();
            try {
                $paiements = Paiement::whereIn('PAI_CODE', $ids)->get()->keyBy('PAI_CODE');

                foreach ($ids as $code) {
                    $paiement = $paiements->get($code);
                    if (!$paiement) {
                        $results['failed'][] = ['PAI_CODE' => $code, 'reason' => 'Paiement introuvable.'];
                        continue;
                    }

                    if ($paiement->PAI_STATUT == 1) {
                        $results['failed'][] = ['PAI_CODE' => $code, 'reason' => 'Déjà validé.'];
                        continue;
                    }

                    $paiement->PAI_STATUT = 1;
                    $paiement->PAI_DATE_MODIFIER = now();
                    $paiement->PAI_MODIFIER_PAR = auth()->check()
                        ? auth()->user()->UTI_NOM . ' ' . auth()->user()->UTI_PRENOM
                        : 'SYSTEM';
                    $paiement->save();

                    $results['success'][] = ['PAI_CODE' => $code];
                }

                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

            return response()->json([
                'message' => 'Validation des statuts terminée.',
                'updated' => count($results['success']),
                'failed' => $results['failed'],
                'success' => $results['success']
            ]);
        }
    }

    public function validerVirement(Request $request, $id = null)
    {
        if ($id) {
            // Single validation
            $paiement = Paiement::where('PAI_CODE', $id)->first();

            if (!$paiement) {
                return response()->json(['message' => 'Paiement introuvable.'], 404);
            }

            if ($paiement->PAI_STATUT != 1) {
                return response()->json(['message' => 'Le paiement doit être marqué comme payé avant de valider le virement.'], 400);
            }

            $paiement->PAI_VIREMENT += 1;
            $paiement->save();

            return response()->json(['message' => "Virement validé pour $id"]);
        } else {
            // Multiple validation
            $ids = $request->input('ids', []);

            if (!is_array($ids) || count($ids) === 0) {
                return response()->json(['message' => 'Aucun ID fourni.'], 400);
            }

            $results = ['success' => [], 'failed' => []];

            DB::beginTransaction();
            try {
                $paiements = Paiement::whereIn('PAI_CODE', $ids)->get()->keyBy('PAI_CODE');

                foreach ($ids as $code) {
                    $paiement = $paiements->get($code);
                    if (!$paiement) {
                        $results['failed'][] = ['PAI_CODE' => $code, 'reason' => 'Paiement introuvable.'];
                        continue;
                    }

                    if ($paiement->PAI_STATUT != 1) {
                        $results['failed'][] = ['PAI_CODE' => $code, 'reason' => 'Le paiement doit être marqué comme payé avant de valider le virement.'];
                        continue;
                    }

                    $paiement->PAI_VIREMENT += 1;
                    $paiement->PAI_DATE_VIREMENT = now();
                    $paiement->save();

                    $results['success'][] = ['PAI_CODE' => $code];
                }

                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

            return response()->json([
                'message' => 'Validation des virements terminée.',
                'updated' => count($results['success']),
                'failed' => $results['failed'],
                'success' => $results['success']
            ]);
        }
    }

    public function deletePaiement(Request $request)
    {
        // Suppression multiple uniquement
        $ids = $request->input('ids', []);

        if (!is_array($ids) || count($ids) === 0) {
            return response()->json(['message' => 'Aucun ID fourni.'], 400);
        }

        $results = ['success' => [], 'failed' => []];

        DB::beginTransaction();
        try {
            $paiements = Paiement::whereIn('PAI_CODE', $ids)->get()->keyBy('PAI_CODE');

            foreach ($ids as $code) {
                $paiement = $paiements->get($code);

                if (!$paiement) {
                    $results['failed'][] = [
                        'PAI_CODE' => $code,
                        'reason' => 'Paiement introuvable.'
                    ];
                    continue;
                }

                if ($paiement->PAI_STATUT != 0) {
                    $results['failed'][] = [
                        'PAI_CODE' => $code,
                        'reason' => 'Impossible de supprimer : paiements déjà traités.'
                    ];
                    continue;
                }

                $paiement->delete();
                $results['success'][] = ['PAI_CODE' => $code];
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return response()->json([
            'message' => 'Suppression terminée.',
            'deleted' => count($results['success']),
            'failed' => $results['failed'],
            'success' => $results['success']
        ]);
    }
}