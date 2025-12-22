<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NiveauValidation extends Model
{
    protected $table = 't_niveau_validations';
    protected $primaryKey = 'NIV_CODE';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'NIV_CODE',
        'NIV_LIBELLE',
        'NIV_VALEUR',
        'NIV_DATE_CREER',
        'NIV_CREER_PAR',
        'NIV_DATE_MODIFIER',
        'NIV_MODIFIER_PAR',
        'NIV_VERSION',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $last = static::orderBy('NIV_CODE', 'desc')->first();

            if ($last && is_numeric($last->NIV_CODE)) {
                $num = intval($last->NIV_CODE) + 1;
            } else {
                $num = 1;
            }

            $model->NIV_CODE = str_pad($num, 2, '0', STR_PAD_LEFT);
        });
    }
}
