<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Guichet extends Model
{
    protected $table = 't_guichets';
    protected $primaryKey = 'GUI_ID';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $last = static::orderBy('GUI_ID', 'desc')->first();

            if ($last && is_numeric($last->GUI_ID)) {
                $num = intval($last->GUI_ID) + 1;
            } else {
                $num = 1;
            }

            $model->GUI_ID = str_pad($num, 2, '0', STR_PAD_LEFT);
        });
    }

    protected $fillable = [
        'GUI_ID',
        'GUI_NOM',
        'GUI_CODE',
        'GUI_DATE_CREER',
        'GUI_CREER_PAR',
        'GUI_DATE_MODIFIER',
        'GUI_MODIFIER_PAR',
        'GUI_VERSION',
        'BNQ_CODE',
    ];
}
