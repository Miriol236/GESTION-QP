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

        //  Vérifie si cet élément existe déjà pour la même échéance
        $exists = DetailsPaiement::where('ELT_CODE', $request->ELT_CODE)
            ->where('PAI_CODE', $request->PAI_CODE)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => "Cet élément est déjà associé à ce paiement (ou échéance).",
            ], 409);
        }

        //  Enregistrement
        $detailsPaiement = new DetailsPaiement();
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

        // Paramètre optionnel envoyé depuis le front
        $ech = $request->input('ech_code');

        // Si aucun ech_code fourni, récupérer l’échéance en cours (statut = true)
        if (empty($ech)) {
            $currentEcheance = DB::table('T_ECHEANCES')
                ->where('ECH_STATUT', true)
                ->orderBy('ECH_CODE', 'desc')
                ->first();

            $ech = $currentEcheance?->ECH_CODE ?? null;
        }

        $query = DB::table('T_DETAILS_PAIEMENT')
            ->join('T_ELEMENTS', 'T_ELEMENTS.ELT_CODE', '=', 'T_DETAILS_PAIEMENT.ELT_CODE')
            ->join('T_PAIEMENTS', 'T_PAIEMENTS.PAI_CODE', '=', 'T_DETAILS_PAIEMENT.PAI_CODE')
            ->select(
                DB::raw('SUM(CASE WHEN T_ELEMENTS.ELT_SENS = 1 THEN T_DETAILS_PAIEMENT.PAI_MONTANT ELSE 0 END) AS TOTAL_GAIN'),
                DB::raw('SUM(CASE WHEN T_ELEMENTS.ELT_SENS = 2 THEN T_DETAILS_PAIEMENT.PAI_MONTANT ELSE 0 END) AS TOTAL_RETENU'),
                DB::raw('SUM(CASE WHEN T_ELEMENTS.ELT_SENS = 1 THEN T_DETAILS_PAIEMENT.PAI_MONTANT ELSE 0 END) -
                        SUM(CASE WHEN T_ELEMENTS.ELT_SENS = 2 THEN T_DETAILS_PAIEMENT.PAI_MONTANT ELSE 0 END) AS TOTAL_NET')
            );

        // Filtrer par régie si user a REG_CODE
        if (!empty($user->REG_CODE)) {
            $query->where('T_PAIEMENTS.REG_CODE', $user->REG_CODE);
        }

        // Filtrer par échéance si disponible
        if (!empty($ech)) {
            $query->where('T_PAIEMENTS.ECH_CODE', $ech);
        }

        $totals = $query->first();

        return response()->json([
            'total_gain'   => $totals->TOTAL_GAIN ?? 0,
            'total_retenu' => $totals->TOTAL_RETENU ?? 0,
            'total_net'    => $totals->TOTAL_NET ?? 0,
            'ech_code'     => $ech, // optionnel, pour savoir quelle échéance est affichée par défaut
        ]);
    }
}
