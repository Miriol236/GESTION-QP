<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DetailsPaiement;
use Illuminate\Support\Facades\DB;

class DetailsPaiementController extends Controller
{
    public function showByPaiement($PAI_CODE)
    {
        //  Calcul des totaux (même logique que getAll)
        $totaux = DetailsPaiement::where('t_details_paiement.PAI_CODE', $PAI_CODE)
            ->join('t_elements', 't_elements.ELT_CODE', '=', 't_details_paiement.ELT_CODE')
            ->selectRaw('
                SUM(CASE WHEN t_elements.ELT_SENS = 1 THEN t_details_paiement.PAI_MONTANT ELSE 0 END) AS TOTAL_GAIN,
                SUM(CASE WHEN t_elements.ELT_SENS = 2 THEN t_details_paiement.PAI_MONTANT ELSE 0 END) AS TOTAL_RETENU,
                (
                    SUM(CASE WHEN t_elements.ELT_SENS = 1 THEN t_details_paiement.PAI_MONTANT ELSE 0 END)
                    -
                    SUM(CASE WHEN t_elements.ELT_SENS = 2 THEN t_details_paiement.PAI_MONTANT ELSE 0 END)
                ) AS MONTANT_NET
            ')
            ->first();

        //  Détails + ajout des totaux
        $data = DetailsPaiement::where('t_details_paiement.PAI_CODE', $PAI_CODE)
            ->join('t_elements', 't_elements.ELT_CODE', '=', 't_details_paiement.ELT_CODE')
            ->select(
                't_details_paiement.DET_CODE',
                't_details_paiement.PAI_MONTANT',
                't_details_paiement.ELT_CODE',
                't_details_paiement.PAI_CODE',
                't_elements.ELT_LIBELLE',
                't_elements.ELT_SENS'
            )
            ->orderBy('t_details_paiement.DET_CODE')
            ->get()
            ->map(function ($item) use ($totaux) {
                $item->TOTAL_GAIN   = $totaux->TOTAL_GAIN;
                $item->TOTAL_RETENU = $totaux->TOTAL_RETENU;
                $item->MONTANT_NET  = $totaux->MONTANT_NET;
                return $item;
            });

        return response()->json($data);
    }

    public function store(Request $request)
    {
        $request->validate([
            'ELT_CODE' => 'required|string|exists:t_elements,ELT_CODE',
            'PAI_CODE' => 'required|string|exists:t_paiements,PAI_CODE',
            'PAI_MONTANT' => 'required|string',
        ]);

        // Vérifier doublon
        $exists = DetailsPaiement::where('ELT_CODE', $request->ELT_CODE)
            ->where('PAI_CODE', $request->PAI_CODE)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => "Cet élément est déjà associé à ce paiement (ou échéance).",
            ], 409);
        }

        // Récupérer l'échéance
        $paiement = DB::table('t_paiements')->where('PAI_CODE', $request->PAI_CODE)->first();

        if (!$paiement) {
            return response()->json(['message' => 'Paiement introuvable.'], 404);
        }

        $echCode = $paiement->ECH_CODE;

        // Récupérer le dernier DET_CODE existant pour cette ECH_CODE
        $last = DB::table('t_details_paiement')
            ->join('t_paiements', 't_paiements.PAI_CODE', '=', 't_details_paiement.PAI_CODE')
            ->where('t_paiements.ECH_CODE', $echCode)
            ->orderByRaw('CAST(t_details_paiement.DET_CODE AS UNSIGNED) DESC')
            ->value('t_details_paiement.DET_CODE');

        if ($last) {
            $lastOrder = intval(substr($last, -6));
            $numeroOrdre = str_pad($lastOrder + 1, 6, '0', STR_PAD_LEFT);
        } else {
            $numeroOrdre = "000001";
        }

        $detCode = $echCode . $numeroOrdre;

        // Enregistrement
        $detailsPaiement = new DetailsPaiement();
        $detailsPaiement->DET_CODE = $detCode;
        $detailsPaiement->PAI_MONTANT = $request->PAI_MONTANT;
        $detailsPaiement->ELT_CODE = $request->ELT_CODE;
        $detailsPaiement->PAI_CODE = $request->PAI_CODE;
        $detailsPaiement->save();

        return response()->json([
            'message' => 'Détail de paiement enregistré avec succès',
            'DET_CODE' => $detailsPaiement->DET_CODE,
        ]);
    }

    public function update(Request $request, $DET_CODE)
    {
        $detailsPaiement = DetailsPaiement::find($DET_CODE);

        if (!$detailsPaiement) {
            return response()->json(['message' => 'Détails de paiement introuvable.'], 404);
        }

        $request->validate([
            'ELT_CODE' => 'required|string|exists:t_elements,ELT_CODE',
            'PAI_MONTANT' => 'required|string',
        ]);

        //  Mise à jour
        $detailsPaiement->update([
            'ELT_CODE'   => $request->ELT_CODE,
            'PAI_MONTANT' => $request->PAI_MONTANT,
        ]);

        return response()->json([
            'message' => 'Détails de paiement mis à jour avec succès',
            'DET_CODE' => $detailsPaiement->DET_CODE,
        ]);
    }

    
    public function destroy($DET_CODE)
    {
        $detailsPaiement = DetailsPaiement::where('DET_CODE', $DET_CODE)->first();
        if (!$detailsPaiement) {
            return response()->json(['message' => 'Détails de paiement introuvable'], 404);
        }

        try {
            $detailsPaiement->delete();
            return response()->json(['message' => 'Détails de paiement supprimés avec succès']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Impossible de supprimer : ' . $e->getMessage()], 409);
        }
    }

    public function getTotalsByUser(Request $request)
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non authentifié.'], 401);
        }

        $ech = $request->input('ech_code');
        $reg = $request->input('reg_code');
        $statut = $request->input('statut'); // <-- NOUVEAU

        if (empty($ech)) {
            $currentEcheance = DB::table('t_echeances')
                ->where('ECH_STATUT', true)
                ->orderBy('ECH_CODE', 'desc')
                ->first();

            $ech = $currentEcheance?->ECH_CODE;
        }

        // -------- Requête de base ----------
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
        // statut = "all" | 1 | 0
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

        $tauxPaiement = ($totalNet > 0)
            ? round(($totalPaye / $totalNet) * 100, 2)
            : 0;

        return response()->json([
            'total_gain'     => $totalGain,
            'total_retenu'   => $totalRetenu,
            'total_net'      => $totalNet,
            'total_paye'     => $totalPaye,
            'taux_paiement'  => $tauxPaiement,
            'ech_code'       => $ech,
            'reg_code'       => $reg,
            'statut'         => $statut, // <-- renvoyé au front
        ]);
    }
}
