<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Domicilier extends Model
{
    protected $table = 'T_DOMICILIERS';
    protected $primaryKey = 'DOM_CODE';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            // Récupère le dernier enregistrement
            $last = static::orderBy('DOM_CODE', 'desc')->first();

            if ($last) {
                // Convertit en entier puis incrémente
                $num = intval($last->DOM_CODE) + 1;
            } else {
                $num = 1;
            }

            // Formate sur 3 chiffres : 001, 002, 003...
            $model->DOM_CODE = str_pad($num, 3, '0', STR_PAD_LEFT);
        });
    }

    protected $fillable = [
        'DOM_CODE',
        'DOM_NUMCPT',
        'DOM_RIB',
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
