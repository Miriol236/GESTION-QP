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

            $year = date('Y');

            // Récupère le dernier code de l'année en cours
            $last = static::where('DET_CODE', 'LIKE', $year . '%')
                        ->orderBy('DET_CODE', 'desc')
                        ->first();

            if ($last) {
                // Extraire la partie numéro (après les 4 premiers chiffres)
                $lastNumber = intval(substr($last->DET_CODE, 4));
                $num = $lastNumber + 1;
            } else {
                $num = 1;
            }

            // Formater numéro sur 4 chiffres
            $sequence = str_pad($num, 4, '0', STR_PAD_LEFT);

            // Résultat final : AAAA + 0001
            $model->DET_CODE = $year . $sequence;
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
