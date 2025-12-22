<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Position extends Model
{
    protected $table = "t_positions";
    protected $primaryKey = 'POS_CODE';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'POS_CODE',
        'POS_LIBELLE',
        'POS_STATUT',
        'POS_DATE_CREER',
        'POS_CREER_PAR',
        'POS_DATE_MODIFIER',
        'POS_MODIFIER_PAR',
        'POS_VERSION',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $last = static::orderBy('POS_CODE', 'desc')->first();

            if ($last && is_numeric($last->POS_CODE)) {
                $num = intval($last->POS_CODE) + 1;
            } else {
                $num = 1;
            }

            $model->POS_CODE = str_pad($num, 2, '0', STR_PAD_LEFT);
        });
    }
}
