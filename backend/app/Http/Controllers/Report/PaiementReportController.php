<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Paiement;
use App\Models\Echeance;
use App\Models\Regie;
use App\Models\TypeBeneficiaire;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Mpdf\Mpdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\PaiementsExport;
use Mpdf\QrCode\QrCode; // Si tu veux la classe QR mPDF (optionnel)

class PaiementReportController extends Controller
{
    public function filters()
    {
        return Cache::remember('paiement_filters', now()->addMinutes(30), function () {

            return response()->json([
                'echeances' => \App\Models\Echeance::select('ECH_CODE', 'ECH_LIBELLE')
                    ->orderByDesc('ECH_CODE')
                    ->get(),

                'regies' => \App\Models\Regie::select('REG_CODE', 'REG_LIBELLE', 'REG_SIGLE')
                    ->get(),

                'types' => \App\Models\TypeBeneficiaire::select('TYP_CODE', 'TYP_LIBELLE')
                    ->orderBy('TYP_LIBELLE')
                    ->get(),
            ]);
        });
    }

    public function exportEtatGlobal(Request $request)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Utilisateur non authentifié.'], 401);
        }

        $format = $request->query('format', 'pdf');
        $echCode = $request->query('ech_code');
        $typCode = $request->query('typ_code'); // type filtré
        $regCode = $request->query('reg_code'); // régie filtrée

        /* =============================
           SOUS REQUETE TOTAUX
        =============================*/
        $totauxSub = DB::table('t_details_paiement')
            ->join('t_elements', 't_elements.ELT_CODE', '=', 't_details_paiement.ELT_CODE')
            ->select(
                't_details_paiement.PAI_CODE',
                DB::raw('SUM(CASE WHEN t_elements.ELT_SENS = 1 THEN t_details_paiement.PAI_MONTANT ELSE 0 END) AS BRUT'),
                DB::raw('SUM(CASE WHEN t_elements.ELT_SENS = 2 THEN t_details_paiement.PAI_MONTANT ELSE 0 END) AS RETENU'),
                DB::raw('(SUM(CASE WHEN t_elements.ELT_SENS = 1 THEN t_details_paiement.PAI_MONTANT ELSE 0 END)
                        - SUM(CASE WHEN t_elements.ELT_SENS = 2 THEN t_details_paiement.PAI_MONTANT ELSE 0 END)) AS NET')
            )
            ->groupBy('t_details_paiement.PAI_CODE');

        /* =============================
           REQUETE PRINCIPALE
        =============================*/
        $query = Paiement::query()
            ->join('t_beneficiaires', 't_beneficiaires.BEN_CODE', '=', 't_paiements.BEN_CODE')
            ->leftJoin('t_fonctions', 't_fonctions.FON_CODE', '=', 't_beneficiaires.FON_CODE')
            ->leftJoin('t_type_beneficiaires', 't_type_beneficiaires.TYP_CODE', '=', 't_beneficiaires.TYP_CODE')
            ->leftJoin('t_domiciliers', function ($join) {
                $join->on('t_domiciliers.BEN_CODE', '=', 't_beneficiaires.BEN_CODE')
                     ->whereIn('t_domiciliers.DOM_STATUT', [2,3]);
            })
            ->leftJoin('t_banques', 't_banques.BNQ_CODE', '=', 't_domiciliers.BNQ_CODE')
            ->leftJoin('t_guichets', 't_guichets.GUI_ID', '=', 't_domiciliers.GUI_ID')
            ->leftJoinSub($totauxSub, 'totaux', function ($join) {
                $join->on('totaux.PAI_CODE', '=', 't_paiements.PAI_CODE');
            })
            ->select([
                't_paiements.PAI_CODE',
                't_fonctions.FON_LIBELLE as FONCTION',
                't_beneficiaires.BEN_CODE',
                DB::raw("CONCAT(t_beneficiaires.BEN_NOM,' ',t_beneficiaires.BEN_PRENOM) as BENEFICIAIRE"),
                't_type_beneficiaires.TYP_LIBELLE as TYPE_BENEFICIAIRE',
                't_banques.BNQ_LIBELLE',
                't_guichets.GUI_CODE',
                DB::raw("
                    CONCAT(
                        COALESCE(t_domiciliers.DOM_NUMCPT, ''),
                        CASE WHEN t_domiciliers.DOM_NUMCPT IS NOT NULL THEN ' - ' ELSE '-' END,
                        COALESCE(t_domiciliers.DOM_RIB, '')
                    ) as NUMCPT
                "),
                'totaux.BRUT',
                'totaux.NET',
            ])
            ->when(
                $user->REG_CODE,
                fn ($q) => $q->where('t_paiements.REG_CODE', $user->REG_CODE),
                fn ($q) => $q->when(
                    $regCode,
                    fn ($qq) => $qq->where('t_paiements.REG_CODE', $regCode)
                )
            )
            ->when($echCode, fn($q) => $q->where('t_paiements.ECH_CODE', $echCode))
            ->when($typCode, fn($q) => $q->where('t_beneficiaires.TYP_CODE', $typCode))
            ->orderBy('t_fonctions.FON_LIBELLE')
            ->orderBy('BENEFICIAIRE');

        $paiements = $query->get();

        if ($paiements->isEmpty()) {
            return response()->json(['message' => 'Aucun paiement trouvé'], 404);
        }

        /* =============================
           GROUPEMENT PAR FONCTION
        =============================*/
        $paiementsParFonction = $paiements->groupBy('FONCTION');
        $totauxGlobaux = ['effectif' => 0, 'brut' => 0, 'net' => 0];

        foreach ($paiementsParFonction as $fonction => $rows) {
            $effectif = $rows->count();
            $brut = $rows->sum('BRUT');
            $net = $rows->sum('NET');

            $paiementsParFonction[$fonction] = collect([
                'rows' => $rows,
                'effectif' => $effectif,
                'total_brut' => $brut,
                'total_net' => $net,
            ]);

            $totauxGlobaux['effectif'] += $effectif;
            $totauxGlobaux['brut'] += $brut;
            $totauxGlobaux['net'] += $net;
        }

        /* =============================
           Helpers pour noms fichiers
        =============================*/
        function cleanFilename($string) {
            return strtoupper(preg_replace('/[^A-Za-z0-9_]/', '_', $string));
        }

        $echLibelle = DB::table('t_echeances')
            ->where('ECH_CODE', $echCode)
            ->value('ECH_LIBELLE');
        $echSlug = cleanFilename($echLibelle ?? 'ECHEANCE');

        // Récupérer le sigle de régie
        if ($user->REG_CODE) {
            $regSigle = DB::table('t_regies')
                ->where('REG_CODE', $user->REG_CODE)
                ->value('REG_SIGLE');
            $regSlug = cleanFilename($regSigle ?? 'REGIE');
        } elseif ($regCode) {
            $regSigle = DB::table('t_regies')
                ->where('REG_CODE', $regCode)
                ->value('REG_SIGLE');
            $regSlug = cleanFilename($regSigle ?? 'REGIE');
        } else {
            $regSlug = 'TOUTES_LES_REGIES';
        }

        /* =============================
           EXPORT EXCEL
        =============================*/
        if ($format === 'excel') {
            $excelPaiements = collect();
            foreach ($paiementsParFonction as $fonction => $bloc) {
                foreach ($bloc['rows'] as $p) {
                    $p->FONCTION = $fonction;
                    $excelPaiements->push($p);
                }
            }

            return Excel::download(
                new PaiementsExport($excelPaiements, $totauxGlobaux),
                "paiements_{$echSlug}_{$regSlug}.xlsx"
            );
        }

        /* =============================
           EXPORT PDF
        =============================*/
        ini_set('pcre.backtrack_limit', 10000000);

        $mpdf = new Mpdf([
            'format' => 'A4-L',
            'margin_left' => 10,
            'margin_right' => 10,
            'margin_top' => 25,
            'margin_bottom' => 20,
        ]);

        // Récupérer le libellé complet de régie pour affichage dans le PDF
        if ($user->REG_CODE) {
            $regieLibelle = DB::table('t_regies')
                ->where('REG_CODE', $user->REG_CODE)
                ->value('REG_LIBELLE');
        } elseif ($regCode) {
            $regieLibelle = DB::table('t_regies')
                ->where('REG_CODE', $regCode)
                ->value('REG_LIBELLE');
        } else {
            $regieLibelle = 'TOUTES LES RÉGIES';
        }

        $html = view('exports.paiements', [
            'paiementsParFonction' => $paiementsParFonction,
            'totauxGlobaux'        => $totauxGlobaux,
            'echLibelle'           => $echLibelle,
            'regieLibelle'         => $regieLibelle,
        ])->render();

        // Texte dynamique pour QR Code
        $qrText = "ETAT DES PAIEMENTS DES QUOTES-PARTS\n";
        $qrText .= "Échéance : " . ($echLibelle ?? '-') . "\n";
        $qrText .= "Régie : " . ($regieLibelle ?? 'TOUTES') . "\n";
        $qrText .= "Total général (" . $totauxGlobaux['effectif'] . " bénéficiaire(s))\n";
        $qrText .= "Montant Brut : " . number_format($totauxGlobaux['brut'], 0, ',', ' ') . "\n";
        $qrText .= "Montant Net : " . number_format($totauxGlobaux['net'], 0, ',', ' ');

        // Ajouter QR code à la fin du PDF
        // paramètres : texte, type QR, x, y (null pour courant), largeur, hauteur, couleur, style

        $mpdf->WriteHTML($html);
        $pdfContent = $mpdf->Output('', 'S');

        $pdfFilename = "PAIEMENTS_QP_{$echSlug}_{$regSlug}.pdf";

        return response($pdfContent, 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="'.$pdfFilename.'"');
    }
}