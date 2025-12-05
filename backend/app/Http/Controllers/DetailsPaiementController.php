<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DetailsPaiement;
use Illuminate\Support\Facades\DB;

class DetailsPaiementController extends Controller
{
    public function showByPaiement($PAI_CODE)
    {
        $data = DetailsPaiement::where('PAI_CODE', $PAI_CODE)
            ->join('T_ELEMENTS', 'T_ELEMENTS.ELT_CODE', '=', 'T_DETAILS_PAIEMENT.ELT_CODE')
            ->select(
                'T_DETAILS_PAIEMENT.*',
                'T_ELEMENTS.ELT_LIBELLE',
                'T_ELEMENTS.ELT_SENS',
            )
            ->orderBy('T_DETAILS_PAIEMENT.DET_CODE')
            ->get();

        return response()->json($data);
    }

    public function store(Request $request)
    {
        $request->validate([
            'ELT_CODE' => 'required|string|exists:T_ELEMENTS,ELT_CODE',
            'PAI_CODE' => 'required|string|exists:T_PAIEMENTS,PAI_CODE',
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
        $paiement = DB::table('T_PAIEMENTS')->where('PAI_CODE', $request->PAI_CODE)->first();

        if (!$paiement) {
            return response()->json(['message' => 'Paiement introuvable.'], 404);
        }

        $echCode = $paiement->ECH_CODE;

        // Récupérer le dernier DET_CODE existant pour cette ECH_CODE
        $last = DB::table('T_DETAILS_PAIEMENT')
            ->join('T_PAIEMENTS', 'T_PAIEMENTS.PAI_CODE', '=', 'T_DETAILS_PAIEMENT.PAI_CODE')
            ->where('T_PAIEMENTS.ECH_CODE', $echCode)
            ->orderByRaw('CAST(T_DETAILS_PAIEMENT.DET_CODE AS UNSIGNED) DESC')
            ->value('T_DETAILS_PAIEMENT.DET_CODE');

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
            'ELT_CODE' => 'required|string|exists:T_ELEMENTS,ELT_CODE',
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
        $reg = $request->input('reg_code'); // <-- nouveau paramètre

        if (empty($ech)) {
            $currentEcheance = DB::table('T_ECHEANCES')
                ->where('ECH_STATUT', true)
                ->orderBy('ECH_CODE', 'desc')
                ->first();

            $ech = $currentEcheance?->ECH_CODE;
        }

        // ---- Regrouper les détails par paiement ----
        $paiements = DB::table('T_DETAILS_PAIEMENT')
            ->join('T_ELEMENTS', 'T_ELEMENTS.ELT_CODE', '=', 'T_DETAILS_PAIEMENT.ELT_CODE')
            ->join('T_PAIEMENTS', 'T_PAIEMENTS.PAI_CODE', '=', 'T_DETAILS_PAIEMENT.PAI_CODE')
            ->select(
                'T_PAIEMENTS.PAI_CODE',
                'T_PAIEMENTS.PAI_STATUT',
                'T_PAIEMENTS.ECH_CODE',
                'T_PAIEMENTS.REG_CODE',
                DB::raw('SUM(CASE WHEN T_ELEMENTS.ELT_SENS = 1 THEN T_DETAILS_PAIEMENT.PAI_MONTANT ELSE 0 END) AS GAIN'),
                DB::raw('SUM(CASE WHEN T_ELEMENTS.ELT_SENS = 2 THEN T_DETAILS_PAIEMENT.PAI_MONTANT ELSE 0 END) AS RETENU')
            )
            ->groupBy(
                'T_PAIEMENTS.PAI_CODE',
                'T_PAIEMENTS.PAI_STATUT',
                'T_PAIEMENTS.ECH_CODE',
                'T_PAIEMENTS.REG_CODE'
            );

        // ---- Filtre régie ----
        if (!empty($reg)) {
            $paiements->where('T_PAIEMENTS.REG_CODE', $reg);
        } elseif (!empty($user->REG_CODE)) {
            $paiements->where('T_PAIEMENTS.REG_CODE', $user->REG_CODE);
        }

        // ---- Filtre échéance ----
        if (!empty($ech)) {
            $paiements->where('T_PAIEMENTS.ECH_CODE', $ech);
        }

        $list = $paiements->get();

        // ---- Calcul des totaux ----
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
            'reg_code'       => $reg, // on renvoie le code régie filtré
        ]);
    }

}
