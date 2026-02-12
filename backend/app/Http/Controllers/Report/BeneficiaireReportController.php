<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Beneficiaire;
use Illuminate\Support\Facades\DB;
use Mpdf\Mpdf;
use App\Exports\BeneficiairesExport;
use Maatwebsite\Excel\Facades\Excel;

class BeneficiaireReportController extends Controller
{
    public function export()
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Utilisateur non authentifié.'], 401);
        }

        $format = request('format', 'pdf');

        // -----------------------------
        // Base query
        // -----------------------------
        $typCode = request('TYP_CODE'); // récupère le filtre côté frontend

        $query = Beneficiaire::query()
            ->leftJoin('t_domiciliers', function ($join) {
                $join->on('t_domiciliers.BEN_CODE', '=', 't_beneficiaires.BEN_CODE')
                    ->whereIn('t_domiciliers.DOM_STATUT', [0,1,2,3]);
            })
            ->leftJoin('t_banques', 't_banques.BNQ_CODE', '=', 't_domiciliers.BNQ_CODE')
            ->leftJoin('t_guichets', 't_guichets.GUI_ID', '=', 't_domiciliers.GUI_ID')
            ->leftJoin('t_type_beneficiaires', 't_type_beneficiaires.TYP_CODE', '=', 't_beneficiaires.TYP_CODE')
            ->leftJoin('t_fonctions', 't_fonctions.FON_CODE', '=', 't_beneficiaires.FON_CODE')
            ->leftJoin('t_grades', 't_grades.GRD_CODE', '=', 't_beneficiaires.GRD_CODE')
            ->where('t_beneficiaires.BEN_STATUT', 3);

        // Filtrer par type si fourni
        if ($typCode) {
            $query->where('t_beneficiaires.TYP_CODE', $typCode);
        }

        $beneficiaires = $query->select([
            't_beneficiaires.BEN_CODE as CODE',
            't_beneficiaires.BEN_MATRICULE as MATRICULE',
            DB::raw("CONCAT(t_beneficiaires.BEN_NOM, ' ', t_beneficiaires.BEN_PRENOM) as BENEFICIAIRE"),
            't_beneficiaires.BEN_SEXE as SEXE',
            't_beneficiaires.BEN_DATE_NAISSANCE as DATE_NAISSANCE',
            't_type_beneficiaires.TYP_LIBELLE as TYPE_BENEFICIAIRE',
            't_fonctions.FON_LIBELLE as FONCTION',
            't_grades.GRD_LIBELLE as GRADE',
            't_banques.BNQ_CODE',
            't_banques.BNQ_LIBELLE as BANQUE',
            't_guichets.GUI_CODE as GUICHET',
            't_domiciliers.DOM_NUMCPT',
            't_domiciliers.DOM_RIB',
            't_domiciliers.DOM_STATUT as STATUT_RIB',
        ])->orderBy('t_beneficiaires.BEN_NOM', 'asc')->get();

        // Formater NUMERO_DE_COMPTE
        $beneficiaires->transform(function ($r) {
            $r->NUMERO_DE_COMPTE = trim(($r->DOM_NUMCPT ? $r->DOM_NUMCPT . ' ' : '') . ($r->DOM_RIB ?? ''));
            unset($r->DOM_NUMCPT, $r->DOM_RIB);
            return $r;
        });

        if ($beneficiaires->isEmpty()) {
            return response()->json(['message' => 'Aucun bénéficiaire trouvé'], 404);
        }

        // -----------------------------
        // Regrouper et garder le dernier statut RIB
        // -----------------------------
        $beneficiaires = $beneficiaires->groupBy('CODE',)->map(function ($group) {
            return $group->sortByDesc('STATUT_RIB')->first();
        })->values();

        // -----------------------------
        // Export Excel
        // -----------------------------
        if ($format === 'excel') {
            return Excel::download(new BeneficiairesExport($beneficiaires), 'beneficiaires.xlsx');
        }

        // -----------------------------
        // Export PDF avec mPDF via Blade
        // -----------------------------
        ini_set('pcre.backtrack_limit', 10000000);

        $mpdf = new Mpdf([
            'format' => 'A4-L',
            'margin_left' => 10,
            'margin_right' => 10,
            'margin_top' => 25,
            'margin_bottom' => 20,
        ]);

        // On écrit tout le Blade en une seule fois, pas besoin de header/footer ici
        $html = view('exports.beneficiaires', ['beneficiaires' => $beneficiaires])->render();
        $mpdf->WriteHTML($html);

        $pdfContent = $mpdf->Output('', 'S');

        return response($pdfContent, 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="beneficiaires.pdf"');
    }
}