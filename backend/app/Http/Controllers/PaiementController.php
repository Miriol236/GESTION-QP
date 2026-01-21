<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Paiement;
use App\Models\Beneficiaire;
use App\Models\Mouvement;
use App\Models\HistoriquesValidation;
use App\Models\Echeance;
use App\Models\DetailsPaiement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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
     *     @OA\Response(response=200, description="Liste des paiements récupérée avec succès"),
     *     @OA\Response(response=401, description="Utilisateur non authentifié")
     * )
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Utilisateur non authentifié.'], 401);
        }

        // Filtre échéance : si non envoyé, prendre la dernière active
        $echCodeFilter = $request->input('ech_code');
        if (empty($echCodeFilter)) {
            $currentEcheance = DB::table('t_echeances')
                ->where('ECH_STATUT', true)
                ->orderBy('ECH_CODE', 'desc')
                ->first();
            $echCodeFilter = $currentEcheance?->ECH_CODE;
        }

        // Sous-requête pour calculer total gain et total retenu par paiement
        $totauxSub = DB::table('t_details_paiement')
            ->join('t_elements', 't_elements.ELT_CODE', '=', 't_details_paiement.ELT_CODE')
            ->select(
                't_details_paiement.PAI_CODE',
                DB::raw('SUM(CASE WHEN t_elements.ELT_SENS = 1 THEN t_details_paiement.PAI_MONTANT ELSE 0 END) AS TOTAL_GAIN'),
                DB::raw('SUM(CASE WHEN t_elements.ELT_SENS = 2 THEN t_details_paiement.PAI_MONTANT ELSE 0 END) AS TOTAL_RETENU'),
                DB::raw('(SUM(CASE WHEN t_elements.ELT_SENS = 1 THEN t_details_paiement.PAI_MONTANT ELSE 0 END) -
                        SUM(CASE WHEN t_elements.ELT_SENS = 2 THEN t_details_paiement.PAI_MONTANT ELSE 0 END)) AS MONTANT_NET')
            )
            ->groupBy('t_details_paiement.PAI_CODE');

        // Requête principale
        $paiements = Paiement::query()
            ->select(
                't_paiements.*',
                't_beneficiaires.BEN_MATRICULE',
                DB::raw("CONCAT(t_beneficiaires.BEN_NOM, ' ', t_beneficiaires.BEN_PRENOM) as BENEFICIAIRE"),
                't_beneficiaires.BEN_SEXE',
                't_type_beneficiaires.TYP_CODE',
                't_type_beneficiaires.TYP_LIBELLE as TYPE_BENEFICIAIRE',
                't_banques.BNQ_CODE',
                't_banques.BNQ_LIBELLE',
                't_guichets.GUI_CODE',
                't_guichets.GUI_NOM',
                't_domiciliers.DOM_NUMCPT as NUMERO_DE_COMPTE',
                't_domiciliers.DOM_RIB as CLE_RIB',
                'totaux.TOTAL_GAIN',
                'totaux.TOTAL_RETENU',
                'totaux.MONTANT_NET',
                't_virements.VIR_LIBELLE as VIREMENT'
            )            
            ->join('t_beneficiaires', 't_beneficiaires.BEN_CODE', '=', 't_paiements.BEN_CODE')
            ->join('t_virements', 't_virements.VIR_CODE', '=', 't_paiements.PAI_VIREMENT')
            ->leftJoin('t_domiciliers', function($join){
                $join->on('t_domiciliers.BEN_CODE', '=', 't_beneficiaires.BEN_CODE')
                    ->where('t_domiciliers.DOM_STATUT', 3); // RIB approuvé
            })
            ->leftJoin('t_banques', 't_banques.BNQ_CODE', '=', 't_domiciliers.BNQ_CODE')
            ->leftJoin('t_guichets', 't_guichets.GUI_ID', '=', 't_domiciliers.GUI_ID')
            ->leftJoin('t_type_beneficiaires', 't_type_beneficiaires.TYP_CODE', '=', 't_beneficiaires.TYP_CODE')
            ->leftJoinSub($totauxSub, 'totaux', function($join){
                $join->on('totaux.PAI_CODE', '=', 't_paiements.PAI_CODE');
            })
            // Filtrer par régie utilisateur
            ->when($user->REG_CODE, fn($q) => $q->where('t_paiements.REG_CODE', $user->REG_CODE))
            // Filtrer par échéance
            ->when($echCodeFilter, fn($q) => $q->where('t_paiements.ECH_CODE', $echCodeFilter))
            ->orderBy('t_paiements.PAI_CODE', 'desc')
            ->get();

        return response()->json($paiements);
    }

    /**
     * @OA\Get(
     *     path="/api/paiements/beneficiaires",
     *     tags={"Paiements"},
     *     summary="Lister les bénéficiaires avec RIB actif",
     *     description="Retourne la liste des bénéficiaires qui ont au moins un RIB actif.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(response=200, description="Liste des bénéficiaires récupérée avec succès"),
     *     @OA\Response(response=401, description="Utilisateur non authentifié")
     * )
     */
    public function getBenStatus()
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non authentifié.'], 401);
        }

        $beneficiaires = Beneficiaire::with([
            'domiciliations' => function ($query) {
                $query->where('DOM_STATUT', 3) // RIB approuvé
                    ->leftJoin('t_banques', 't_banques.BNQ_CODE', '=', 't_domiciliers.BNQ_CODE')
                    ->leftJoin('t_guichets', 't_guichets.GUI_ID', '=', 't_domiciliers.GUI_ID')
                    ->select(
                        't_domiciliers.*',
                        't_banques.BNQ_LIBELLE',
                        't_guichets.GUI_NOM',
                        't_guichets.GUI_CODE'
                    );
            }
        ])
        ->where('POS_CODE', '01') // Position spécifique
        ->orderBy('BEN_CODE', 'desc')
        ->get();

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
    
    /**
     * @OA\Get(
     *     path="/api/paiements/all",
     *     tags={"Paiements"},
     *     summary="Lister tous les bénéficiaires avec RIB actif et détails paiements",
     *     description="Retourne la liste complète des bénéficiaires avec RIB actif et informations sur leurs paiements.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(response=200, description="Liste des bénéficiaires récupérée avec succès"),
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
                    ->where('t_domiciliers.DOM_STATUT', 3); // RIB approuvé uniquement
            })
            ->leftJoin('t_paiements', 't_paiements.BEN_CODE', '=', 't_beneficiaires.BEN_CODE')
            ->leftJoin('t_banques', 't_banques.BNQ_CODE', '=', 't_domiciliers.BNQ_CODE')
            ->leftJoin('t_guichets', 't_guichets.GUI_ID', '=', 't_domiciliers.GUI_ID')
            ->leftJoin('t_type_beneficiaires', 't_type_beneficiaires.TYP_CODE', '=', 't_beneficiaires.TYP_CODE')
            ->leftJoin('t_fonctions', 't_fonctions.FON_CODE', '=', 't_beneficiaires.FON_CODE')
            ->leftJoin('t_grades', 't_grades.GRD_CODE', '=', 't_beneficiaires.GRD_CODE')
            ->leftJoin('t_regies', 't_regies.REG_CODE', '=', 't_paiements.REG_CODE')
            ->select([
                't_beneficiaires.BEN_CODE as CODE',
                't_beneficiaires.BEN_MATRICULE as MATRICULE',
                DB::raw("CONCAT(t_beneficiaires.BEN_NOM, ' ', t_beneficiaires.BEN_PRENOM) as BENEFICIAIRE"),
                't_beneficiaires.BEN_SEXE as SEXE',
                't_banques.BNQ_CODE',
                't_banques.BNQ_LIBELLE as BANQUE',
                't_guichets.GUI_CODE',
                't_guichets.GUI_NOM',
                't_domiciliers.DOM_NUMCPT as NUMERO_DE_COMPTE',
                't_domiciliers.DOM_RIB as CLE_RIB',
                't_type_beneficiaires.TYP_LIBELLE as TYPE_BENEFICIAIRE',
                't_fonctions.FON_LIBELLE as FONCTION',
                't_grades.GRD_LIBELLE as GRADE',
                't_regies.REG_LIBELLE',
                't_paiements.PAI_STATUT as STATUT'
            ]);

        $beneficiaires = $query->orderBy('t_beneficiaires.BEN_CODE', 'asc')->get();

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
        $user = auth()->user()->load('regie');

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
                $query->where('DOM_STATUT', 3)
                    ->with(['banque', 'guichet']);
            }, 'typeBeneficiaire'])
            ->where('BEN_CODE', $request->BEN_CODE)
            ->first();
        
        $user = Auth::user();
        $now = Carbon::now();

        // Niveau de validation du mouvement
        $nivValeur = DB::table('t_niveau_validations')
            ->join('t_groupes', 't_groupes.NIV_CODE', '=', 't_niveau_validations.NIV_CODE')
            ->where('t_groupes.GRP_CODE', $user->GRP_CODE)
            ->value('NIV_VALEUR');
        
        DB::transaction(function () use ($request, $user, $now, $nivValeur, $beneficiaire, $echCode, &$paiement) {

            if ($beneficiaire) {
                $paiement->TYP_BENEFICIAIRE = $beneficiaire->typeBeneficiaire 
                    ? $beneficiaire->typeBeneficiaire->TYP_LIBELLE 
                    : null;
    
                $paiement->PAI_BENEFICIAIRE = trim($beneficiaire->BEN_NOM . ' ' . $beneficiaire->BEN_PRENOM);
    
                $domiciliation = $beneficiaire->domiciliations->first();
                if ($domiciliation) {
                    $paiement->PAI_NUMCPT = $domiciliation->DOM_NUMCPT;
                    $paiement->PAI_RIB = $domiciliation->DOM_RIB;
                    $paiement->PAI_REG_LIB = $user->regie?->REG_LIBELLE;
                    $paiement->PAI_BNQ_LIB = $domiciliation->banque?->BNQ_LIBELLE;
                    $paiement->PAI_BNQ_CODE = $domiciliation->banque?->BNQ_CODE;
                    $paiement->PAI_GUI_CODE = $domiciliation->guichet?->GUI_CODE;
                }
            }
    
            $paiement->PAI_STATUT    = 1;
            $paiement->PAI_VIREMENT  = 0;
            $paiement->PAI_DATE_CREER = now();
            $paiement->PAI_CREER_PAR = auth()->check()
                ? auth()->user()->UTI_NOM . ' ' . auth()->user()->UTI_PRENOM
                : 'SYSTEM';
            $paiement->BEN_CODE = $request->BEN_CODE;
            $paiement->REG_CODE = auth()->check() ? auth()->user()->REG_CODE : 'SYSTEM';
            $paiement->ECH_CODE = $echCode;
    
            $paiement->save();

            $domiciliation = $this->getDomiciliationBeneficiaire($paiement->BEN_CODE);

            if (!$domiciliation) {
                throw new \Exception("Aucune domiciliation (RIB) trouvée pour le bénéficiaire {$paiement->PAI_BENEFICIAIRE}");
            }

            $mvtCode = $this->generateMvtCode($user->REG_CODE);

            Mouvement::create([
                'MVT_CODE'        => $mvtCode,
                'MVT_PAI_CODE'    => $paiement->PAI_CODE,
                'MVT_BEN_CODE'    => $paiement->BEN_CODE,
                'MVT_BEN_NOM_PRE' => $paiement->PAI_BENEFICIAIRE,

                'MVT_BNQ_CODE'    => $domiciliation->BNQ_CODE,
                'MVT_BNQ_LIBELLE' => $domiciliation->banque?->BNQ_LIBELLE,
                'MVT_GUI_CODE'    => $domiciliation->guichet?->GUI_CODE,
                'MVT_NUMCPT'      => $domiciliation->DOM_NUMCPT,
                'MVT_CLE_RIB'     => $domiciliation->DOM_RIB,
                'MVT_DATE'        => $now->toDateString(),
                'MVT_HEURE'       => $now->toTimeString(),
                'MVT_NIV'         => $nivValeur,
                'MVT_UTI_CODE'    => $user->UTI_CODE,
                'MVT_CREER_PAR'   => $user->UTI_NOM." ".$user->UTI_PRENOM,
                'MVT_UTI_REG'     => $user->REG_CODE,
                'TYP_CODE'        => '20250002',
            ]);
    
        });

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
        $user = auth()->user()->load('regie');

        $paiement = Paiement::find($id);

        if (!$paiement) {
            return response()->json(['message' => 'Information non trouvée'], 404);
        }

        // --- Contrôle : paiement déjà approuvé ---
        if ($paiement->PAI_STATUT == 3) {
            return response()->json(['message' => 'Impossible de modifier un paiement déjà approuvé'], 400);
        } 

        if ($paiement->PAI_STATUT == 4) {
            return response()->json(['message' => 'Impossible de modifier un paiement déjà effectué'], 400);
        } 

        // Validation minimale
        $request->validate([
            'BEN_CODE' => 'required|string',
        ]);

        // Récupération du bénéficiaire avec la domiciliation active
        $beneficiaire = Beneficiaire::with(['domiciliations' => function ($query) {
                $query->where('DOM_STATUT', 3)
                    ->with(['banque', 'guichet']);
            }])
            ->where('BEN_CODE', $request->BEN_CODE)
            ->first();

        // Valeurs par défaut
        $nomComplet = null;
        $bnqLib     = null;
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
                    $bnqLib = $domiciliation->banque->BNQ_LIBELLE;
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
            'PAI_BNQ_LIB'       => $bnqLib,
            'PAI_BNQ_CODE'      => $bnqNumero,
            'PAI_GUI_CODE'      => $guiCode,
            'PAI_NUMCPT'        => $numCpt,
            'PAI_REG_LIB'       => $user->regie?->REG_LIBELLE,
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
        $paiement = Paiement::where('PAI_CODE', $code)->first();

        if (!$paiement) {
            return response()->json([
                'message' => 'Paiement introuvable.'
            ], 404);
        }

        //  Paiement déjà approuvé
        if ($paiement->PAI_STATUT == 3) {
            return response()->json([
                'message' => 'Impossible de supprimer : paiement déjà approuvé.',
                'PAI_CODE' => $code
            ], 400);
        }

        if ($paiement->PAI_STATUT == 4) {
            return response()->json([
                'message' => 'Impossible de supprimer : paiement déjà effectué.',
                'PAI_CODE' => $code
            ], 400);
        }

        //  Vérifier s’il existe des détails de paiement
        // $detailsExist = DetailsPaiement::where('PAI_CODE', $code)->exists();

        // if ($detailsExist) {
        //     return response()->json([
        //         'message' => 'Veuillez supprimer d\'abord les éléments du paiement avant de supprimer le paiement.',
        //         'PAI_CODE' => $code
        //     ], 400);
        // }

        DB::beginTransaction();

        try {
            DB::table('t_details_paiement')
                ->where('PAI_CODE', $code)
                ->delete();

            // récupérer les mouvements de type BÉNÉFICIAIRE
            $mvtCodes = DB::table('t_mouvements')
                ->where('MVT_PAI_CODE', $code)
                ->where('TYP_CODE', '20250002') // type mouvement bénéficiaire
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

            // supprimer
            $paiement->delete();

            DB::commit();

            return response()->json([
                'message' => 'Paiement supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/paiements/delete",
     *     tags={"Paiements"},
     *     summary="Supprimer plusieurs paiements",
     *     description="Supprime plusieurs paiements en fournissant un tableau d'identifiants. Ne supprime que les paiements non traités.",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         description="Tableau d'identifiants de paiements à supprimer",
     *         @OA\JsonContent(
     *             @OA\Property(property="ids", type="array", @OA\Items(type="string"))
     *         )
     *     ),
     *     @OA\Response(response=200, description="Suppression terminée avec succès"),
     *     @OA\Response(response=400, description="Erreur de suppression"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    // public function deletePaiement(Request $request)
    // {
    //     // Suppression multiple uniquement
    //     $ids = $request->input('ids', []);

    //     if (!is_array($ids) || count($ids) === 0) {
    //         return response()->json(['message' => 'Aucun ID fourni.'], 400);
    //     }

    //     $results = ['success' => [], 'failed' => []];

    //     DB::beginTransaction();
    //     try {
    //         $paiements = Paiement::whereIn('PAI_CODE', $ids)->get()->keyBy('PAI_CODE');

    //         foreach ($ids as $code) {
    //             $paiement = $paiements->get($code);

    //             if (!$paiement) {
    //                 $results['failed'][] = [
    //                     'PAI_CODE' => $code,
    //                     'reason' => 'Paiement introuvable.'
    //                 ];
    //                 continue;
    //             }

    //             if ($paiement->PAI_STATUT != 0) {
    //                 $results['failed'][] = [
    //                     'PAI_CODE' => $code,
    //                     'reason' => 'Impossible de supprimer : paiements déjà traités.'
    //                 ];
    //                 continue;
    //             }

    //             $paiement->delete();
    //             $results['success'][] = ['PAI_CODE' => $code];
    //         }

    //         DB::commit();
    //     } catch (\Exception $e) {
    //         DB::rollBack();
    //         throw $e;
    //     }

    //     return response()->json([
    //         'message' => 'Suppression terminée.',
    //         'deleted' => count($results['success']),
    //         'failed' => $results['failed'],
    //         'success' => $results['success']
    //     ]);
    // }

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

    private function getDomiciliationBeneficiaire($benCode)
    {
        $beneficiaire = Beneficiaire::with([
            'domiciliations' => function ($query) {
                $query->with(['banque', 'guichet']);
            }
        ])
        ->where('BEN_CODE', $benCode)
        ->first();

        if (!$beneficiaire || $beneficiaire->domiciliations->isEmpty()) {
            return null;
        }

        return $beneficiaire->domiciliations->first();
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

    public function validerPaiement(Request $request, $id = null)
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
            $paiement = Paiement::where('PAI_CODE', $id)->first();

            if (!$paiement) {
                return response()->json(['message' => 'Paiement introuvable.'], 404);
            }

            if ($paiement->PAI_STATUT == 2) {
                return response()->json(['message' => 'Ce paiement est déjà en cours d\'approbation.'], 400);
            }

            if ($paiement->PAI_STATUT == 3) {
                return response()->json(['message' => 'Ce paiement a déjà été approuvé.'], 400);
            }

            if ($paiement->PAI_STATUT == 4) {
                return response()->json(['message' => 'Ce paiement a déjà été fait.'], 400);
            }

            DB::transaction(function () use ($paiement, $user, $nivValeur, $now) {

                $paiement->PAI_STATUT = 2;
                $paiement->save();

                // Mise à jour du dernier Mouvement de niveau 1 seulement
                $dernierMvt = Mouvement::where('MVT_PAI_CODE', $paiement->PAI_CODE)
                    ->where('MVT_NIV', 1)
                    ->orderByDesc('MVT_DATE')
                    ->orderByDesc('MVT_HEURE')
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
            return response()->json(['message' => "Transmission à l'approbation réussie."]);
        }

        // ===== VALIDATION MULTIPLE =====
        $ids = $request->input('ids', []);

        if (!is_array($ids) || count($ids) === 0) {
            return response()->json(['message' => 'Aucun ID fourni.'], 400);
        }

        $results = ['success' => [], 'failed' => []];

        DB::beginTransaction();
        try {
            $paiements = Paiement::whereIn('PAI_CODE', $ids)->get()->keyBy('PAI_CODE');

            foreach ($ids as $code) {

                $paiementItem = $paiements->get($code);

                if (!$paiementItem) {
                    $results['failed'][] = ['PAI_CODE' => $code, 'reason' => 'Paiement introuvable'];
                    continue;
                }

                if (in_array($paiementItem->PAI_STATUT, [2, 3, 4])) {
                    $results['failed'][] = [
                        'PAI_CODE' => $code,
                        'reason' => 'Paiement déjà traité'
                    ];
                    continue;
                }

                $domiciliation = $this->getDomiciliationBeneficiaire($paiementItem->BEN_CODE);

                if (!$domiciliation) {
                    $results['failed'][] = [
                        'PAI_CODE' => $code,
                        'reason' => 'Aucune domiciliation bancaire trouvée'
                    ];
                    continue;
                }

                $paiementItem->PAI_STATUT = 2;
                $paiementItem->save();

                // Mise à jour du dernier Mouvement de niveau 1 seulement
                $dernierMvt = Mouvement::where('MVT_PAI_CODE', $paiement->PAI_CODE)
                    ->where('MVT_NIV', 1)
                    ->orderByDesc('MVT_DATE')
                    ->orderByDesc('MVT_HEURE')
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

                $results['success'][] = ['PAI_CODE' => $code];
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur de base de données : ' . $e->getMessage()
            ], 500);
        }

        return response()->json([
            'message' => 'Transmission à l\'approbation réussie.',
            'updated' => count($results['success']),
            'failed' => $results['failed'],
            'success' => $results['success']
        ]);
    }

    public function validerPaiementTerminer(Request $request, $paiCode = null)
    {
        $user = Auth::user();
        $now = Carbon::now();

        // récupération du niveau de validation
        $nivValeur = DB::table('t_niveau_validations')
            ->join('t_groupes', 't_groupes.NIV_CODE', '=', 't_niveau_validations.NIV_CODE')
            ->where('t_groupes.GRP_CODE', $user->GRP_CODE)
            ->value('NIV_VALEUR');

        // Récupération du paiement
        $paiement = Paiement::where('PAI_CODE', $paiCode)->first();
        if (!$paiement) {
            return response()->json(['message' => 'Paiement introuvable.'], 404);
        }

        // Vérification des statuts
        $paiementNonTransmis = $paiement->PAI_STATUT != 0 && $paiement->PAI_STATUT != 2 && $paiement->PAI_STATUT != 3 && $paiement->PAI_STATUT != 4;

        $confirmed = $request->input('confirm', false);

        if (($paiementNonTransmis) && !$confirmed) {
            $message = "Voulez-vous transmettre ";
            if ($paiementNonTransmis) {
                $message .= "le paiement à l'approbation ?";
            }

            return response()->json([
                'message' => $message,
                'requiresConfirmation' => true
            ]);
        }

        // ===== Transmission en BDD =====
        DB::transaction(function () use ($paiement, $user, $nivValeur, $now) {

                $domiciliation = $this->getDomiciliationBeneficiaire($paiement->BEN_CODE);

                if (!$domiciliation) {
                    throw new \Exception("Aucune domiciliation trouvée pour le bénéficiaire {$paiement->BEN_CODE}");
                }

                if ($paiement->PAI_STATUT != 0 && $paiement->PAI_STATUT != 2 && $paiement->PAI_STATUT != 3 && $paiement->PAI_STATUT !=4){

                    $paiement->PAI_STATUT = 2;
                    $paiement->save();
    
                     // Dernier mouvement du paiement
                    $dernierMvt = Mouvement::where('MVT_PAI_CODE', $paiement->PAI_CODE)
                        ->where('MVT_NIV', 1)
                        ->first();

                    if ($dernierMvt) {
                        $dernierMvt->MVT_NIV += 1;
                        $dernierMvt->MVT_DATE = $now->toDateString();
                        $dernierMvt->MVT_HEURE = $now->toTimeString();
                        $dernierMvt->save();

                        // Historique
                        $valCode = $this->generateValCode($user->REG_CODE);
                        HistoriquesValidation::create([
                            'VAL_CODE'      => $valCode,
                            'VAL_DATE'      => $now->toDateString(),
                            'VAL_HEURE'     => $now->toTimeString(),
                            'VAL_UTI_CODE'  => $user->UTI_CODE,
                            'VAL_CREER_PAR' => $user->UTI_NOM . " " . $user->UTI_PRENOM,
                            'MVT_CODE'      => $dernierMvt->MVT_CODE,
                        ]);
                    }
                }

            });

        return response()->json(['message' => "Transmission à l'approbation réussie."]);
    }

    public function generatePaiementsFromOldEcheance(Request $request)
    {
        $request->validate([
            'ECH_CODE_OLD' => 'required|string|exists:t_echeances,ECH_CODE',
        ]);

        $user = auth()->user()->load('regie');

        if (!$user->regie) {
            return response()->json(['message' => 'L’utilisateur n’a pas de régie associée.'], 403);
        }

        $nouvelleEcheance = Echeance::where('ECH_STATUT', 1)->first();
        if (!$nouvelleEcheance) {
            return response()->json(['message' => 'Aucune nouvelle échéance active trouvée.'], 404);
        }

        $ancienneEcheance = Echeance::where('ECH_STATUT', 0)
            ->where('ECH_CODE', $request->ECH_CODE_OLD)
            ->first();
        if (!$ancienneEcheance) {
            return response()->json(['message' => 'Ancienne échéance introuvable.'], 404);
        }

        $paiementsAncienne = Paiement::with('details')
            ->where('ECH_CODE', $ancienneEcheance->ECH_CODE)
            ->where('REG_CODE', $user->regie->REG_CODE)
            ->get();

        $copieResult = ['copies' => [], 'ignores' => []];

        $totalPaiements = $paiementsAncienne->count();
        $traites = 0;

        DB::transaction(function () use ($paiementsAncienne, $nouvelleEcheance, $user, &$copieResult, &$traites) {

            foreach ($paiementsAncienne as $paiementAncien) {

                // Récupérer le bénéficiaire avec sa position
                $beneficiaire = Beneficiaire::where('BEN_CODE', $paiementAncien->BEN_CODE)->first();

                if (!$beneficiaire) {
                    $copieResult['ignores'][] = "Bénéficiaire introuvable: " . $paiementAncien->PAI_BENEFICIAIRE;
                    continue;
                }

                // Vérifier si le bénéficiaire est actif (POS_CODE = '01')
                if ($beneficiaire->POS_CODE !== '01') {
                    $copieResult['ignores'][] = $paiementAncien->PAI_BENEFICIAIRE . " (Inactif)";
                    continue; // on ignore ce bénéficiaire
                }

                // Contrôle doublon
                $exist = Paiement::where('BEN_CODE', $paiementAncien->BEN_CODE)
                    ->where('ECH_CODE', $nouvelleEcheance->ECH_CODE)
                    ->exists();

                if ($exist) {
                    $copieResult['ignores'][] = $paiementAncien->PAI_BENEFICIAIRE;
                    continue;
                }

                // Générer PAI_CODE
                $dernierPaiement = Paiement::where('ECH_CODE', $nouvelleEcheance->ECH_CODE)
                    ->orderBy('PAI_CODE', 'desc')
                    ->first();

                $ordre = 1;
                if ($dernierPaiement && preg_match('/(\d{4})$/', $dernierPaiement->PAI_CODE, $matches)) {
                    $ordre = intval($matches[1]) + 1;
                }
                $paiementCode = $nouvelleEcheance->ECH_CODE . str_pad($ordre, 4, '0', STR_PAD_LEFT);

                // Copier paiement
                // Récupérer le bénéficiaire avec sa domiciliation active
                $beneficiaire = Beneficiaire::with([
                    'domiciliations' => function ($query) {
                        $query->where('DOM_STATUT', 3)
                            ->with(['banque', 'guichet']);
                    },
                    'typeBeneficiaire'
                ])->where('BEN_CODE', $paiementAncien->BEN_CODE)->first();

                $nouveauPaiement = new Paiement();
                $nouveauPaiement->PAI_CODE = $paiementCode;
                $nouveauPaiement->ECH_CODE = $nouvelleEcheance->ECH_CODE;
                $nouveauPaiement->BEN_CODE = $paiementAncien->BEN_CODE;
                $nouveauPaiement->REG_CODE = $user->REG_CODE;

                // Infos bénéficiaire
                if ($beneficiaire) {
                    $nouveauPaiement->TYP_BENEFICIAIRE = $beneficiaire->typeBeneficiaire?->TYP_LIBELLE;
                    $nouveauPaiement->PAI_BENEFICIAIRE = trim(
                        $beneficiaire->BEN_NOM . ' ' . $beneficiaire->BEN_PRENOM
                    );

                    $domiciliation = $beneficiaire->domiciliations->first();
                    if ($domiciliation) {
                        $nouveauPaiement->PAI_NUMCPT   = $domiciliation->DOM_NUMCPT;
                        $nouveauPaiement->PAI_RIB      = $domiciliation->DOM_RIB;
                        $nouveauPaiement->PAI_REG_LIB  = $user->regie?->REG_LIBELLE;
                        $nouveauPaiement->PAI_BNQ_LIB  = $domiciliation->banque?->BNQ_LIBELLE;
                        $nouveauPaiement->PAI_BNQ_CODE = $domiciliation->banque?->BNQ_CODE;
                        $nouveauPaiement->PAI_GUI_CODE = $domiciliation->guichet?->GUI_CODE;
                    }
                }

                // Statuts et métadonnées
                $nouveauPaiement->PAI_STATUT = 2; // Copié / en attente
                $nouveauPaiement->PAI_VIREMENT = 0;
                $nouveauPaiement->PAI_DATE_CREER = now();
                $nouveauPaiement->PAI_CREER_PAR = $user->UTI_NOM . ' ' . $user->UTI_PRENOM;
                $nouveauPaiement->PAI_DATE_MODIFIER = null;
                $nouveauPaiement->PAI_MODIFIER_PAR = null;

                $nouveauPaiement->save();

                $copieResult['copies'][] = $paiementAncien->PAI_BENEFICIAIRE;

                // Copier détails
                foreach ($paiementAncien->details as $detailAncien) {
                    $lastDetail = DetailsPaiement::join('t_paiements', 't_paiements.PAI_CODE', '=', 't_details_paiement.PAI_CODE')
                        ->where('t_paiements.ECH_CODE', $nouvelleEcheance->ECH_CODE)
                        ->orderByRaw('CAST(t_details_paiement.DET_CODE AS UNSIGNED) DESC')
                        ->value('t_details_paiement.DET_CODE');

                    $numeroOrdre = $lastDetail ? str_pad(intval(substr($lastDetail, -6)) + 1, 6, '0', STR_PAD_LEFT) : '000001';
                    $detCode = $nouvelleEcheance->ECH_CODE . $numeroOrdre;

                    $nouveauDetail = $detailAncien->replicate();
                    $nouveauDetail->DET_CODE = $detCode;
                    $nouveauDetail->PAI_CODE = $paiementCode;
                    $nouveauDetail->save();
                }

                // Créer Mouvement et Historique
                $domiciliation = $this->getDomiciliationBeneficiaire($paiementAncien->BEN_CODE);
                if ($domiciliation) {
                    $nivValeur = DB::table('t_niveau_validations')
                        ->join('t_groupes', 't_groupes.NIV_CODE', '=', 't_niveau_validations.NIV_CODE')
                        ->where('t_groupes.GRP_CODE', $user->GRP_CODE)
                        ->value('NIV_VALEUR');

                    $mvtCode = $this->generateMvtCode($user->REG_CODE);

                    $valCode = $this->generateValCode($user->REG_CODE);

                    Mouvement::create([
                        'MVT_CODE' => $mvtCode,
                        'MVT_PAI_CODE' => $paiementCode,
                        'MVT_BEN_CODE' => $paiementAncien->BEN_CODE,
                        'MVT_BEN_NOM_PRE' => $paiementAncien->PAI_BENEFICIAIRE,
                        'MVT_BNQ_CODE' => $domiciliation->BNQ_CODE,
                        'MVT_BNQ_LIBELLE' => $domiciliation->banque?->BNQ_LIBELLE,
                        'MVT_GUI_CODE' => $domiciliation->guichet?->GUI_CODE,
                        'MVT_NUMCPT' => $domiciliation->DOM_NUMCPT,
                        'MVT_CLE_RIB' => $domiciliation->DOM_RIB,
                        'MVT_DATE' => now()->toDateString(),
                        'MVT_HEURE' => now()->toTimeString(),
                        'MVT_NIV' => $nivValeur +1,
                        'MVT_UTI_CODE' => $user->UTI_CODE,
                        'MVT_CREER_PAR' => $user->UTI_NOM." ".$user->UTI_PRENOM,
                        'MVT_UTI_REG'     => $user->REG_CODE,
                        'TYP_CODE' => '20250002',
                    ]);

                    HistoriquesValidation::create([
                        'VAL_CODE' => $valCode,
                        'VAL_DATE' => now()->toDateString(),
                        'VAL_HEURE' => now()->toTimeString(),
                        'VAL_UTI_CODE' => $user->UTI_CODE,
                        'VAL_CREER_PAR' => $user->UTI_NOM." ".$user->UTI_PRENOM,
                        'MVT_CODE' => $mvtCode,
                    ]);
                }

                $traites++;
            }
        });

        $progress = $totalPaiements > 0
        ? round(($traites / $totalPaiements) * 100)
        : 100;

        return response()->json([
            'message' => 'Paiements générés avec succès.',
            'paiements_copies' => $copieResult['copies'],
            'paiements_ignores' => $copieResult['ignores'],
            'progress' => $progress,
            'total' => $totalPaiements,
        ]);
    }
}