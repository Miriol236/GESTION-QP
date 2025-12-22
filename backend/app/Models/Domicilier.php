<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Domicilier extends Model
{
    protected $table = 't_domiciliers';
    protected $primaryKey = 'DOM_CODE';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {

            $year = date('Y');

            // Récupère le dernier code de l'année en cours
            $last = static::where('DOM_CODE', 'LIKE', $year . '%')
                        ->orderBy('DOM_CODE', 'desc')
                        ->first();

            if ($last) {
                // Extraire la partie numéro (après les 4 premiers chiffres)
                $lastNumber = intval(substr($last->DOM_CODE, 4));
                $num = $lastNumber + 1;
            } else {
                $num = 1;
            }

            // Formater numéro sur 4 chiffres
            $sequence = str_pad($num, 4, '0', STR_PAD_LEFT);

            // Résultat final : AAAA + 0001
            $model->DOM_CODE = $year . $sequence;
        });
    }

    protected $fillable = [
        'DOM_CODE',
        'DOM_NUMCPT',
        'DOM_RIB',
        'DOM_FICHIER',
        'DOM_STATUT',
        'DOM_DATE_CREER',
        'DOM_CREER_PAR',
        'DOM_DATE_MODIFIER',
        'DOM_MODIFIER_PAR',
        'DOM_VERSION',
        'BEN_CODE',
        'BNQ_CODE',
        'GUI_ID',
    ];

    public function banque()
    {
        return $this->belongsTo(\App\Models\Banque::class, 'BNQ_CODE', 'BNQ_CODE');
    }

    public function guichet()
    {
        return $this->belongsTo(\App\Models\Guichet::class, 'GUI_ID', 'GUI_ID');
    }

    public function beneficiaire()
    {
        return $this->belongsTo(\App\Models\Beneficiaire::class, 'BEN_CODE', 'BEN_CODE');
    }

}
