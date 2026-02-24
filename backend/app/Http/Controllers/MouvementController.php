<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Mouvement;
use App\Models\Beneficiaire;
use App\Models\Domicilier;
use App\Models\Paiement;
use App\Models\HistoriquesValidation;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MouvementController extends Controller
{
    public function getMouvementsBeneficiairesEnCours()
    {
        //  AJOUT 1 : utilisateur connecté
        $user = Auth::user();

        //  AJOUT 2 : niveau de validation
        $nivValeur = DB::table('t_niveau_validations')
            ->join('t_groupes', 't_groupes.NIV_CODE', '=', 't_niveau_validations.NIV_CODE')
            ->where('t_groupes.GRP_CODE', $user->GRP_CODE)
            ->value('NIV_VALEUR');

        $mouvements = Mouvement::query()

            ->join(
                't_beneficiaires',
                't_beneficiaires.BEN_CODE',
                '=',
                't_mouvements.MVT_BEN_CODE'
            )
            ->leftJoin(
                't_type_beneficiaires',
                't_type_beneficiaires.TYP_CODE',
                '=',
                't_beneficiaires.TYP_CODE'
            )
            ->leftJoin(
                't_fonctions',
                't_fonctions.FON_CODE',
                '=',
                't_beneficiaires.FON_CODE'
            )
            ->leftJoin(
                't_grades',
                't_grades.GRD_CODE',
                '=',
                't_beneficiaires.GRD_CODE'
            )
            ->leftJoin(
                't_positions',
                't_positions.POS_CODE',
                '=',
                't_beneficiaires.POS_CODE'
            )
            ->where('t_beneficiaires.BEN_STATUT', 2)
            ->where('t_mouvements.TYP_CODE', '20250001')
            ->where('t_mouvements.MVT_NIV', $nivValeur)
            ->where('t_mouvements.MVT_UTI_REG', $user->REG_CODE) // même régie

            ->orderBy('t_mouvements.MVT_DATE', 'desc')
            ->select([
                // ===== Mouvement =====
                't_mouvements.MVT_CODE',
                't_mouvements.MVT_BEN_CODE as BEN_CODE',
                't_mouvements.MVT_DATE',
                't_mouvements.MVT_NIV',
                't_mouvements.MVT_UTI_CODE',
                't_mouvements.MVT_CREER_PAR',
                't_mouvements.TYP_CODE',

                // ===== Bénéficiaire =====
                't_beneficiaires.BEN_MATRICULE',
                DB::raw("CONCAT(t_beneficiaires.BEN_NOM, ' ', t_beneficiaires.BEN_PRENOM) as BENEFICIAIRE"),
                't_beneficiaires.BEN_SEXE',
                't_beneficiaires.BEN_STATUT',

                // ===== Infos complémentaires =====
                't_type_beneficiaires.TYP_LIBELLE as TYPE_BENEFICIAIRE',
                't_fonctions.FON_LIBELLE as FONCTION',
                't_grades.GRD_LIBELLE as GRADE',
                't_positions.POS_LIBELLE as POSITION',
            ])
            ->get();

        return response()->json([
            'count' => $mouvements->count(),
            'data'  => $mouvements
        ]);
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

    public function approuverBeneficiaire(Request $request, $id = null)
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

            if ($beneficiaire->BEN_STATUT == 3) {
                return response()->json(['message' => 'Ce bénéficiaire a déjà été approuvé.'], 400);
            }

            DB::transaction(function () use ($beneficiaire, $user, $nivValeur, $now) {
                $beneficiaire->BEN_STATUT = 3;
                $beneficiaire->save();

                // Mise à jour du dernier Mouvement de niveau 1 seulement
                $dernierMvt = Mouvement::where('MVT_BEN_CODE', $beneficiaire->BEN_CODE)
                    ->where('MVT_NIV', 2)
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

            return response()->json(['message' => "Approbation réussie."]);
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
                DB::transaction(function () use ($code, $beneficiaires, $user, $nivValeur, $now, &$results) {

                    $beneficiaire = $beneficiaires->get($code);

                    if (!$beneficiaire) {
                        $results['failed'][] = ['BEN_CODE' => $code, 'reason' => 'Bénéficiaire introuvable.'];
                        return;
                    }

                    if ($beneficiaire->BEN_STATUT == 3) {
                        $results['failed'][] = ['BEN_CODE' => $code, 'reason' => 'Déjà approuvé.'];
                        return;
                    }

                    $beneficiaire->BEN_STATUT = 3;
                    $beneficiaire->save();

                    // Mise à jour du dernier Mouvement de niveau 1 seulement
                    $dernierMvt = Mouvement::where('MVT_BEN_CODE', $beneficiaire->BEN_CODE)
                        ->where('MVT_NIV', 2)
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

                    $results['success'][] = ['BEN_CODE' => $code];
                });
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur de base de données : ' . $e->getMessage()
            ], 500);
        }

        return response()->json([
            'message' => 'Approbation réussie.',
            'updated' => count($results['success']),
            'failed'  => $results['failed'],
            'success' => $results['success']
        ]);
    }

    public function rejeterBeneficiaire(Request $request, $id = null)
    {
        $user = Auth::user();
        $now = Carbon::now();

        $request->validate([
            'BEN_MOTIF_REJET' => 'required|string|max:1000',
        ]);

        DB::beginTransaction();

        try {

            /*
            |--------------------------------------------------------------------------
            | REJET UNIQUE
            |--------------------------------------------------------------------------
            */
            if ($id) {

                $beneficiaire = Beneficiaire::where('BEN_CODE', $id)->first();

                if (!$beneficiaire) {
                    DB::rollBack();
                    return response()->json(['message' => 'Bénéficiaire introuvable.'], 404);
                }

                // récupérer les mouvements liés au bénéficiaire
                $mvtCodes = DB::table('t_mouvements')
                    ->where('MVT_BEN_CODE', $id)
                    ->where('TYP_CODE', '20250001') // type mouvement bénéficiaire
                    ->pluck('MVT_CODE');

                if ($mvtCodes->isNotEmpty()) {

                    // supprimer historiques
                    DB::table('t_historiques_validations')
                        ->whereIn('MVT_CODE', $mvtCodes)
                        ->delete();

                    DB::table('t_mouvements')
                        ->whereIn('MVT_CODE', $mvtCodes)
                        ->update(['MVT_NIV' => 1]);
                }

                // mise à jour bénéficiaire
                $beneficiaire->BEN_STATUT = 0; // rejeté
                $beneficiaire->BEN_MOTIF_REJET = $request->BEN_MOTIF_REJET;
                $beneficiaire->save();

                DB::commit();

                return response()->json([
                    'message' => 'Rejet effectué avec succès.'
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | REJET MULTIPLE
            |--------------------------------------------------------------------------
            */
            $ids = $request->input('ids', []);

            if (!is_array($ids) || count($ids) === 0) {
                DB::rollBack();
                return response()->json(['message' => 'Aucun ID fourni.'], 400);
            }

            $results = ['success' => [], 'failed' => []];

            $beneficiaires = Beneficiaire::whereIn('BEN_CODE', $ids)
                ->get()
                ->keyBy('BEN_CODE');

            foreach ($ids as $code) {

                $beneficiaire = $beneficiaires->get($code);

                if (!$beneficiaire) {
                    $results['failed'][] = [
                        'BEN_CODE' => $code,
                        'reason' => 'Bénéficiaire introuvable.'
                    ];
                    continue;
                }

                $mvtCodes = DB::table('t_mouvements')
                    ->where('MVT_BEN_CODE', $code)
                    ->where('TYP_CODE', '20250001')
                    ->pluck('MVT_CODE');

                if ($mvtCodes->isNotEmpty()) {

                    DB::table('t_historiques_validations')
                        ->whereIn('MVT_CODE', $mvtCodes)
                        ->delete();

                    DB::table('t_mouvements')
                        ->whereIn('MVT_CODE', $mvtCodes)
                        ->update(['MVT_NIV' => 1]);
                }

                $beneficiaire->BEN_STATUT = 0;
                $beneficiaire->BEN_MOTIF_REJET = $request->BEN_MOTIF_REJET;
                $beneficiaire->save();

                $results['success'][] = ['BEN_CODE' => $code];
            }

            DB::commit();

            return response()->json([
                'message' => 'Rejet effectué avec succès.',
                'updated' => count($results['success']),
                'failed'  => $results['failed'],
                'success' => $results['success']
            ]);

        } catch (\Throwable $e) {

            DB::rollBack();

            return response()->json([
                'message' => 'Erreur lors du rejet',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getMouvementsDomiciliersEnCours()
    {
        //  AJOUT 1 : utilisateur connecté
        $user = Auth::user();

        //  AJOUT 2 : récupération du niveau
        $nivValeur = DB::table('t_niveau_validations')
            ->join('t_groupes', 't_groupes.NIV_CODE', '=', 't_niveau_validations.NIV_CODE')
            ->where('t_groupes.GRP_CODE', $user->GRP_CODE)
            ->value('NIV_VALEUR');

        $mouvements = Mouvement::query()

            ->join(
                't_beneficiaires',
                't_beneficiaires.BEN_CODE',
                '=',
                't_mouvements.MVT_BEN_CODE'
            )
            ->leftJoin('t_domiciliers', function($join){
                $join->on('t_domiciliers.DOM_CODE', '=', 't_mouvements.MVT_DOM_CODE')
                    ->whereIn('t_domiciliers.DOM_STATUT', [2, 3])
                    ->orderByDesc('t_domiciliers.DOM_STATUT'); // 3 avant 2
            })
            ->leftJoin('t_banques', 't_banques.BNQ_CODE', '=', 't_domiciliers.BNQ_CODE')
            ->leftJoin('t_guichets', 't_guichets.GUI_ID', '=', 't_domiciliers.GUI_ID')
            ->leftJoin(
                't_type_beneficiaires',
                't_type_beneficiaires.TYP_CODE',
                '=',
                't_beneficiaires.TYP_CODE'
            )
            ->leftJoin(
                't_fonctions',
                't_fonctions.FON_CODE',
                '=',
                't_beneficiaires.FON_CODE'
            )
            ->leftJoin(
                't_grades',
                't_grades.GRD_CODE',
                '=',
                't_beneficiaires.GRD_CODE'
            )
            ->leftJoin(
                't_positions',
                't_positions.POS_CODE',
                '=',
                't_beneficiaires.POS_CODE'
            )
            ->where('t_domiciliers.DOM_STATUT', 2)
            ->where('t_mouvements.TYP_CODE', '20250003')
            ->where('t_mouvements.MVT_NIV', $nivValeur)
            ->where('t_mouvements.MVT_UTI_REG', $user->REG_CODE) // même régie

            ->orderBy('t_mouvements.MVT_DATE', 'desc')
            ->select([
                // ===== Mouvement =====
                't_mouvements.MVT_CODE',
                't_mouvements.MVT_DOM_CODE as DOM_CODE',
                't_mouvements.MVT_DATE',
                't_mouvements.MVT_NIV',
                't_mouvements.MVT_UTI_CODE',
                't_mouvements.MVT_CREER_PAR',
                't_mouvements.TYP_CODE',

                't_banques.BNQ_LIBELLE as BANQUE',
                't_guichets.GUI_CODE as GUICHET',
                't_domiciliers.DOM_NUMCPT as NUMCPT',
                't_domiciliers.DOM_RIB as RIB',
                't_domiciliers.DOM_STATUT',
                't_domiciliers.DOM_FICHIER',

                // ===== Bénéficiaire =====
                't_beneficiaires.BEN_MATRICULE',
                DB::raw("CONCAT(t_beneficiaires.BEN_NOM, ' ', t_beneficiaires.BEN_PRENOM) as BENEFICIAIRE"),
                't_beneficiaires.BEN_SEXE',
                't_beneficiaires.BEN_STATUT',

                // ===== Infos complémentaires =====
                't_type_beneficiaires.TYP_LIBELLE as TYPE_BENEFICIAIRE',
                't_fonctions.FON_LIBELLE as FONCTION',
                't_grades.GRD_LIBELLE as GRADE',
                't_positions.POS_LIBELLE as POSITION',
            ])
            ->get();

        return response()->json([
            'count' => $mouvements->count(),
            'data'  => $mouvements
        ]);
    }

    public function approuverDomicilier(Request $request, $id = null)
    {
        $user = Auth::user();
        $now = Carbon::now();

        // Récupération du niveau de validation
        $nivValeur = DB::table('t_niveau_validations')
            ->join('t_groupes', 't_groupes.NIV_CODE', '=', 't_niveau_validations.NIV_CODE')
            ->where('t_groupes.GRP_CODE', $user->GRP_CODE)
            ->value('NIV_VALEUR');

        /* =========================================================
        * VALIDATION UNIQUE
        * ========================================================= */
        if ($id) {

            $domiciliation = Domicilier::with(['banque', 'guichet'])
                ->where('DOM_CODE', $id)
                ->first();

            if (!$domiciliation) {
                return response()->json(['message' => 'RIB introuvable.'], 404);
            }

            if ($domiciliation->DOM_STATUT == 3) {
                return response()->json(['message' => 'Ce RIB a déjà été approuvé.'], 400);
            }

            $beneficiaire = Beneficiaire::where('BEN_CODE', $domiciliation->BEN_CODE)->first();

            DB::transaction(function () use ($domiciliation, $beneficiaire, $user, $nivValeur, $now) {

                // Désactiver les anciens RIB approuvés
                Domicilier::where('BEN_CODE', $beneficiaire->BEN_CODE)
                    ->where('DOM_STATUT', 3)
                    ->update(['DOM_STATUT' => 1]);

                $domiciliation->DOM_STATUT = 3;
                $domiciliation->save();

                 // Mise à jour du dernier Mouvement de niveau 1 seulement
                $dernierMvt = Mouvement::where('MVT_DOM_CODE', $domiciliation->DOM_CODE)
                    ->where('MVT_NIV', 2)
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

            return response()->json(['message' => 'Approbation réussie.']);
        }

        /* =========================================================
        * VALIDATION MULTIPLE
        * ========================================================= */

        $ids = $request->input('ids', []);

        if (!is_array($ids) || count($ids) === 0) {
            return response()->json(['message' => 'Aucun ID fourni.'], 400);
        }

        $results = ['success' => [], 'failed' => []];

        DB::beginTransaction();
        try {

            $domiciliations = Domicilier::with(['banque', 'guichet'])
                ->whereIn('DOM_CODE', $ids)
                ->get()
                ->keyBy('DOM_CODE');

            foreach ($ids as $domCode) {

                $domiciliation = $domiciliations->get($domCode);

                if (!$domiciliation) {
                    $results['failed'][] = ['DOM_CODE' => $domCode, 'reason' => 'RIB introuvable.'];
                    continue;
                }

                if ($domiciliation->DOM_STATUT == 3) {
                    $results['failed'][] = ['DOM_CODE' => $domCode, 'reason' => 'Déjà approuvé.'];
                    continue;
                }

                $beneficiaire = Beneficiaire::where('BEN_CODE', $domiciliation->BEN_CODE)->first();

                // Désactiver anciens RIB approuvés
                Domicilier::where('BEN_CODE', $beneficiaire->BEN_CODE)
                    ->where('DOM_STATUT', 3)
                    ->update(['DOM_STATUT' => 1]);

                $domiciliation->DOM_STATUT = 3;
                $domiciliation->save();

                 // Mise à jour du dernier Mouvement de niveau 1 seulement
                $dernierMvt = Mouvement::where('MVT_DOM_CODE', $domiciliation->DOM_CODE)
                    ->where('MVT_NIV', 2)
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

                $results['success'][] = ['DOM_CODE' => $domCode];
            }

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur de base de données : ' . $e->getMessage()
            ], 500);
        }

        return response()->json([
            'message' => 'Approbation réussie.',
            'updated' => count($results['success']),
            'failed'  => $results['failed'],
            'success' => $results['success'],
        ]);
    }

   public function rejeterDomicilier(Request $request, $id = null)
    {
        $user = Auth::user();
        $now = Carbon::now();

        $request->validate([
            'DOM_MOTIF_REJET' => 'required|string|max:1000',
        ]);

        DB::beginTransaction();

        try {

            /*
            |--------------------------------------------------------------------------
            | REJET UNIQUE
            |--------------------------------------------------------------------------
            */
            if ($id) {

                $domiciliation = Domicilier::where('DOM_CODE', $id)->first();

                if (!$domiciliation) {
                    DB::rollBack();
                    return response()->json(['message' => 'RIB introuvable.'], 404);
                }

                if ($domiciliation->DOM_STATUT == 3) {
                    DB::rollBack();
                    return response()->json(['message' => 'RIB déjà approuvé.'], 400);
                }

                $mvtCodes = DB::table('t_mouvements')
                    ->where('MVT_DOM_CODE', $id)
                    ->where('TYP_CODE', '20250003') // type mouvement domiciliation
                    ->pluck('MVT_CODE');

                if ($mvtCodes->isNotEmpty()) {

                    //  supprimer historiques
                    DB::table('t_historiques_validations')
                        ->whereIn('MVT_CODE', $mvtCodes)
                        ->delete();

                    DB::table('t_mouvements')
                        ->whereIn('MVT_CODE', $mvtCodes)
                        ->update(['MVT_NIV' => 1]);
                }

                // mise à jour domiciliation
                $domiciliation->DOM_STATUT = 0; // rejeté
                $domiciliation->DOM_MOTIF_REJET = $request->DOM_MOTIF_REJET;
                $domiciliation->save();

                DB::commit();

                return response()->json([
                    'message' => 'Rejet effectué avec succès.'
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | REJET MULTIPLE
            |--------------------------------------------------------------------------
            */
            $ids = $request->input('ids', []);

            if (!is_array($ids) || count($ids) === 0) {
                DB::rollBack();
                return response()->json(['message' => 'Aucun ID fourni.'], 400);
            }

            $results = ['success' => [], 'failed' => []];

            $domiciliations = Domicilier::whereIn('DOM_CODE', $ids)
                ->get()
                ->keyBy('DOM_CODE');

            foreach ($ids as $domCode) {

                $domiciliation = $domiciliations->get($domCode);

                if (!$domiciliation) {
                    $results['failed'][] = [
                        'DOM_CODE' => $domCode,
                        'reason' => 'RIB introuvable.'
                    ];
                    continue;
                }

                if ($domiciliation->DOM_STATUT == 3) {
                    $results['failed'][] = [
                        'DOM_CODE' => $domCode,
                        'reason' => 'Déjà approuvé.'
                    ];
                    continue;
                }

                $mvtCodes = DB::table('t_mouvements')
                    ->where('MVT_DOM_CODE', $domCode)
                    ->where('TYP_CODE', '20250003')
                    ->pluck('MVT_CODE');

                if ($mvtCodes->isNotEmpty()) {

                    DB::table('t_historiques_validations')
                        ->whereIn('MVT_CODE', $mvtCodes)
                        ->delete();

                    DB::table('t_mouvements')
                        ->whereIn('MVT_CODE', $mvtCodes)
                        ->update(['MVT_NIV' => 1]);
                }

                $domiciliation->DOM_STATUT = 0;
                $domiciliation->DOM_MOTIF_REJET = $request->DOM_MOTIF_REJET;
                $domiciliation->save();

                $results['success'][] = ['DOM_CODE' => $domCode];
            }

            DB::commit();

            return response()->json([
                'message' => 'Rejet effectué avec succès.',
                'updated' => count($results['success']),
                'failed'  => $results['failed'],
                'success' => $results['success']
            ]);

        } catch (\Throwable $e) {

            DB::rollBack();

            return response()->json([
                'message' => 'Erreur lors du rejet',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getMouvementsPaiementsEnCours(Request $request)
    {
        // Utilisateur connecté
        $user = Auth::user();

        // Récupérer le niveau de validation
        $nivValeur = DB::table('t_niveau_validations')
            ->join('t_groupes', 't_groupes.NIV_CODE', '=', 't_niveau_validations.NIV_CODE')
            ->where('t_groupes.GRP_CODE', $user->GRP_CODE)
            ->value('NIV_VALEUR');

        // ===== Filtre échéance : si non envoyé, prendre la dernière active =====
        $echCodeFilter = $request->input('ech_code');
        if (empty($echCodeFilter)) {
            $currentEcheance = DB::table('t_echeances')
                ->where('ECH_STATUT', true)
                ->orderBy('ECH_CODE', 'desc')
                ->first();
            $echCodeFilter = $currentEcheance?->ECH_CODE;
        }

        // Récupérer tous les mouvements
        $mouvements = Mouvement::query()
            ->join('t_beneficiaires', 't_beneficiaires.BEN_CODE', '=', 't_mouvements.MVT_BEN_CODE')
            ->join('t_paiements', 't_paiements.PAI_CODE', '=', 't_mouvements.MVT_PAI_CODE')
            ->leftJoin('t_domiciliers', function($join){
                $join->on('t_domiciliers.DOM_CODE', '=', 't_mouvements.MVT_DOM_CODE')
                    ->whereIn('t_domiciliers.DOM_STATUT', [2, 3])
                    ->orderByDesc('t_domiciliers.DOM_STATUT'); // 3 avant 2
            })
            ->leftJoin('t_banques', 't_banques.BNQ_CODE', '=', 't_domiciliers.BNQ_CODE')
            ->leftJoin('t_guichets', 't_guichets.GUI_ID', '=', 't_domiciliers.GUI_ID')
            ->leftJoin('t_type_beneficiaires', 't_type_beneficiaires.TYP_CODE', '=', 't_beneficiaires.TYP_CODE')
            ->leftJoin('t_fonctions', 't_fonctions.FON_CODE', '=', 't_beneficiaires.FON_CODE')
            ->leftJoin('t_grades', 't_grades.GRD_CODE', '=', 't_beneficiaires.GRD_CODE')
            ->leftJoin('t_positions', 't_positions.POS_CODE', '=', 't_beneficiaires.POS_CODE')
            ->where('t_paiements.PAI_STATUT', 2)
            ->where('t_mouvements.TYP_CODE', '20250002')
            ->where('t_mouvements.MVT_NIV', $nivValeur)
            ->where('t_mouvements.MVT_UTI_REG', $user->REG_CODE)
            ->orderBy('t_mouvements.MVT_DATE', 'desc')
            ->select([
                // ===== Mouvement =====
                't_mouvements.MVT_CODE',
                't_mouvements.MVT_DOM_CODE as DOM_CODE',
                't_mouvements.MVT_DATE',
                't_mouvements.MVT_NIV',
                't_mouvements.MVT_UTI_CODE',
                't_mouvements.MVT_CREER_PAR',
                't_mouvements.TYP_CODE',

                // ===== Paiement =====
                't_paiements.PAI_CODE',
                't_paiements.PAI_STATUT',
                't_paiements.ECH_CODE',

                // ===== Bénéficiaire =====
                't_beneficiaires.BEN_MATRICULE',
                DB::raw("CONCAT(t_beneficiaires.BEN_NOM, ' ', t_beneficiaires.BEN_PRENOM) as BENEFICIAIRE"),
                't_beneficiaires.BEN_SEXE',
                't_beneficiaires.BEN_STATUT',

                // ===== RIB =======
                't_banques.BNQ_LIBELLE as BANQUE',
                't_guichets.GUI_CODE as GUICHET',
                't_domiciliers.DOM_NUMCPT as NUMCPT',
                't_domiciliers.DOM_RIB as RIB',
                't_domiciliers.DOM_STATUT',

                // ===== Infos complémentaires =====
                't_type_beneficiaires.TYP_CODE',
                't_type_beneficiaires.TYP_LIBELLE as TYPE_BENEFICIAIRE',
                't_fonctions.FON_LIBELLE as FONCTION',
                't_grades.GRD_LIBELLE as GRADE',
                't_positions.POS_LIBELLE as POSITION',
            ])
            ->orderByDesc('t_paiements.PAI_CODE')
            ->get();

        // Récupérer tous les détails de paiement
        $detailsPaiements = DB::table('t_details_paiement')
            ->join('t_elements', 't_elements.ELT_CODE', '=', 't_details_paiement.ELT_CODE')
            ->select(
                't_details_paiement.PAI_CODE',
                't_elements.ELT_LIBELLE',
                't_elements.ELT_SENS',
                DB::raw('t_details_paiement.PAI_MONTANT as ELT_MONTANT')
            )
            ->orderBy('t_details_paiement.DET_CODE')
            ->get()
            ->groupBy('PAI_CODE');

        // Calculer les totaux pour chaque paiement
        $totauxPaiements = DB::table('t_details_paiement')
            ->join('t_elements', 't_elements.ELT_CODE', '=', 't_details_paiement.ELT_CODE')
            ->select(
                't_details_paiement.PAI_CODE',
                DB::raw('SUM(CASE WHEN t_elements.ELT_SENS = 1 THEN t_details_paiement.PAI_MONTANT ELSE 0 END) AS TOTAL_GAIN'),
                DB::raw('SUM(CASE WHEN t_elements.ELT_SENS = 2 THEN t_details_paiement.PAI_MONTANT ELSE 0 END) AS TOTAL_RETENU'),
                DB::raw('(SUM(CASE WHEN t_elements.ELT_SENS = 1 THEN t_details_paiement.PAI_MONTANT ELSE 0 END) - SUM(CASE WHEN t_elements.ELT_SENS = 2 THEN t_details_paiement.PAI_MONTANT ELSE 0 END)) AS MONTANT_NET')
            )
            ->groupBy('t_details_paiement.PAI_CODE')
            ->get()
            ->keyBy('PAI_CODE');

        // Lier détails et totaux à chaque mouvement
        $mouvements = $mouvements->map(function ($mvt) use ($detailsPaiements, $totauxPaiements) {
            $paiCode = $mvt->PAI_CODE;

            $mvt->details = $detailsPaiements[$paiCode] ?? [];
            $totaux = $totauxPaiements[$paiCode] ?? (object)[
                'TOTAL_GAIN' => 0,
                'TOTAL_RETENU' => 0,
                'MONTANT_NET' => 0
            ];

            $mvt->TOTAL_GAIN   = $totaux->TOTAL_GAIN;
            $mvt->TOTAL_RETENU = $totaux->TOTAL_RETENU;
            $mvt->MONTANT_NET  = $totaux->MONTANT_NET;

            return $mvt;
        });

        // ===== Filtre échéance appliqué comme index =====
        $mouvements = $mouvements->filter(function($mvt) use ($echCodeFilter) {
            return !$echCodeFilter || $mvt->ECH_CODE == $echCodeFilter;
        });

        return response()->json([
            'count' => $mouvements->count(),
            'data'  => $mouvements->values()
        ]);
    }

    private function getDomiciliationBeneficiaire($benCode)
    {
        return Domicilier::with(['banque', 'guichet'])
            ->where('BEN_CODE', $benCode)
            ->where('DOM_STATUT', 3) // seulement les domiciliations actives
            ->first();
    }

    public function approuverPaiement(Request $request, $id = null)
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

            if ($paiement->PAI_STATUT == 3) {
                return response()->json(['message' => 'Ce paiement a déjà été approuvé.'], 400);
            }

            DB::transaction(function () use ($paiement, $user, $nivValeur, $now) {

                $domiciliation = $this->getDomiciliationBeneficiaire($paiement->BEN_CODE);

                if (!$domiciliation) {
                    throw new \Exception("Aucune domiciliation trouvée pour le bénéficiaire {$paiement->BEN_CODE}");
                }

                $paiement->PAI_STATUT = 3;
                $paiement->PAI_MOTIF_REJET = null;
                $paiement->save();

                // Mise à jour du dernier Mouvement de niveau 1 seulement
                $dernierMvt = Mouvement::where('MVT_PAI_CODE', $paiement->PAI_CODE)
                    ->where('MVT_NIV', 2)
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
            return response()->json(['message' => "Approbation réussie."]);
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

                if (in_array($paiementItem->PAI_STATUT, [3])) {
                    $results['failed'][] = [
                        'PAI_CODE' => $code,
                        'reason' => 'Paiement déjà approuvé'
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

                $paiementItem->PAI_STATUT = 3;
                $paiementItem->PAI_MOTIF_REJET = null;
                $paiementItem->save();

                // Mise à jour du dernier Mouvement de niveau 1 seulement
                $dernierMvt = Mouvement::where('MVT_PAI_CODE', $paiementItem->PAI_CODE)
                    ->where('MVT_NIV', 2)
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
            'message' => 'Approbation réussie.',
            'updated' => count($results['success']),
            'failed' => $results['failed'],
            'success' => $results['success']
        ]);
    }

    public function rejeterPaiement(Request $request, $id = null)
    {
        $user = Auth::user();
        $now = Carbon::now();

        $request->validate([
            'PAI_MOTIF_REJET' => 'required|string|max:1000',
        ]);

        DB::beginTransaction();

        try {

            /*
            |--------------------------------------------------------------------------
            | REJET UNIQUE
            |--------------------------------------------------------------------------
            */
            if ($id) {

                $paiement = Paiement::where('PAI_CODE', $id)->first();

                if (!$paiement) {
                    DB::rollBack();
                    return response()->json(['message' => 'Paiement introuvable.'], 404);
                }

                if ($paiement->PAI_STATUT == 3) {
                    DB::rollBack();
                    return response()->json(['message' => 'Paiement déjà approuvé.'], 400);
                }

                $mvtCodes = DB::table('t_mouvements')
                    ->where('MVT_PAI_CODE', $id)
                    ->where('TYP_CODE', '20250002') // type mouvement paiement
                    ->pluck('MVT_CODE');

                if ($mvtCodes->isNotEmpty()) {

                    // supprimer historiques
                    DB::table('t_historiques_validations')
                        ->whereIn('MVT_CODE', $mvtCodes)
                        ->delete();

                    DB::table('t_mouvements')
                        ->whereIn('MVT_CODE', $mvtCodes)
                        ->update(['MVT_NIV' => 1]);
                }

                // mise à jour paiement
                $paiement->PAI_STATUT = 0; // rejeté
                $paiement->PAI_MOTIF_REJET = $request->PAI_MOTIF_REJET;
                $paiement->save();

                DB::commit();

                return response()->json([
                    'message' => 'Rejet effectué avec succès.'
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | REJET MULTIPLE
            |--------------------------------------------------------------------------
            */
            $ids = $request->input('ids', []);

            if (!is_array($ids) || count($ids) === 0) {
                DB::rollBack();
                return response()->json(['message' => 'Aucun ID fourni.'], 400);
            }

            $results = ['success' => [], 'failed' => []];

            $paiements = Paiement::whereIn('PAI_CODE', $ids)
                ->get()
                ->keyBy('PAI_CODE');

            foreach ($ids as $code) {

                $paiementItem = $paiements->get($code);

                if (!$paiementItem) {
                    $results['failed'][] = [
                        'PAI_CODE' => $code,
                        'reason' => 'Paiement introuvable.'
                    ];
                    continue;
                }

                if ($paiementItem->PAI_STATUT == 3) {
                    $results['failed'][] = [
                        'PAI_CODE' => $code,
                        'reason' => 'Déjà approuvé.'
                    ];
                    continue;
                }

                $mvtCodes = DB::table('t_mouvements')
                    ->where('MVT_PAI_CODE', $code)
                    ->where('TYP_CODE', '20250002')
                    ->pluck('MVT_CODE');

                if ($mvtCodes->isNotEmpty()) {

                    DB::table('t_historiques_validations')
                        ->whereIn('MVT_CODE', $mvtCodes)
                        ->delete();

                    DB::table('t_mouvements')
                        ->whereIn('MVT_CODE', $mvtCodes)
                        ->update(['MVT_NIV' => 1]);
                }

                $paiementItem->PAI_STATUT = 0;
                $paiementItem->PAI_MOTIF_REJET = $request->PAI_MOTIF_REJET;
                $paiementItem->save();

                $results['success'][] = ['PAI_CODE' => $code];
            }

            DB::commit();

            return response()->json([
                'message' => 'Rejet effectué avec succès.',
                'updated' => count($results['success']),
                'failed'  => $results['failed'],
                'success' => $results['success']
            ]);

        } catch (\Throwable $e) {

            DB::rollBack();

            return response()->json([
                'message' => 'Erreur lors du rejet',
                'error'   => $e->getMessage()
            ], 500);
        }
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

    public function validerBeneficiaireEtDomicilier(Request $request, $benCode = null)
    {
        $user = Auth::user();
        $now = Carbon::now();

        // Récupération du niveau de validation
        $nivValeur = DB::table('t_niveau_validations')
            ->join('t_groupes', 't_groupes.NIV_CODE', '=', 't_niveau_validations.NIV_CODE')
            ->where('t_groupes.GRP_CODE', $user->GRP_CODE)
            ->value('NIV_VALEUR');

        // Récupération du bénéficiaire
        $beneficiaire = Beneficiaire::where('BEN_CODE', $benCode)->first();
        if (!$beneficiaire) {
            return response()->json(['message' => 'Bénéficiaire introuvable.'], 404);
        }

        // Récupération du dernier RIB ajouté
        $dernierDomicilier = Domicilier::where('BEN_CODE', $benCode)
            ->orderBy('DOM_CODE', 'desc')
            ->first();

        // Vérification des statuts
        $beneficiaireNonTransmis = $beneficiaire->BEN_STATUT != 2 && $beneficiaire->BEN_STATUT != 3;
        $domicilierNonTransmis = $dernierDomicilier && $dernierDomicilier->DOM_STATUT != 2 && $dernierDomicilier->DOM_STATUT != 3;

        $confirmed = $request->input('confirm', false);

        // Dialogue de confirmation si nécessaire
        if (($beneficiaireNonTransmis || $domicilierNonTransmis) && !$confirmed) {
            $message = "Voulez-vous soumettre ";
            if ($beneficiaireNonTransmis && $domicilierNonTransmis) {
                $message .= "le bénéficiaire et son RIB ajouté récemment ?";
            } elseif ($beneficiaireNonTransmis) {
                $message .= "le bénéficiaire à l'approbation ?";
            } elseif ($domicilierNonTransmis) {
                $message .= "le dernier RIB ajouté à l'approbation ?";
            }

            return response()->json([
                'message' => $message,
                'requiresConfirmation' => true
            ]);
        }

        // Vérifier un autre RIB en cours
        if ($dernierDomicilier) {
            $autreEnCours = Domicilier::where('BEN_CODE', $dernierDomicilier->BEN_CODE)
                ->where('DOM_STATUT', 2)
                ->where('DOM_CODE', '!=', $dernierDomicilier->DOM_CODE)
                ->exists();

            if ($autreEnCours) {
                return response()->json([
                    'message' => 'Un autre RIB de ce bénéficiaire est déjà en cours d’approbation.'
                ], 400);
            }
        }

        // ===== Transaction =====
        DB::transaction(function () use ($beneficiaire, $dernierDomicilier, $user, $nivValeur, $now) {

            // -------- Bénéficiaire --------
            if ($beneficiaire->BEN_STATUT != 2 && $beneficiaire->BEN_STATUT != 3) {
                $beneficiaire->BEN_STATUT = 2;
                $beneficiaire->BEN_MOTIF_REJET = null;
                $beneficiaire->save();

                // Dernier mouvement du bénéficiaire
                $dernierMvt = Mouvement::where('MVT_BEN_CODE', $beneficiaire->BEN_CODE)
                    ->where('MVT_NIV', 1)
                    ->first();

                if ($dernierMvt) {
                    $dernierMvt->MVT_NIV += 1;
                    $dernierMvt->MVT_DATE = $now->toDateString();
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

            // -------- Dernier RIB --------
            if ($dernierDomicilier && $dernierDomicilier->DOM_STATUT != 2 && $dernierDomicilier->DOM_STATUT != 3) {
                $dernierDomicilier->DOM_STATUT = 2;
                $dernierDomicilier->DOM_MOTIF_REJET = null;
                $dernierDomicilier->save();

                $dernierMvt = Mouvement::where('MVT_DOM_CODE', $dernierDomicilier->DOM_CODE)
                    ->where('MVT_NIV', 1) 
                    ->orderByDesc('MVT_DATE')
                    ->first();

                if ($dernierMvt) {
                    $dernierMvt->MVT_NIV += 1;
                    $dernierMvt->MVT_DATE = $now->toDateString();
                    $dernierMvt->save();

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

        return response()->json(['message' => "Soumission à l'approbation réussie."]);
    }  
    
    public function getTotauxMouvementsEnCours()
    {
        $user = Auth::user();

        // Niveau de validation
        $nivValeur = DB::table('t_niveau_validations')
            ->join('t_groupes', 't_groupes.NIV_CODE', '=', 't_niveau_validations.NIV_CODE')
            ->where('t_groupes.GRP_CODE', $user->GRP_CODE)
            ->value('NIV_VALEUR');

        /*
        |--------------------------------------------------------------------------
        | BÉNÉFICIAIRES EN COURS (20250001)
        |--------------------------------------------------------------------------
        */
        $totalBeneficiaires = Mouvement::query()
            ->join('t_beneficiaires', 't_beneficiaires.BEN_CODE', '=', 't_mouvements.MVT_BEN_CODE')
            ->join('t_utilisateurs', 't_utilisateurs.UTI_CODE', '=', 't_mouvements.MVT_UTI_CODE')
            ->where('t_beneficiaires.BEN_STATUT', 2)
            ->where('t_mouvements.TYP_CODE', '20250001')
            ->where('t_mouvements.MVT_NIV', $nivValeur)
            ->where('t_mouvements.MVT_UTI_REG', $user->REG_CODE) // même régie
            ->count();

        /*
        |--------------------------------------------------------------------------
        | DOMICILIATIONS EN COURS (20250003)
        |--------------------------------------------------------------------------
        */
        $totalDomiciliers = Mouvement::query()
            ->join('t_domiciliers', 't_domiciliers.DOM_CODE', '=', 't_mouvements.MVT_DOM_CODE')
            ->join('t_utilisateurs', 't_utilisateurs.UTI_CODE', '=', 't_mouvements.MVT_UTI_CODE')
            ->where('t_domiciliers.DOM_STATUT', 2)
            ->where('t_mouvements.TYP_CODE', '20250003')
            ->where('t_mouvements.MVT_NIV', $nivValeur)
            ->where('t_mouvements.MVT_UTI_REG', $user->REG_CODE) // même régie
            ->count();

        /*
        |--------------------------------------------------------------------------
        | PAIEMENTS EN COURS (20250002)
        |--------------------------------------------------------------------------
        */
        $totalPaiements = Mouvement::query()
            ->join('t_paiements', 't_paiements.PAI_CODE', '=', 't_mouvements.MVT_PAI_CODE')
            ->join('t_utilisateurs', 't_utilisateurs.UTI_CODE', '=', 't_mouvements.MVT_UTI_CODE')
            ->where('t_paiements.PAI_STATUT', 2)
            ->where('t_mouvements.TYP_CODE', '20250002')
            ->where('t_mouvements.MVT_NIV', $nivValeur)
            ->where('t_mouvements.MVT_UTI_REG', $user->REG_CODE) // même régie
            ->count();

        /*
        |--------------------------------------------------------------------------
        | TOTAL GÉNÉRAL
        |--------------------------------------------------------------------------
        */
        $totalGeneral = $totalBeneficiaires + $totalPaiements + $totalDomiciliers;

        return response()->json([
            'total_general' => $totalGeneral,
            'par_type' => [
                '20250001' => [
                    'libelle' => 'Bénéficiaires',
                    'total'   => $totalBeneficiaires,
                ],
                '20250003' => [
                    'libelle' => 'Domiciliations',
                    'total'   => $totalDomiciliers,
                ],
                '20250002' => [
                    'libelle' => 'Paiements',
                    'total'   => $totalPaiements,
                ],
            ]
        ]);
    }
}
