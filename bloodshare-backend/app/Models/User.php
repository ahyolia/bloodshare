<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use NotificationChannels\WebPush\HasPushSubscriptions;
use Spatie\Permission\Traits\HasRoles;
use Filament\Models\Contracts\FilamentUser;
use Filament\Models\Contracts\HasName;
use Filament\Panel;

class User extends Authenticatable implements FilamentUser, HasName
{
    use HasApiTokens, HasFactory, HasPushSubscriptions, HasRoles, Notifiable;

    protected $fillable = [
        'pseudo',
        'email',
        'password',
        'sexe',
        'statut',
        'motif_suspension',
        'points_cumules',
        'derniere_connexion',
        'avatar_id',
        'code_parrainage',
        'doit_changer_mdp',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'derniere_connexion' => 'datetime',
        'password' => 'hashed',
        'doit_changer_mdp' => 'boolean',
        'cgu_acceptees_at' => 'datetime',
        'consentement_sante_at' => 'datetime',
    ];


    // 📖 Le code de parrainage n'était généré qu'à l'inscription : les comptes créés
    //    autrement (tinker, factory, seeder) n'en avaient jamais. On le génère donc à la
    //    demande, à la première lecture, et on l'enregistre.
    protected function codeParrainage(): Attribute
    {
        return Attribute::get(function (?string $code) {
            // 📖 Un compte supprimé (RGPD, voir ProfilController::destroy) a son code mis à
            //    null volontairement : il ne doit pas en regagner un tout seul à la prochaine
            //    lecture, sans quoi la suppression ne supprimerait jamais rien pour de bon.
            if ($code || ! $this->exists || $this->statut === 'supprime') {
                return $code;
            }

            do {
                $code = strtoupper(Str::random(8));
            } while (static::where('code_parrainage', $code)->exists());

            $this->forceFill(['code_parrainage' => $code])->saveQuietly();

            return $code;
        });
    }

    protected static function booted(): void
    {
        static::updated(function (User $user) {
            app(\App\Services\NotificationService::class)->verifierNouveauNiveau($user);
        });
    }

    // 📖 RGPD : la ligne reste en base (dons, points, badges... gardent leur historique pour
    //    les statistiques de l'association), mais tout ce qui identifie la personne est effacé.
    //    `email` doit rester unique et non nul en base, d'où le suffixe id. `password` est
    //    réécrit avec une valeur aléatoire : même si `login()` refuse déjà les comptes
    //    `statut='supprime'`, un compte ne doit plus être utilisable si cette règle venait à
    //    changer un jour. Appelé depuis l'API (DELETE /me) et le BO (action "Supprimer le
    //    compte") : les deux chemins de suppression doivent produire le même état.
    //    `sexe` + dates de don sont des données de santé (voir le dossier juridique) : sans
    //    effacer le sexe, l'historique conservé resterait rattaché à une donnée de santé.
    //    Tout se fait dans une transaction : un compte ne doit jamais rester marqué
    //    `supprime` en gardant une partie de ses données parce qu'une étape a échoué.
    public function anonymiser(): void
    {
        DB::transaction(function () {
            // 📖 forceFill : `remember_token` n'est pas dans $fillable.
            $this->forceFill([
                'statut' => 'supprime',
                'pseudo' => 'Utilisateur supprimé',
                'email' => "supprime-{$this->id}@bloodshare.local",
                'password' => Hash::make(Str::random(40)),
                'remember_token' => null,
                'avatar_id' => null,
                'code_parrainage' => null,
                'sexe' => null,
                'derniere_connexion' => null,
                'motif_suspension' => null,
            ])->save();

            // 📖 Un compte admin supprimé depuis le BO ne doit garder aucun rôle.
            $this->syncRoles([]);

            // 📖 Révocation ici et pas chez les appelants : la purge des comptes inactifs
            //    l'oubliait, et un ancien token gardait l'accès à un compte « supprimé ».
            $this->tokens()->delete();

            // 📖 Un compte supprimé ne doit plus recevoir de notification : sans ça, l'appareil
            //    reste abonné et continuerait de recevoir les push de l'ancien compte.
            $this->pushSubscriptions()->delete();

            // 📖 L'historique des notifications reprend des éléments personnels (dons, défis,
            //    quiz) : il n'a plus d'utilité une fois le compte supprimé.
            $this->notifications()->delete();
        });
    }

    // 📖 Changer le statut ne suffisait pas : login() ne le vérifiait pas et les tokens déjà
    //    émis restaient valables, un compte suspendu gardait donc tout son accès (audit
    //    cybersécurité). Appelé depuis les deux fiches du BO (utilisateur et admin).
    public function suspendre(string $motif): void
    {
        DB::transaction(function () use ($motif) {
            $this->update([
                'statut' => 'suspendu',
                'motif_suspension' => $motif,
            ]);

            $this->tokens()->delete();
        });
    }

    // 📖 Pas `statut !== 'actif'` : un modèle tout juste créé n'a pas encore la valeur par
    //    défaut de la base (statut null tant qu'il n'est pas relu).
    public function estBloque(): bool
    {
        return in_array($this->statut, ['suspendu', 'supprime'], true);
    }

    public function scopeNonSupprimes($query)
    {
        return $query->where('statut', '!=', 'supprime');
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

    // Dire à Filament d'utiliser pseudo comme nom d'affichage
    public function getFilamentName(): string
    {
        return $this->pseudo ?? 'Utilisateur';
    }
    //bloque l'accès au backoffice pour les utilisateurs normaux — seuls les admins et super admins peuvent se connecter.
    public function canAccessPanel(Panel $panel): bool
    {
        // 📖 Vérifié par Filament à chaque requête : un admin suspendu perd l'accès au BO même
        //    avec une session déjà ouverte.
        return ($this->hasRole('super_admin') || $this->hasRole('admin')) && ! $this->estBloque();
    }

    
}