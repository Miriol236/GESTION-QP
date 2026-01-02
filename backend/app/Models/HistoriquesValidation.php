<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistoriquesValidation extends Model
{
    protected $table = 't_historiques_validations';
    protected $primaryKey = 'VAL_CODE';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'VAL_CODE',
        'VAL_BEN_CODE',
        'VAL_DOM_CODE',
        'VAL_PAI_CODE',
        'VAL_BEN_NOM_PRE',
        'VAL_BNQ_CODE',
        'VAL_BNQ_LIBELLE',
        'VAL_GUI_CODE',
        'VAL_GUI_NOM',
        'VAL_NUMCPT',
        'VAL_CLE_RIB',
        'VAL_DATE',
        'VAL_HEURE',
        'VAL_NIV',
        'VAL_UTI_CODE',
        'VAL_CREER_PAR',
        'MVT_CODE',
    ];
}
