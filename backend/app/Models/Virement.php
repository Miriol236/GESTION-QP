<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Virement extends Model
{
    protected $table = 't_virements';
    protected $primaryKey = 'VIR_CODE';
    public $incrementing = false;
    protected $keyType = 'integer';
    public $timestamps = false;

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $last = static::orderBy('VIR_CODE', 'desc')->first();

            if ($last && is_numeric($last->VIR_CODE)) {
                $num = intval($last->VIR_CODE) + 1;
            } else {
                $num = 1;
            }

            $model->VIR_CODE = str_pad($num, 1, 0, STR_PAD_LEFT);
        });
    }

    protected $fillable = [
        'VIR_CODE',
        'VIR_LIBELLE',
        'VIR_DATE_CREER',
        'VIR_CREER_PAR',
        'VIR_DATE_MODIFIER',
        'VIR_MODIFIER_PAR',
        'VIR_VERSION',
    ];
}
