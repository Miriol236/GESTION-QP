<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    protected $table = 'T_PAIEMENTS';
    protected $primaryKey = 'PAI_CODE';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'PAI_CODE',
        'PAI_BENEFICIAIRE',
        'PAI_BNQ_NUMERO',
        'PAI_NUMCPT',
        'PAI_GUI_CODE',
        'PAI_RIB',
        'PAI_STATUT',
        'PAI_VIREMENT',
        'PAI_DATE_VIREMENT',
        'PAI_DATE_CREER',
        'PAI_CREER_PAR',
        'PAI_DATE_MODIFIER',
        'PAI_MODIFIER_PAR',
        'PAI_VERSION',
        'BEN_CODE',
        'REG_CODE',
        'ECH_CODE',
    ];
}
