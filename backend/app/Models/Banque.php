<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Banque extends Model
{
    protected $table = 't_banques';
    protected $primaryKey = 'BNQ_CODE';
    public $incremening = false;
    protected $keyType = 'string';
    public $timestamps = false;

    // protected static function boot()
    // {
    //     parent::boot();

    //     static::creating(function ($model) {
    //         $last = static::orderBy('BNQ_CODE', 'desc')->first();

    //         if ($last && is_numeric($last->BNQ_CODE)) {
    //             $num = intval($last->BNQ_CODE) + 1;
    //         } else {
    //             $num = 1;
    //         }

    //         $model->BNQ_CODE = str_pad($num, 2, '0', STR_PAD_LEFT);
    //     });
    // }

    protected $fillable = [
        'BNQ_CODE',
        'BNQ_LIBELLE',
        'BNQ_DATE_CREER',
        'BNQ_CREER_PAR',
        'BNQ_DATE_MODIFIER',
        'BNQ_MODIFIER_PAR',
        'BNQ_VERSION',
    ];
}
