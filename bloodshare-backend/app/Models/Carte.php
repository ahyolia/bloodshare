<?php

namespace App\Models;

use App\Models\Concerns\HasStorageImageUrl;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class Carte extends Model
{
    use HasStorageImageUrl;

    /** Année de la première collection de cartes de mois. */
    public const PREMIERE_COLLECTION = 2026;

    public const MOIS = [
        1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril', 5 => 'Mai', 6 => 'Juin',
        7 => 'Juillet', 8 => 'Août', 9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre',
    ];

    protected $fillable = [
        'titre',
        'description',
        'image_url',
        'categorie',
        'mois_numero',
        'annee',
        'statut',
        'generique',
    ];

    protected $casts = [
        'generique' => 'boolean',
        'annee' => 'integer',
    ];

    protected static function booted(): void
    {
        // Carte de mois créée sans année : celle de l'année en cours.
        static::creating(function (Carte $carte) {
            if ($carte->categorie === 'mois_don' && ! $carte->annee) {
                $carte->annee = now()->year;
            }
        });
    }

    /**
     * 📖 Les 12 cartes de mois d'une année, de janvier à décembre. Les mois qui manquent
     *    sont créés (sans visuel : placeholder jusqu'à ce qu'une image soit posée dans le
     *    BO). createOrFirst : deux créations concurrentes butent sur l'index unique
     *    (annee, mois_numero) et la seconde récupère la carte de la première.
     */
    public static function collectionMois(int $annee): Collection
    {
        $existantes = static::where('categorie', 'mois_don')->where('annee', $annee)->pluck('mois_numero');

        foreach (array_diff(array_keys(self::MOIS), $existantes->all()) as $mois) {
            static::createOrFirst(
                ['categorie' => 'mois_don', 'annee' => $annee, 'mois_numero' => $mois],
                [
                    'titre' => static::titreMois($mois, $annee),
                    'description' => "Carte obtenue lors d'un don en " . self::MOIS[$mois] . " {$annee}",
                    'statut' => 'active',
                ]
            );
        }

        return static::where('categorie', 'mois_don')->where('annee', $annee)->orderBy('mois_numero')->get();
    }

    /** « Carte de Mars 2027 », « Carte d'Avril 2027 ». */
    public static function titreMois(int $mois, int $annee): string
    {
        $nom = self::MOIS[$mois];

        return (in_array($nom[0], ['A', 'O'], true) ? "Carte d'" : 'Carte de ') . "{$nom} {$annee}";
    }

    /**
     * Carte remise pour un don à cette date, null si elle est désactivée. La collection de
     * l'année est créée si elle n'existe pas encore : un don n'est jamais bloqué par un
     * 1er janvier où personne n'a préparé les cartes.
     */
    public static function carteDuMois(?CarbonInterface $date = null): ?self
    {
        $date ??= now();

        $carte = static::where('categorie', 'mois_don')
            ->where('annee', $date->year)
            ->where('mois_numero', $date->month)
            ->first()
            ?? static::collectionMois($date->year)->firstWhere('mois_numero', $date->month);

        return $carte->statut === 'active' ? $carte : null;
    }

    public function userCartes()
    {
        return $this->hasMany(UserCarte::class);
    }

    // Événements qui remettent cette carte à leurs participants.
    public function evenements()
    {
        return $this->hasMany(Evenement::class);
    }

    /**
     * 📖 Carte Événement remise par un événement qui n'en désigne aucune. Une carte propre
     *    à un événement (forum IUT...) a `generique` à false : elle n'est remise que par
     *    l'événement qui la désigne, jamais à sa place.
     */
    public static function generiqueEvenement(): ?self
    {
        return static::where('categorie', 'evenement')
            ->where('statut', 'active')
            ->where('generique', true)
            ->orderBy('id')
            ->first();
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_cartes')
                    ->withPivot('quantite', 'obtenue_at');
    }
}