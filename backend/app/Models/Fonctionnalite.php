<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fonctionnalite extends Model
{
    protected $table = 'T_FONCTIONNALITES';
    protected $primaryKey = 'FON_CODE'; // clé primaire personnalisée
    public $incrementing = false;     // pas d’auto-incrément
    protected $keyType = 'string';
    public $timestamps = false; 

    protected $fillable = [
        'FON_CODE',
        'FON_NOM',
        'FON_DATE_CREER',
        'FON_CREER_PAR',
        'FON_DATE_MODIFIER',
        'FON_MODIFIER_PAR',
        'FON_VERSION'
    ];

    // Générer le code automatiquement
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

            // Formate le code sur 4 chiffre
            $model->FON_CODE = str_pad($num, 4, '0', STR_PAD_LEFT);
        });
    }

    public function groupes()
    {
        return $this->belongsToMany(
            Groupe::class,
            'T_GROUPE_FONCTIONNALITE',
            'FON_CODE',
            'GRP_CODE'
        );
    }
}
