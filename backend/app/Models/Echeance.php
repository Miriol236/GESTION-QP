<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Echeance extends Model
{
    protected $table = 'T_ECHEANCES';
    protected $primaryKey = 'ECH_CODE'; // clé primaire personnalisée
    public $incrementing = false; // pas d'auto-incrément
    protected $keyType = 'string';
    public $timestamps = false;

    // Générer le code automatique
    // protected static function boot()
    // {
    //     parent::boot();

    //     static::creating(function ($model) {
    //         // Génère automatiquement l'année et le mois au format AAAAMM
    //         $model->ECH_CODE = date('Ym'); // Ex : 202510
    //     });
    // }

    protected $fillable = [
        'ECH_CODE',
        'ECH_LIBELLE',
        'ECH_STATUT',
        'ECH_DATE_CREER',
        'ECH_CREER_PAR',
        'ECH_DATE_MODIFIER',
        'ECH_MODIFIER_PAR',
        'ECH_VERSION',
    ];
}
