<?php
namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\Exportable;

class BeneficiairesExport implements FromCollection, WithHeadings
{
    use Exportable;

    protected $beneficiaires;

    public function __construct($beneficiaires)
    {
        $this->beneficiaires = $beneficiaires;
    }

    public function collection()
    {
        // Ici on peut reformater la collection pour correspondre exactement au PDF
        return $this->beneficiaires->map(function($b) {
            return [
                'CODE'      => $b->CODE,
                'MATRICULE' => $b->MATRICULE,
                'BENEFICIAIRE' => $b->BENEFICIAIRE,
                'SEXE' => $b->SEXE,
                'TYPE' => $b->TYPE_BENEFICIAIRE,
                'FONCTION' => $b->FONCTION,
                'GRADE' => $b->GRADE,
                'BANQUE' => $b->BANQUE,
                'GUICHET' => $b->GUICHET,
                'NUMERO_DE_COMPTE' => $b->NUMERO_DE_COMPTE,
                'RIB' => $b->CLE_RIB,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'CODE',
            'MATRICULE',
            'BENEFICIAIRE',
            'SEXE',
            'TYPE',
            'FONCTION',
            'GRADE',
            'BANQUE',
            'GUICHET',
            'N° COMPTE',
            'CLE RIB',
        ];
    }
}