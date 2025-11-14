<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class Utilisateur extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'T_UTILISATEURS';
    protected $primaryKey = 'UTI_CODE';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'UTI_CODE',
        'UTI_NOM',
        'UTI_PRENOM',
        'UTI_SEXE',
        'UTI_USERNAME',
        'UTI_PASSWORD',
        'UTI_AVATAR',
        'UTI_DATE_CREER',
        'UTI_CREER_PAR',
        'UTI_DATE_MODIFIER',
        'UTI_MODIFIER_PAR',
        'UTI_VERSION',
        'UTI_STATUT',
        'GRP_CODE',
        'REG_CODE',
        'GOOGLE_ID',
        'FACEBOOK_ID',
    ];

    /**
     * Génération automatique de UTI_CODE
     */

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            // Récupérer le dernier code existant
            $last = static::orderBy('UTI_CODE', 'desc')->first();

            if ($last && is_numeric($last->UTI_CODE)) {
                $num = intval($last->UTI_CODE) + 1;
            } else {
                $num = 1;
            }

            // Formate le code sur 4 chiffres
            $model->UTI_CODE = str_pad($num, 4, '0', STR_PAD_LEFT);
        });
    }

    protected $hidden = [
        'UTI_PASSWORD',
        'remember_token',
    ];

    /**
     *  Indique à Laravel quel champ utiliser comme identifiant de connexion
     */
    public function username()
    {
        return 'UTI_USERNAME';
    }

    /**
     * Indique à Laravel que le mot de passe se trouve dans UTI_PASSWORD
     */
    public function getAuthPassword()
    {
        return $this->UTI_PASSWORD;
    }

    public function groupe()
    {
        return $this->belongsTo(Groupe::class, 'GRP_CODE', 'GRP_CODE');
    }

    public function regie()
    {
        return $this->belongsTo(Regie::class, 'REG_CODE', 'REG_CODE');
    }
}