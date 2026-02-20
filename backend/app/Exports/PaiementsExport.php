<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\Exportable;

class PaiementsExport implements FromCollection, WithHeadings
{
    use Exportable;

    protected $paiements;

    public function __construct($paiements)
    {
        $this->paiements = $paiements;
    }

    public function collection()
    {
        return $this->paiements->map(function ($p) {

            return [
                'CODE'          => $p->BEN_CODE ?? '',
                'BENEFICIAIRE'  => $p->BENEFICIAIRE ?? '',
                'FONCTION'      => $p->FONCTION ?? '',
                'TYPE'          => $p->TYPE_BENEFICIAIRE ?? '',
                'BNQ_LIBELLE'   => $p->BNQ_LIBELLE ?? '',
                'GUI_CODE'      => $p->GUI_CODE ?? '',
                'NUMCPT'        => $p->NUMCPT ?? '',
                'CLE_RIB'        => $p->CLE_RIB ?? '',
                'MONTANT_BRUT'  => $p->BRUT ?? 0,
                'MONTANT_NET'   => $p->NET ?? 0,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'CODE',
            'BENEFICIAIRE',
            'FONCTION',
            'TYPE BENEFICIAIRE',
            'BANQUE',
            'GUICHET',
            'N° COMPTE',
            'CLE RIB',
            'MONTANT BRUT',
            'MONTANT NET',
        ];
    }
}