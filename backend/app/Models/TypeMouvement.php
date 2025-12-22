<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TypeMouvement extends Model
{
    protected $table = "t_type_mouvements";
    protected $primaryKey = 'TYP_CODE';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $year = date('Y');

            $last = static::where('TYP_CODE', 'LIKE', $year . '%')
                        ->orderBy('TYP_CODE', 'desc')
                        ->first();
            if ($last) {
                $lastNumber = intval(substr($last->TYP_CODE, 4));
                $num = $lastNumber + 1;
            } else {
                $num = 1;
            }

            $sequence = str_pad($num, 4, '0', STR_PAD_LEFT);

            $model->TYP_CODE = $year . $sequence;
        });
    }

    protected $fillable = [
        'TYP_CODE',
        'TYP_LIBELLE',
        'TYP_DATE_CREER',
        'TYP_CREER_PAR',
        'TYP_DATE_MODIFIER',
        'TYP_MODIFIER_PAR',
        'TYP_VERSION',
    ];
}