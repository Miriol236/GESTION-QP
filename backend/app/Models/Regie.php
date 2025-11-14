<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Regie extends Model
{
    protected $table = 'T_REGIES';
    protected $primaryKey = 'REG_CODE'; // clé primaire personnalisée
    public $incrementing = false; // pas d'auto-incrément
    protected $keyType = 'string';
    public $timestamps = false;

    // Générer le code automatique
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {

            // Récupérer le dernier code existant
            $last = static::orderBy('REG_CODE', 'desc')->first();

            if ($last && is_numeric($last->REG_CODE)) {
                $num = intval($last->REG_CODE) + 1;
            } else {
                $num = 1;
            }

            // Formate le code sur 2 chiffres
            $model->REG_CODE = str_pad($num, 2, '0', STR_PAD_LEFT);
        });
    }

    protected $fillable = [
        'REG_CODE',
        'REG_LIBELLE',
        'REG_SIGLE',
        'REG_SIGLE_CODE',
        'REG_DATE_CREER',
        'REG_CREER_PAR',
        'REG_DATE_MODIFIER',
        'REG_MODIFIER_PAR',
        'REG_VERSION',
    ];

    public function utilisateurs()
    {
        return $this->hasMany(Utilisateur::class, 'REG_CODE', 'REG_CODE');
    }
}
