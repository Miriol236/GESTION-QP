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
        'BEN_CODE',
        'DOM_CODE',
        'PAI_CODE',
        'MVT_DATE',
        'MVT_HEURE',
        'MVT_NIV',
        'TYP_CODE',
    ];
}
