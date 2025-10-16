<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fonction extends Model
{
    protected $table = 'T_FONCTIONS';
    protected $primaryKey = 'FON_CODE'; // clé primaire personnalisée
    public $incrementing = false; // pas d'auto-incrément
    protected $keyType = 'string';
    public $timestamps = false;

    // Générer FON_CODE automatique 
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {

            // Récupérer le dernier code existant
            $last = static::orderBy('FON_CODE', 'desc')->first();

            if ($last && is_numeric($last->FON_CODE)) {
                $num = intval($last->FON_CODE) + 1;
            } else {
                $num = 1;
            }

            // Formate le code sur 5 chiffres
            $model->FON_CODE = str_pad($num, 5, '0', STR_PAD_LEFT);
        });
    }

    protected $fillable = [
        'FON_CODE',
        'FON_LIBELLE',
        'FON_DATE_CREER',
        'FON_CREER_PAR',
        'FON_DATE_MODIFIER',
        'FON_MODIFIER_PAR',
        'FON_VERSION',
    ];
}
