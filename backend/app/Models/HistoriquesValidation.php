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
        'VAL_DATE',
        'VAL_HEURE',
        'VAL_UTI_CODE',
        'VAL_CREER_PAR',
        'MVT_CODE',
    ];
}
