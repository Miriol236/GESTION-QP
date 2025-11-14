<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetailsPaiement extends Model
{
    protected $table = 'T_DETAILS_PAIEMENT';
    protected $primaryKey = 'DET_CODE';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            // Récupérer le dernier enregistrement
            $last = static::orderBy('DET_CODE', 'desc')->first();

            if ($last) {
                // Convertit en entier puis incrémente
                $num = intval($last->DET_CODE) + 1;
            } else {
                $num = 1;
            }

            // Formater sur 4 chiffres
            $model->DET_CODE = str_pad($num, 4, '0', STR_PAD_LEFT); 
        });
    }

    protected $fillable = [
        'DET_CODE',
        'PAI_MONTANT',
        'ELT_CODE',
        'PAI_CODE',
    ];

    public function element()
    {
        return $this->belongsTo(\App\Models\Element::class, 'ELT_CODE', 'ELT_CODE');
    }

    public function paiement()
    {
        return $this->belongsTo(\App\Models\Paiement::class, 'PAI_CODE', 'PAI_CODE');
    }
}
