<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TypeBeneficiaire extends Model
{
    protected $table = "T_TYPE_BENEFICIAIRES";
    protected $primaryKey = 'TYP_CODE'; // Clé primaire
    public $incrementing = false; // Pas d'auto-incrément
    protected $keyType = 'string';
    public $timestamps = false;

    // Générer TYP_CODE automatique 
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            
            // Récupérer le dernier code existant
            $last = static::orderBy('TYP_CODE', 'desc')->first();

            if ($last && is_numeric($last->TYP_CODE)) {
                $num = intval($last->TYP_CODE) + 1;
            } else {
                $num = 1;
            }

            // Formate le code sur 4 chiffres
            $model->TYP_CODE = str_pad($num, 4, '0', STR_PAD_LEFT);
        });
    }

    protected $fillable = [
        'TYP_CODE',
        'TYP_LIBELLE',
        'TYP_DATE_CREER',
        'TYP_CREER_PAR',
        'TYP_DATE_MODIFIER',
        'TYP_MODIFIER_PAR',
        'TYP_VERSION',
    ];

}
