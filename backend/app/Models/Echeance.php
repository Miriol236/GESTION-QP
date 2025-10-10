<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Echeance extends Model
{
    protected $table = 'T_ECHEANCES';
    protected $primarykey = 'ECH_CODE'; // clé primaire personnalisée
    public $incrementing = false; // pas d'auto-incrément
    protected $keyType = 'string';
    public $timestamps = false;

    // Générer le code automatique
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {

            // Récupérer le dernier code existant
            $last = static::orderBy('ECH_CODE', 'desc')->first();

            if ($last && is_numeric($last->ECH_CODE)) {
                $num = intval($last->ECH_CODE) + 1;
            } else {
                $last = 1;
            }

            // Formate le code sur 4 chiffres
            $model->ECH_CODE = str_pad($num, 4, '0', STR_PAD_LEFT);
        });
    }

    protected $fillable = [
        'ECH_CODE',
        'ECH_LIBELLE',
        'ECH_DATE_CREER',
        'ECH_CREER_PAR',
        'ECH_DATE_MODIFIER',
        'ECH_MODIFIER_PAR',
        'ECH_VERSION',
    ];
}
