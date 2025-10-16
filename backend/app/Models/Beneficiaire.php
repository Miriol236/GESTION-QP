<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Beneficiaire extends Model
{
    protected $table = 'T_BENEFICIAIRES';
    protected $primaryKey = 'BEN_CODE';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'BEN_CODE',
        'BEN_MATRICULE',
        'BEN_NOM',
        'BEN_PRENOM',
        'BEN_SEXE',
        'BEN_DATE_CREER',
        'BEN_CREER_PAR',
        'BEN_DATE_MODIFIER',
        'BEN_MODIFIER_PAR',
        'BEN_VERSION',
        'TYP_CODE',
        'FON_CODE',
        'GRD_CODE',
    ];

    /**
     * Génération de BEN_CODE automatique
     * 
     */

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            // Récupérer le dernier code existant
            $last = static::orderBy('BEN_CODE', 'desc')->first();

            if ($last && is_numeric($last->BEN_CODE)) {
                $num = intval($last->BEN_CODE) + 1;
            } else {
                $num = 1;
            }

            // Formater le code en 4 chiffres
            $model->BEN_CODE = str_pad($num, 4, '0', STR_PAD_LEFT);
        });
    }
}
