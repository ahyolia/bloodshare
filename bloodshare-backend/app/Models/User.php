<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Filament\Models\Contracts\FilamentUser;
use Filament\Models\Contracts\HasName;
use Filament\Panel;

class User extends Authenticatable implements FilamentUser, HasName
{
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    protected $fillable = [
        'pseudo',
        'email',
        'password',
        'sexe',
        'statut_donneur',
        'statut',
        'motif_suspension',
        'points_cumules',
        'derniere_connexion',
        'avatar_id',
        'code_parrainage',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'derniere_connexion' => 'datetime',
        'password' => 'hashed',
    ];


    // 📖 Le code de parrainage n'était généré qu'à l'inscription : les comptes créés
    //    autrement (tinker, factory, seeder) n'en avaient jamais. On le génère donc à la
    //    demande, à la première lecture, et on l'enregistre.
    protected function codeParrainage(): Attribute
    {
        return Attribute::get(function (?string $code) {
            if ($code || ! $this->exists) {
                return $code;
            }

            do {
                $code = strtoupper(Str::random(8));
            } while (static::where('code_parrainage', $code)->exists());

            $this->forceFill(['code_parrainage' => $code])->saveQuietly();

            return $code;
        });
    }

    // Relations
    public function avatar()
    {
        return $this->belongsTo(Avatar::class);
    }

    public function dons()
    {
        return $this->hasMany(Don::class);
    }

    public function qrCodeScans()
    {
        return $this->hasMany(QrCodeScan::class);
    }

    public function cartes()
    {
        return $this->hasMany(UserCarte::class);
    }

    public function badges()
    {
        return $this->hasMany(UserBadge::class);
    }

    public function defis()
    {
        return $this->hasMany(UserDefi::class);
    }

    public function quiz()
    {
        return $this->hasMany(UserQuiz::class);
    }

    public function pointsHistorique()
    {
        return $this->hasMany(PointsHistorique::class);
    }

    public function parrainagesEnvoyés()
    {
        return $this->hasMany(Parrainage::class, 'parrain_id');
    }

    public function parrainagesReçus()
    {
        return $this->hasMany(Parrainage::class, 'filleul_id');
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new \App\Notifications\ResetPasswordNotification($token));
    }

    // Dire à Filament d'utiliser pseudo comme nom d'affichage
    public function getFilamentName(): string
    {
        return $this->pseudo ?? 'Utilisateur';
    }
    //bloque l'accès au backoffice pour les utilisateurs normaux — seuls les admins et super admins peuvent se connecter.
    public function canAccessPanel(Panel $panel): bool
    {
        return $this->hasRole('super_admin') || $this->hasRole('admin');
    }

    
}