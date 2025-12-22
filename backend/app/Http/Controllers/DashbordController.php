<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


class DashbordController extends Controller
{
    public function getTotalsByUser(Request $request)
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non authentifié.'], 401);
        }

        $ech = $request->input('ech_code');
        $reg = $request->input('reg_code');
        $statut = $request->input('statut');

        if (empty($ech)) {
            $currentEcheance = DB::table('t_echeances')
                ->where('ECH_STATUT', true)
                ->orderBy('ECH_CODE', 'desc')
                ->first();

            $ech = $currentEcheance?->ECH_CODE;
        }

        // -------- Requête de base pour les paiements ----------
        $paiements = DB::table('t_details_paiement')
            ->join('t_elements', 't_elements.ELT_CODE', '=', 't_details_paiement.ELT_CODE')
            ->join('t_paiements', 't_paiements.PAI_CODE', '=', 't_details_paiement.PAI_CODE')
            ->select(
                't_paiements.PAI_CODE',
                't_paiements.PAI_STATUT',
                't_paiements.ECH_CODE',
                't_paiements.REG_CODE',
                DB::raw('SUM(CASE WHEN t_elements.ELT_SENS = 1 THEN t_details_paiement.PAI_MONTANT ELSE 0 END) AS GAIN'),
                DB::raw('SUM(CASE WHEN t_elements.ELT_SENS = 2 THEN t_details_paiement.PAI_MONTANT ELSE 0 END) AS RETENU')
            )
            ->groupBy(
                't_paiements.PAI_CODE',
                't_paiements.PAI_STATUT',
                't_paiements.ECH_CODE',
                't_paiements.REG_CODE'
            );

        // -------- Filtre régie ----------
        if (!empty($reg)) {
            $paiements->where('t_paiements.REG_CODE', $reg);
        } elseif (!empty($user->REG_CODE)) {
            $paiements->where('t_paiements.REG_CODE', $user->REG_CODE);
        }

        // -------- Filtre échéance ----------
        if (!empty($ech)) {
            $paiements->where('t_paiements.ECH_CODE', $ech);
        }

        // -------- Filtre statut ----------
        if ($statut !== null && $statut !== "all") {
            $paiements->where('t_paiements.PAI_STATUT', intval($statut));
        }

        $list = $paiements->get();

        // -------- Totaux ----------
        $totalGain = 0;
        $totalRetenu = 0;
        $totalNet = 0;
        $totalPaye = 0;

        foreach ($list as $p) {
            $gain = $p->GAIN ?? 0;
            $retenu = $p->RETENU ?? 0;
            $net = $gain - $retenu;

            $totalGain += $gain;
            $totalRetenu += $retenu;
            $totalNet += $net;

            if ($p->PAI_STATUT == 1) {
                $totalPaye += $net;
            }
        }

        $resteAPayer = $totalNet - $totalPaye;
        $tauxPaiement = ($totalNet > 0) ? round(($totalPaye / $totalNet) * 100, 2) : 0;
        $tauxResteAPayer = ($totalNet > 0) ? round(($resteAPayer / $totalNet) * 100, 2) : 0;

        // -------- Total des bénéficiaires distincts ----------
        $totalBeneficiaires = DB::table('t_paiements')
            ->when(!empty($reg), fn($q) => $q->where('REG_CODE', $reg))
            ->when(empty($reg) && !empty($user->REG_CODE), fn($q) => $q->where('REG_CODE', $user->REG_CODE))
            ->when(!empty($ech), fn($q) => $q->where('ECH_CODE', $ech))
            ->when($statut !== null && $statut !== "all", fn($q) => $q->where('PAI_STATUT', intval($statut)))
            ->distinct('BEN_CODE')
            ->count('BEN_CODE');

        return response()->json([
            'total_beneficiaires'=> $totalBeneficiaires,
            'total_gain'         => $totalGain,
            'total_retenu'       => $totalRetenu,
            'total_net'          => $totalNet,
            'total_paye'         => $totalPaye,
            'reste_a_payer'      => $resteAPayer,
            'taux_paiement'      => $tauxPaiement,
            'taux_reste_a_payer' => $tauxResteAPayer,
            'ech_code'           => $ech,
            'reg_code'           => $reg,
            'statut'             => $statut,
        ]);
    }

    public function getTotalsByRegie(Request $request)
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non authentifié.'], 401);
        }

        $ech    = $request->input('ech_code');
        $reg    = $request->input('reg_code');
        $statut = $request->input('statut');

        // Échéance courante
        if (empty($ech)) {
            $currentEcheance = DB::table('t_echeances')
                ->where('ECH_STATUT', true)
                ->orderByDesc('ECH_CODE')
                ->first();

            $ech = $currentEcheance?->ECH_CODE;
        }

        // =====================================================
        // Gain / Retenu PAR PAIEMENT (même logique User)
        // =====================================================
        $paiements = DB::table('t_details_paiement')
            ->join('t_elements', 't_elements.ELT_CODE', '=', 't_details_paiement.ELT_CODE')
            ->join('t_paiements', 't_paiements.PAI_CODE', '=', 't_details_paiement.PAI_CODE')
            ->join('t_regies', 't_regies.REG_CODE', '=', 't_paiements.REG_CODE')
            ->select(
                't_regies.REG_SIGLE',
                't_paiements.PAI_CODE',
                DB::raw('SUM(CASE WHEN t_elements.ELT_SENS = 1 THEN t_details_paiement.PAI_MONTANT ELSE 0 END) AS GAIN'),
                DB::raw('SUM(CASE WHEN t_elements.ELT_SENS = 2 THEN t_details_paiement.PAI_MONTANT ELSE 0 END) AS RETENU')
            )
            ->groupBy(
                't_regies.REG_SIGLE',
                't_paiements.PAI_CODE'
            );

        // =====================================================
        // Filtres identiques
        // =====================================================
        if (!empty($reg)) {
            $paiements->where('t_paiements.REG_CODE', $reg);
        } elseif (!empty($user->REG_CODE)) {
            $paiements->where('t_paiements.REG_CODE', $user->REG_CODE);
        }

        if (!empty($ech)) {
            $paiements->where('t_paiements.ECH_CODE', $ech);
        }

        if ($statut !== null && $statut !== "all") {
            $paiements->where('t_paiements.PAI_STATUT', intval($statut));
        }

        $list = $paiements->get();

        // =====================================================
        // Totaux par régie (GAIN + NET)
        // =====================================================
        $result = [];

        foreach ($list as $p) {
            $regie  = $p->REG_SIGLE;
            $gain   = $p->GAIN ?? 0;
            $retenu = $p->RETENU ?? 0;
            $net    = $gain - $retenu;

            if (!isset($result[$regie])) {
                $result[$regie] = [
                    'total_gain' => 0,
                    'total_net'  => 0,
                ];
            }

            $result[$regie]['total_gain'] += $gain;
            $result[$regie]['total_net']  += $net;
        }

        // =====================================================
        //  Format final (API / Pie / Bar)
        // =====================================================
        $data = collect($result)->map(function ($totaux, $regie) {
            return [
                'regie'      => $regie,
                'total_gain' => (float) $totaux['total_gain'],
                'total_net'  => (float) $totaux['total_net'],
            ];
        })->values();

        return response()->json($data);
    }
}