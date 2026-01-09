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

            //  AJOUT 3 : jointure utilisateurs (pour la régie)
            ->join(
                't_utilisateurs',
                't_utilisateurs.UTI_CODE',
                '=',
                't_mouvements.MVT_UTI_CODE'
            )

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
            ->where('t_beneficiaires.BEN_STATUT', 1)
            ->where('t_mouvements.TYP_CODE', '20250001')

            //  AJOUT 4 : filtre MÉTIER
            ->when($nivValeur == 2, function ($query) use ($user) {
                $query
                    ->where('t_mouvements.MVT_NIV', 1) // transmis par niveau 1
                    ->where('t_utilisateurs.REG_CODE', $user->REG_CODE); // même régie
            })

            ->orderBy('t_mouvements.MVT_DATE', 'desc')
            ->orderBy('t_mouvements.MVT_HEURE', 'desc')
            ->select([
                // ===== Mouvement =====
                't_mouvements.MVT_CODE',
                't_mouvements.MVT_BEN_CODE as BEN_CODE',
                't_mouvements.MVT_BEN_NOM_PRE',
                't_mouvements.MVT_DATE',
                't_mouvements.MVT_HEURE',
                't_mouvements.MVT_NIV',
                't_mouvements.MVT_UTI_CODE',
                't_mouvements.MVT_CREER_PAR',
                't_mouvements.TYP_CODE',

                // ===== Bénéficiaire =====
                't_beneficiaires.BEN_MATRICULE',
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

            if ($beneficiaire->BEN_STATUT == 2) {
                return response()->json(['message' => 'Ce bénéficiaire a déjà été approuvé.'], 400);
            }

            DB::transaction(function () use ($beneficiaire, $user, $nivValeur, $now) {

                $beneficiaire->BEN_STATUT = 2;
                $beneficiaire->save();

                $mvtCode = $this->generateMvtCode($user->REG_CODE);

                Mouvement::create([
                    'MVT_CODE'          => $mvtCode,
                    'MVT_BEN_CODE'      => $beneficiaire->BEN_CODE,
                    'MVT_BEN_NOM_PRE'   => $beneficiaire->BEN_NOM. " " .$beneficiaire->BEN_PRENOM,
                    'MVT_DATE'          => $now->toDateString(),
                    'MVT_HEURE'         => $now->toTimeString(),
                    'MVT_NIV'           => $nivValeur,
                    'MVT_UTI_CODE'      => $user->UTI_CODE,
                    'MVT_CREER_PAR'     => $user->UTI_NOM." ".$user->UTI_PRENOM,
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

                    if ($beneficiaire->BEN_STATUT == 2) {
                        $results['failed'][] = ['BEN_CODE' => $code, 'reason' => 'Déjà approuvé.'];
                        return;
                    }

                    $beneficiaire->BEN_STATUT = 2;
                    $beneficiaire->save();

                    $mvtCode = $this->generateMvtCode($user->REG_CODE);

                    Mouvement::create([
                        'MVT_CODE'        => $mvtCode,
                        'MVT_BEN_CODE'    => $beneficiaire->BEN_CODE,
                        'MVT_BEN_NOM_PRE' => $beneficiaire->BEN_NOM . " " . $beneficiaire->BEN_PRENOM,
                        'MVT_DATE'        => $now->toDateString(),
                        'MVT_HEURE'       => $now->toTimeString(),
                        'MVT_NIV'         => $nivValeur,
                        'MVT_UTI_CODE'    => $user->UTI_CODE,
                        'MVT_CREER_PAR'   => $user->UTI_NOM . " " . $user->UTI_PRENOM,
                        'TYP_CODE'        => '20250001',
                    ]);

                    HistoriquesValidation::create([
                        'VAL_CODE'        => $mvtCode,
                        'VAL_BEN_CODE'    => $beneficiaire->BEN_CODE,
                        'VAL_BEN_NOM_PRE' => $beneficiaire->BEN_NOM . " " . $beneficiaire->BEN_PRENOM,
                        'VAL_UTI_CODE'    => $user->UTI_CODE,
                        'VAL_DATE'        => $now->toDateString(),
                        'VAL_HEURE'       => $now->toTimeString(),
                        'VAL_NIV'         => $nivValeur,
                        'VAL_CREER_PAR'   => $user->UTI_NOM . " " . $user->UTI_PRENOM,
                        'MVT_CODE'        => $mvtCode,
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

            DB::transaction(function () use ($beneficiaire, $user, $nivValeur, $now) {

                $beneficiaire->BEN_STATUT = 3;
                $beneficiaire->save();
            });

            return response()->json(['message' => "Rejet effectué avec succès."]);
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

                $beneficiaire->BEN_STATUT = 3;
                $beneficiaire->save();

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
            'message' => 'Rejet effectué avec succès.',
            'updated' => count($results['success']),
            'failed'  => $results['failed'],
            'success' => $results['success']
        ]);
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

            //  AJOUT 3 : jointure utilisateurs (pour la régie)
            ->join(
                't_utilisateurs',
                't_utilisateurs.UTI_CODE',
                '=',
                't_mouvements.MVT_UTI_CODE'
            )

            ->join(
                't_beneficiaires',
                't_beneficiaires.BEN_CODE',
                '=',
                't_mouvements.MVT_BEN_CODE'
            )
            ->join(
                't_domiciliers',
                't_domiciliers.DOM_CODE',
                '=',
                't_mouvements.MVT_DOM_CODE'
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
            ->where('t_domiciliers.DOM_STATUT', 1)
            ->where('t_mouvements.TYP_CODE', '20250003')

            //  AJOUT 4 : filtre métier (niveau 2 uniquement)
            ->when($nivValeur == 2, function ($query) use ($user) {
                $query
                    ->where('t_mouvements.MVT_NIV', 1) // transmis par niveau 1
                    ->where('t_utilisateurs.REG_CODE', $user->REG_CODE); // même régie
            })

            ->orderBy('t_mouvements.MVT_DATE', 'desc')
            ->orderBy('t_mouvements.MVT_HEURE', 'desc')
            ->select([
                // ===== Mouvement =====
                't_mouvements.MVT_CODE',
                't_mouvements.MVT_DOM_CODE as DOM_CODE',
                't_mouvements.MVT_BEN_NOM_PRE',
                't_mouvements.MVT_BNQ_LIBELLE as BANQUE',
                't_mouvements.MVT_GUI_CODE as GUICHET',
                't_mouvements.MVT_NUMCPT as NUMCPT',
                't_mouvements.MVT_CLE_RIB as RIB',
                't_mouvements.MVT_DATE',
                't_mouvements.MVT_HEURE',
                't_mouvements.MVT_NIV',
                't_mouvements.MVT_UTI_CODE',
                't_mouvements.MVT_CREER_PAR',
                't_mouvements.TYP_CODE',

                't_domiciliers.DOM_STATUT',

                // ===== Bénéficiaire =====
                't_beneficiaires.BEN_MATRICULE',
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

            if ($domiciliation->DOM_STATUT == 2) {
                return response()->json(['message' => 'Ce RIB a déjà été approuvé.'], 400);
            }

            $beneficiaire = Beneficiaire::where('BEN_CODE', $domiciliation->BEN_CODE)->first();

            DB::transaction(function () use ($domiciliation, $beneficiaire, $user, $nivValeur, $now) {

                // Désactiver les anciens RIB approuvés
                Domicilier::where('BEN_CODE', $beneficiaire->BEN_CODE)
                    ->where('DOM_STATUT', 2)
                    ->update(['DOM_STATUT' => 0]);

                $domiciliation->DOM_STATUT = 2;
                $domiciliation->save();

                $mvtCode = $this->generateMvtCode($user->REG_CODE);

                Mouvement::create([
                    'MVT_CODE'        => $mvtCode,
                    'MVT_DOM_CODE'    => $domiciliation->DOM_CODE,
                    'MVT_BEN_CODE'    => $beneficiaire->BEN_CODE,
                    'MVT_BEN_NOM_PRE' => $beneficiaire->BEN_NOM . ' ' . $beneficiaire->BEN_PRENOM,
                    'MVT_BNQ_CODE'    => $domiciliation->BNQ_CODE,
                    'MVT_BNQ_LIBELLE' => $domiciliation->banque?->BNQ_LIBELLE,
                    'MVT_GUI_CODE'    => $domiciliation->guichet?->GUI_CODE,
                    'MVT_GUI_NOM'     => $domiciliation->guichet?->GUI_NOM,
                    'MVT_NUMCPT'      => $domiciliation->DOM_NUMCPT,
                    'MVT_CLE_RIB'     => $domiciliation->DOM_RIB,
                    'MVT_DATE'        => $now->toDateString(),
                    'MVT_HEURE'       => $now->toTimeString(),
                    'MVT_NIV'         => $nivValeur,
                    'MVT_UTI_CODE'    => $user->UTI_CODE,
                    'MVT_CREER_PAR'   => $user->UTI_NOM . ' ' . $user->UTI_PRENOM,
                    'TYP_CODE'        => '20250003',
                ]);

                HistoriquesValidation::create([
                    'VAL_CODE'        => $mvtCode,
                    'VAL_DOM_CODE'    => $domiciliation->DOM_CODE,
                    'VAL_BEN_CODE'    => $beneficiaire->BEN_CODE,
                    'VAL_BEN_NOM_PRE' => $beneficiaire->BEN_NOM . ' ' . $beneficiaire->BEN_PRENOM,
                    'VAL_BNQ_CODE'    => $domiciliation->BNQ_CODE,
                    'VAL_BNQ_LIBELLE' => $domiciliation->banque?->BNQ_LIBELLE,
                    'VAL_GUI_CODE'    => $domiciliation->guichet?->GUI_CODE,
                    'VAL_GUI_NOM'     => $domiciliation->guichet?->GUI_NOM,
                    'VAL_NUMCPT'      => $domiciliation->DOM_NUMCPT,
                    'VAL_CLE_RIB'     => $domiciliation->DOM_RIB,
                    'VAL_DATE'        => $now->toDateString(),
                    'VAL_HEURE'       => $now->toTimeString(),
                    'VAL_NIV'         => $nivValeur,
                    'VAL_UTI_CODE'    => $user->UTI_CODE,
                    'VAL_CREER_PAR'   => $user->UTI_NOM . ' ' . $user->UTI_PRENOM,
                    'MVT_CODE'        => $mvtCode,
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

                if ($domiciliation->DOM_STATUT == 2) {
                    $results['failed'][] = ['DOM_CODE' => $domCode, 'reason' => 'Déjà approuvé.'];
                    continue;
                }

                $beneficiaire = Beneficiaire::where('BEN_CODE', $domiciliation->BEN_CODE)->first();

                // Désactiver anciens RIB approuvés
                Domicilier::where('BEN_CODE', $beneficiaire->BEN_CODE)
                    ->where('DOM_STATUT', 2)
                    ->update(['DOM_STATUT' => 0]);

                $domiciliation->DOM_STATUT = 2;
                $domiciliation->save();

                $mvtCode = $this->generateMvtCode($user->REG_CODE);

                Mouvement::create([
                    'MVT_CODE'        => $mvtCode,
                    'MVT_DOM_CODE'    => $domiciliation->DOM_CODE,
                    'MVT_BEN_CODE'    => $beneficiaire->BEN_CODE,
                    'MVT_BEN_NOM_PRE' => $beneficiaire->BEN_NOM . ' ' . $beneficiaire->BEN_PRENOM,
                    'MVT_BNQ_CODE'    => $domiciliation->BNQ_CODE,
                    'MVT_BNQ_LIBELLE' => $domiciliation->banque?->BNQ_LIBELLE,
                    'MVT_GUI_CODE'    => $domiciliation->guichet?->GUI_CODE,
                    'MVT_GUI_NOM'     => $domiciliation->guichet?->GUI_NOM,
                    'MVT_NUMCPT'      => $domiciliation->DOM_NUMCPT,
                    'MVT_CLE_RIB'     => $domiciliation->DOM_RIB,
                    'MVT_DATE'        => $now->toDateString(),
                    'MVT_HEURE'       => $now->toTimeString(),
                    'MVT_NIV'         => $nivValeur,
                    'MVT_UTI_CODE'    => $user->UTI_CODE,
                    'MVT_CREER_PAR'   => $user->UTI_NOM . ' ' . $user->UTI_PRENOM,
                    'TYP_CODE'        => '20250003',
                ]);

                HistoriquesValidation::create([
                    'VAL_CODE'        => $mvtCode,
                    'VAL_DOM_CODE'    => $domiciliation->DOM_CODE,
                    'VAL_BEN_CODE'    => $beneficiaire->BEN_CODE,
                    'VAL_BEN_NOM_PRE' => $beneficiaire->BEN_NOM . ' ' . $beneficiaire->BEN_PRENOM,
                    'VAL_BNQ_CODE'    => $domiciliation->BNQ_CODE,
                    'VAL_BNQ_LIBELLE' => $domiciliation->banque?->BNQ_LIBELLE,
                    'VAL_GUI_CODE'    => $domiciliation->guichet?->GUI_CODE,
                    'VAL_GUI_NOM'     => $domiciliation->guichet?->GUI_NOM,
                    'VAL_NUMCPT'      => $domiciliation->DOM_NUMCPT,
                    'VAL_CLE_RIB'     => $domiciliation->DOM_RIB,
                    'VAL_DATE'        => $now->toDateString(),
                    'VAL_HEURE'       => $now->toTimeString(),
                    'VAL_NIV'         => $nivValeur,
                    'VAL_UTI_CODE'    => $user->UTI_CODE,
                    'VAL_CREER_PAR'   => $user->UTI_NOM . ' ' . $user->UTI_PRENOM,
                    'MVT_CODE'        => $mvtCode,
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

        // Récupération du niveau de validation
        $nivValeur = DB::table('t_niveau_validations')
            ->join('t_groupes', 't_groupes.NIV_CODE', '=', 't_niveau_validations.NIV_CODE')
            ->where('t_groupes.GRP_CODE', $user->GRP_CODE)
            ->value('NIV_VALEUR');

        if ($id) {
            // ===== VALIDATION UNIQUE =====
            $domiciliation = Domicilier::with(['banque', 'guichet'])
                ->where('DOM_CODE', $id)
                ->first();

            if (!$domiciliation) {
                return response()->json(['message' => 'RIB introuvable.'], 404);
            }

            $beneficiaire = Beneficiaire::where('BEN_CODE', $domiciliation->BEN_CODE)->first();

            DB::transaction(function () use ($domiciliation, $beneficiaire, $user, $nivValeur, $now) {

                $domiciliation->DOM_STATUT = 3;
                $domiciliation->save();
            });

            return response()->json(['message' => "Rejet effectué avec succès."]);
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

                if ($domiciliation->DOM_STATUT == 2) {
                    $results['failed'][] = ['DOM_CODE' => $domCode, 'reason' => 'Déjà approuvé.'];
                    continue;
                }

                $beneficiaire = Beneficiaire::where('BEN_CODE', $domiciliation->BEN_CODE)->first();

                $domiciliation->DOM_STATUT = 3;
                $domiciliation->save();

                $mvtCode = $this->generateMvtCode($user->REG_CODE);

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
            'message' => 'Rejet effectué avec succès.',
            'updated' => count($results['success']),
            'failed'  => $results['failed'],
            'success' => $results['success'],
        ]);
    }

    public function getMouvementsPaiementsEnCours()
    {
        // AJOUT 1 : utilisateur connecté
        $user = Auth::user();

        // AJOUT 2 : récupération du niveau
        $nivValeur = DB::table('t_niveau_validations')
            ->join('t_groupes', 't_groupes.NIV_CODE', '=', 't_niveau_validations.NIV_CODE')
            ->where('t_groupes.GRP_CODE', $user->GRP_CODE)
            ->value('NIV_VALEUR');

        //  Récupérer tous les mouvements
        $mouvements = Mouvement::query()
            ->join('t_beneficiaires', 't_beneficiaires.BEN_CODE', '=', 't_mouvements.MVT_BEN_CODE')
            ->join('t_paiements', 't_paiements.PAI_CODE', '=', 't_mouvements.MVT_PAI_CODE')

            // AJOUT 3 : jointure utilisateurs pour filtrer par régie
            ->join('t_utilisateurs', 't_utilisateurs.UTI_CODE', '=', 't_mouvements.MVT_UTI_CODE')

            ->leftJoin('t_type_beneficiaires', 't_type_beneficiaires.TYP_CODE', '=', 't_beneficiaires.TYP_CODE')
            ->leftJoin('t_fonctions', 't_fonctions.FON_CODE', '=', 't_beneficiaires.FON_CODE')
            ->leftJoin('t_grades', 't_grades.GRD_CODE', '=', 't_beneficiaires.GRD_CODE')
            ->leftJoin('t_positions', 't_positions.POS_CODE', '=', 't_beneficiaires.POS_CODE')
            ->where('t_paiements.PAI_STATUT', 1)
            ->where('t_mouvements.TYP_CODE', '20250002')

            // AJOUT 4 : filtre métier (niveau 2 uniquement)
            ->when($nivValeur == 2, function ($query) use ($user) {
                $query
                    ->where('t_mouvements.MVT_NIV', 1) // transmis par niveau 1
                    ->where('t_utilisateurs.REG_CODE', $user->REG_CODE); // même régie
            })

            ->orderBy('t_mouvements.MVT_DATE', 'desc')
            ->orderBy('t_mouvements.MVT_HEURE', 'desc')
            ->select([
                // ===== Mouvement =====
                't_mouvements.MVT_CODE',
                't_mouvements.MVT_DOM_CODE as DOM_CODE',
                't_mouvements.MVT_BEN_NOM_PRE',
                't_mouvements.MVT_BNQ_LIBELLE as BANQUE',
                't_mouvements.MVT_GUI_CODE as GUICHET',
                't_mouvements.MVT_NUMCPT as NUMCPT',
                't_mouvements.MVT_CLE_RIB as RIB',
                't_mouvements.MVT_DATE',
                't_mouvements.MVT_HEURE',
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
                't_beneficiaires.BEN_SEXE',
                't_beneficiaires.BEN_STATUT',

                // ===== Infos complémentaires =====
                't_type_beneficiaires.TYP_LIBELLE as TYPE_BENEFICIAIRE',
                't_fonctions.FON_LIBELLE as FONCTION',
                't_grades.GRD_LIBELLE as GRADE',
                't_positions.POS_LIBELLE as POSITION',
            ])
            ->get();

        //  Récupérer tous les détails de paiement en une seule requête
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
            ->groupBy('PAI_CODE'); // groupe par PAI_CODE pour lier aux mouvements

        //  Calculer les totaux pour chaque paiement
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
            ->keyBy('PAI_CODE'); // clé = PAI_CODE pour lier facilement

        //  Lier détails et totaux à chaque mouvement
        $mouvements = $mouvements->map(function ($mvt) use ($detailsPaiements, $totauxPaiements) {
            $paiCode = $mvt->PAI_CODE;

            // détails du paiement
            $mvt->details = $detailsPaiements[$paiCode] ?? [];

            // totaux
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

        return response()->json([
            'count' => $mouvements->count(),
            'data'  => $mouvements
        ]);
    }

    // Ajoutez cette méthode dans MouvementController
    private function getDomiciliationBeneficiaire($benCode)
    {
        return Domicilier::with(['banque', 'guichet'])
            ->where('BEN_CODE', $benCode)
            ->where('DOM_STATUT', 2) // seulement les domiciliations actives
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

            if ($paiement->PAI_STATUT == 2) {
                return response()->json(['message' => 'Ce paiement a déjà été approuvé.'], 400);
            }

            DB::transaction(function () use ($paiement, $user, $nivValeur, $now) {

                $domiciliation = $this->getDomiciliationBeneficiaire($paiement->BEN_CODE);

                if (!$domiciliation) {
                    throw new \Exception("Aucune domiciliation trouvée pour le bénéficiaire {$paiement->BEN_CODE}");
                }

                $paiement->PAI_STATUT = 2;
                $paiement->save();

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
                    'MVT_UTI_CODE'      => $user->UTI_CODE,
                    'MVT_CREER_PAR'     => $user->UTI_NOM." ".$user->UTI_PRENOM,
                    'TYP_CODE'        => '20250002',
                ]);

                HistoriquesValidation::create([
                    'VAL_CODE'        => $mvtCode,
                    'VAL_PAI_CODE'    => $paiement->PAI_CODE,
                    'VAL_BEN_CODE'    => $paiement->BEN_CODE,
                    'VAL_BEN_NOM_PRE' => $paiement->PAI_BENEFICIAIRE,
                    'VAL_BNQ_CODE'    => $domiciliation->BNQ_CODE,
                    'VAL_BNQ_LIBELLE' => $domiciliation->banque?->BNQ_LIBELLE,
                    'VAL_GUI_CODE'    => $domiciliation->guichet?->GUI_CODE,
                    'VAL_NUMCPT'      => $domiciliation->DOM_NUMCPT,
                    'VAL_CLE_RIB'     => $domiciliation->DOM_RIB,
                    'VAL_DATE'        => $now->toDateString(),
                    'VAL_HEURE'       => $now->toTimeString(),
                    'VAL_NIV'         => $nivValeur,
                    'VAL_UTI_CODE'    => $user->UTI_CODE,
                    'VAL_CREER_PAR'   => $user->UTI_NOM . ' ' . $user->UTI_PRENOM,
                    'MVT_CODE'        => $mvtCode,
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

                if (in_array($paiementItem->PAI_STATUT, [2])) {
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

                $paiementItem->PAI_STATUT = 2;
                $paiementItem->save();

                $mvtCode = $this->generateMvtCode($user->REG_CODE);

                Mouvement::create([
                    'MVT_CODE'        => $mvtCode,
                    'MVT_PAI_CODE'    => $paiementItem->PAI_CODE,
                    'MVT_BEN_CODE'    => $paiementItem->BEN_CODE,
                    'MVT_BEN_NOM_PRE' => $paiementItem->PAI_BENEFICIAIRE,
                    'MVT_BNQ_CODE'    => $domiciliation->BNQ_CODE,
                    'MVT_BNQ_LIBELLE' => $domiciliation->banque?->BNQ_LIBELLE,
                    'MVT_GUI_CODE'    => $domiciliation->guichet?->GUI_CODE,
                    'MVT_NUMCPT'      => $domiciliation->DOM_NUMCPT,
                    'MVT_CLE_RIB'     => $domiciliation->DOM_RIB,
                    'MVT_DATE'        => $now->toDateString(),
                    'MVT_HEURE'       => $now->toTimeString(),
                    'MVT_NIV'         => $nivValeur,
                    'MVT_UTI_CODE'      => $user->UTI_CODE,
                    'MVT_CREER_PAR'     => $user->UTI_NOM." ".$user->UTI_PRENOM,
                    'TYP_CODE'        => '20250002',
                ]);

                HistoriquesValidation::create([
                    'VAL_CODE'        => $mvtCode,
                    'VAL_PAI_CODE'    => $paiementItem->PAI_CODE,
                    'VAL_BEN_CODE'    => $paiementItem->BEN_CODE,
                    'VAL_BEN_NOM_PRE' => $paiementItem->PAI_BENEFICIAIRE,
                    'VAL_BNQ_CODE'    => $domiciliation->BNQ_CODE,
                    'VAL_BNQ_LIBELLE' => $domiciliation->banque?->BNQ_LIBELLE,
                    'VAL_GUI_CODE'    => $domiciliation->guichet?->GUI_CODE,
                    'VAL_NUMCPT'      => $domiciliation->DOM_NUMCPT,
                    'VAL_CLE_RIB'     => $domiciliation->DOM_RIB,
                    'VAL_DATE'        => $now->toDateString(),
                    'VAL_HEURE'       => $now->toTimeString(),
                    'VAL_NIV'         => $nivValeur,
                    'VAL_UTI_CODE'    => $user->UTI_CODE,
                    'VAL_CREER_PAR'   => $user->UTI_NOM . ' ' . $user->UTI_PRENOM,
                    'MVT_CODE'        => $mvtCode,
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

            DB::transaction(function () use ($paiement, $user, $nivValeur, $now) {

                $paiement->PAI_STATUT = 3;
                $paiement->save();
            });
            return response()->json(['message' => "Rejet effectué avec succès."]);
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

                $paiementItem->PAI_STATUT = 3;
                $paiementItem->save();

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
            'message' => 'Rejet effectué avec succès.',
            'updated' => count($results['success']),
            'failed' => $results['failed'],
            'success' => $results['success']
        ]);
    }

    public function validerBeneficiaireEtDomicilier(Request $request, $benCode = null)
    {
        $user = Auth::user();
        $now = Carbon::now();

        // récupération du niveau de validation
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
        $beneficiaireNonTransmis = $beneficiaire->BEN_STATUT != 1 && $beneficiaire->BEN_STATUT != 2;
        $domicilierNonTransmis = $dernierDomicilier && $dernierDomicilier->DOM_STATUT != 1 && $dernierDomicilier->DOM_STATUT != 2;

        $confirmed = $request->input('confirm', false);

        // Si ni le bénéficiaire ni le RIB n'ont été transmis, retourner info pour dialogue
        if (($beneficiaireNonTransmis || $domicilierNonTransmis) && !$confirmed) {
            $message = "Voulez-vous transmettre ";
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

        // Vérifier si un autre compte du même bénéficiaire est déjà en cours
        if ($dernierDomicilier) {
            $autreEnCours = Domicilier::where('BEN_CODE', $dernierDomicilier->BEN_CODE)
                ->where('DOM_STATUT', 1)
                ->where('DOM_CODE', '!=', $dernierDomicilier->DOM_CODE)
                ->exists();

            if ($autreEnCours) {
                return response()->json([
                    'message' => 'Un autre RIB de ce bénéficiaire est déjà en cours d’approbation.'
                ], 400);
            }
        }

        // ===== Transmission en BDD =====
        DB::transaction(function () use ($beneficiaire, $dernierDomicilier, $user, $nivValeur, $now) {

            // Valider bénéficiaire
            if ($beneficiaire->BEN_STATUT != 1 && $beneficiaire->BEN_STATUT != 2) {
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
                    'MVT_UTI_CODE'      => $user->UTI_CODE,
                    'MVT_CREER_PAR'     => $user->UTI_NOM." ".$user->UTI_PRENOM,
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
            }

            // Valider dernier RIB si non transmis
            if ($dernierDomicilier && $dernierDomicilier->DOM_STATUT != 1 && $dernierDomicilier->DOM_STATUT != 2) {                

                $dernierDomicilier->DOM_STATUT = 1;
                $dernierDomicilier->save();

                $mvtCode = $this->generateMvtCode($user->REG_CODE);

                Mouvement::create([
                    'MVT_CODE'          => $mvtCode,
                    'MVT_DOM_CODE'      => $dernierDomicilier->DOM_CODE,
                    'MVT_BEN_CODE'      => $beneficiaire->BEN_CODE,
                    'MVT_BEN_NOM_PRE'   => $beneficiaire->BEN_NOM. " " .$beneficiaire->BEN_PRENOM,
                    'MVT_BNQ_CODE'      => $dernierDomicilier->BNQ_CODE,
                    'MVT_BNQ_LIBELLE'   => $dernierDomicilier->banque?->BNQ_LIBELLE,
                    'MVT_GUI_CODE'      => $dernierDomicilier->guichet?->GUI_CODE,
                    'MVT_GUI_NOM'       => $dernierDomicilier->guichet?->GUI_NOM,
                    'MVT_NUMCPT'        => $dernierDomicilier->DOM_NUMCPT,
                    'MVT_CLE_RIB'       => $dernierDomicilier->DOM_RIB,
                    'MVT_DATE'          => $now->toDateString(),
                    'MVT_HEURE'         => $now->toTimeString(),
                    'MVT_NIV'           => $nivValeur,
                    'MVT_UTI_CODE'      => $user->UTI_CODE,
                    'MVT_CREER_PAR'     => $user->UTI_NOM." ".$user->UTI_PRENOM,
                    'TYP_CODE'          => '20250003', 
                ]);

                HistoriquesValidation::create([
                    'VAL_CODE'          => $mvtCode,
                    'VAL_DOM_CODE'      => $dernierDomicilier->DOM_CODE,
                    'VAL_BEN_CODE'      => $beneficiaire->BEN_CODE,
                    'VAL_BEN_NOM_PRE'   => $beneficiaire->BEN_NOM. " " .$beneficiaire->BEN_PRENOM,
                    'VAL_BNQ_CODE'      => $dernierDomicilier->BNQ_CODE,
                    'VAL_BNQ_LIBELLE'   => $dernierDomicilier->banque?->BNQ_LIBELLE,
                    'VAL_GUI_CODE'      => $dernierDomicilier->guichet?->GUI_CODE,
                    'VAL_GUI_NOM'       => $dernierDomicilier->guichet?->GUI_NOM,
                    'VAL_NUMCPT'        => $dernierDomicilier->DOM_NUMCPT,
                    'VAL_CLE_RIB'       => $dernierDomicilier->DOM_RIB,
                    'VAL_DATE'          => $now->toDateString(),
                    'VAL_HEURE'         => $now->toTimeString(),
                    'VAL_NIV'           => $nivValeur,
                    'VAL_UTI_CODE'      => $user->UTI_CODE,
                    'VAL_CREER_PAR'     => $user->UTI_NOM." ".$user->UTI_PRENOM,
                    'MVT_CODE'          => $mvtCode,
                ]);
            }
        });

        return response()->json(['message' => "Transmission à l'approbation réussie."]);
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
            ->where('t_beneficiaires.BEN_STATUT', 1)
            ->where('t_mouvements.TYP_CODE', '20250001')
            ->when($nivValeur == 2, function ($query) use ($user) {
                $query
                    ->where('t_mouvements.MVT_NIV', 1)
                    ->where('t_utilisateurs.REG_CODE', $user->REG_CODE);
            })
            ->count();

        /*
        |--------------------------------------------------------------------------
        | DOMICILIATIONS EN COURS (20250003)
        |--------------------------------------------------------------------------
        */
        $totalDomiciliers = Mouvement::query()
            ->join('t_domiciliers', 't_domiciliers.DOM_CODE', '=', 't_mouvements.MVT_DOM_CODE')
            ->join('t_utilisateurs', 't_utilisateurs.UTI_CODE', '=', 't_mouvements.MVT_UTI_CODE')
            ->where('t_domiciliers.DOM_STATUT', 1)
            ->where('t_mouvements.TYP_CODE', '20250003')
            ->when($nivValeur == 2, function ($query) use ($user) {
                $query
                    ->where('t_mouvements.MVT_NIV', 1)
                    ->where('t_utilisateurs.REG_CODE', $user->REG_CODE);
            })
            ->count();

        /*
        |--------------------------------------------------------------------------
        | PAIEMENTS EN COURS (20250002)
        |--------------------------------------------------------------------------
        */
        $totalPaiements = Mouvement::query()
            ->join('t_paiements', 't_paiements.PAI_CODE', '=', 't_mouvements.MVT_PAI_CODE')
            ->join('t_utilisateurs', 't_utilisateurs.UTI_CODE', '=', 't_mouvements.MVT_UTI_CODE')
            ->where('t_paiements.PAI_STATUT', 1)
            ->where('t_mouvements.TYP_CODE', '20250002')
            ->when($nivValeur == 2, function ($query) use ($user) {
                $query
                    ->where('t_mouvements.MVT_NIV', 1)
                    ->where('t_utilisateurs.REG_CODE', $user->REG_CODE);
            })
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
