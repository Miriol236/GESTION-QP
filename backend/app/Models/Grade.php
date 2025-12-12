<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    protected $table = 't_grades';
    protected $primaryKey = 'GRD_CODE'; // clé primaire personnalisée
    public $incrementing = false; // pas d'auto-incrément
    protected $keyType = 'string';
    public $timestamps = false;

    // Générer le code automatique
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {

            // Récupérer le dernier code existant
            $last = static::orderBy('GRD_CODE', 'desc')->first();

            if ($last && is_numeric($last->GRD_CODE)) {
                $num = intval($last->GRD_CODE) + 1;
            } else {
                $num = 1;
            }

            // Formate le code sur 5 chiffres
            $model->GRD_CODE = str_pad($num, 5, '0', STR_PAD_LEFT);
        });
    }

    protected $fillable = [
        'GRD_CODE',
        'GRD_LIBELLE',
        'GRD_DATE_CREER',
        'GRD_CREER_PAR',
        'GRD_DATE_MODIFIER',
        'GRD_MODIFIER_PAR',
        'GRD_VERSION',
    ];
}
