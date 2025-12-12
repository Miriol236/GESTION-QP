<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Groupe extends Model
{
    protected $table = 't_groupes';
    protected $primaryKey = 'GRP_CODE'; // clé primaire personnalisée
    public $incrementing = false;     // pas d’auto-incrément
    protected $keyType = 'string';
    public $timestamps = false; 

    protected $fillable = [
        'GRP_CODE',
        'GRP_NOM',
        'GRP_DATE_CREER',
        'GRP_CREER_PAR',
        'GRP_DATE_MODIFIER',
        'GRP_MODIFIER_PAR',
        'GRP_VERSION',
    ]; 

    // Générer le code automatique
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            // Récupérer le dernier code existant
            $last = static::orderBy('GRP_CODE', 'desc')->first();

            if ($last && is_numeric($last->GRP_CODE)) {
                $num = intval($last->GRP_CODE) + 1;
            } else {
                $num = 1;
            }

            // Formate le code sur 4 chiffre
            $model->GRP_CODE = str_pad($num, 4, '0', STR_PAD_LEFT);
        });
    }

    public function fonctionnalites()
    {
        return $this->belongsToMany(
            Fonctionnalite::class,
            't_groupe_fonctionnalite',
            'GRP_CODE',
            'FON_CODE'
        );
    }

    public function utilisateurs()
    {
        return $this->hasMany(Utilisateur::class, 'GRP_CODE', 'GRP_CODE');
    }
}
