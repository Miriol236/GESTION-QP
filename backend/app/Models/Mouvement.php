<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mouvement extends Model
{
    protected $table = 't_mouvements';
    protected $primaryKey = 'MVT_CODE';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'MVT_CODE',
        'MVT_BEN_CODE',
        'MVT_DOM_CODE',
        'MVT_PAI_CODE',
        'MVT_BEN_NOM_PRE',
        'MVT_BNQ_CODE',
        'MVT_BNQ_LIBELLE',
        'MVT_GUI_CODE',
        'MVT_GUI_NOM',
        'MVT_NUMCPT',
        'MVT_CLE_RIB',
        'MVT_DATE',
        'MVT_HEURE',
        'MVT_NIV',
        'MVT_UTI_CODE',  
        'MVT_CREER_PAR',
        'TYP_CODE',
    ];
}
