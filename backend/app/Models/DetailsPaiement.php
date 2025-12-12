<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetailsPaiement extends Model
{
    protected $table = 't_details_paiement';
    protected $primaryKey = 'DET_CODE';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

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
