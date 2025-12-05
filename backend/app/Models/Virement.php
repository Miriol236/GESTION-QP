<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Virement extends Model
{
    protected $table = 'T_VIREMENTS';
    protected $primaryKey = 'VIR_CODE';
    protected $incrementing = false;
    protected $keyType = 'integer';
    public $timestamps = false;

    protected $fillable = [
        'VIR_CODE',
        'VIR_LIBELLE',
        'VIR_DATE_CREER',
        'VIR_CREER_PAR',
        'VIR_DATE_MODIFIER',
        'VIR_MODIFIER_PAR',
        'VIR_VERSION',
    ];
}
