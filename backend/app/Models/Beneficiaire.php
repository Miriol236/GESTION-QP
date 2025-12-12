<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;


class Beneficiaire extends Model
{
    protected $table = 't_beneficiaires';
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

        static::creating(function ($beneficiaire) {
            //  1. Récupérer l'utilisateur connecté
            $user = Auth::user();

            if (!$user || !$user->regie) {
                throw new \Exception("Impossible de générer le code : l'utilisateur n'a pas de régie associée.");
            }

            //  2. Récupérer le sigle de la régie
            $regSigle = strtoupper($user->regie->REG_SIGLE_CODE);

            //  3. Récupérer l'année courante
            $year = date('Y');

            //  4. Récupérer le dernier code pour cette régie et cette année
            $lastBenef = self::where('BEN_CODE', 'LIKE', "{$year}{$regSigle}%")
                ->orderBy('BEN_CODE', 'desc')
                ->first();

            //  5. Extraire le dernier numéro
            if ($lastBenef) {
                $lastNumber = intval(substr($lastBenef->BEN_CODE, strlen($year . $regSigle)));
            } else {
                $lastNumber = 0;
            }

            //  6. Incrémenter et formater sur 5 chiffres
            $newNumber = str_pad($lastNumber + 1, 5, '0', STR_PAD_LEFT);

            //  7. Générer le code final
            $beneficiaire->BEN_CODE = "{$year}{$regSigle}{$newNumber}";
        });
    }

    public function domiciliations()
    {
        return $this->hasMany(\App\Models\Domicilier::class, 'BEN_CODE', 'BEN_CODE');
    }

    public function typeBeneficiaire()
    {
        return $this->belongsTo(TypeBeneficiaire::class, 'TYP_CODE', 'TYP_CODE');
    }
}
