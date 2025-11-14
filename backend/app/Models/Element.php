<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Element extends Model
{
    protected $table = 'T_ELEMENTS';
    protected $primaryKey = 'ELT_CODE';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $last = static::orderBy('ELT_CODE', 'desc')->first();

            if ($last && is_numeric($last->ELT_CODE)) {
                $num = intval($last->ELT_CODE) + 1;
            } else {
                $num = 1;
            }

            $model->ELT_CODE = str_pad($num, 3, '0', STR_PAD_LEFT);
        });
    }

    protected $fillable = [
        'ELT_CODE',
        'ELT_LIBELLE',
        'ELT_SENS',
        'ELT_DATE_CREER',
        'ELT_CREER_PAR',
        'ELT_DATE_MODIFIER',
        'ELT_MODIFIER_PAR',
        'ELT_VERSION',
    ];
}
