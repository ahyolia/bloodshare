<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Storage;

/**
 * 📖 `Forms\Components\FileUpload` enregistre un chemin RELATIF au disque
 *    ("badges/xxxxx.png"), pas une URL. Renvoyé tel quel à l'app mobile, ce
 *    chemin ne pointe nulle part : `<Image source={{ uri: image_url }}>` ne
 *    peut rien afficher. Ce trait convertit ce chemin en URL absolue à la
 *    lecture, une seule fois, pour tout modèle dont l'image vient d'un
 *    FileUpload sur le disque `public`.
 *
 *    On préfère l'hôte de la requête HTTP en cours à APP_URL : en local avec
 *    Dokploy, APP_URL pointe vers un domaine sslip.io auto-généré qui n'est
 *    pas exposé publiquement (seul le tunnel ngrok l'est), donc une image
 *    construite avec APP_URL serait injoignable depuis le téléphone.
 */
trait HasStorageImageUrl
{
    protected function imageUrl(): Attribute
    {
        return Attribute::get(function (?string $value) {
            if (! $value || str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
                return $value;
            }

            $chemin = Storage::disk('public')->url($value);

            if (Request::hasHeader('host')) {
                $chemin = Request::getSchemeAndHttpHost() . '/storage/' . ltrim($value, '/');
            }

            return $chemin;
        });
    }

    /**
     * 📖 Filament lit `image_url` via l'accesseur ci-dessus pour préremplir le champ
     *    `FileUpload` d'un formulaire d'édition : il reçoit donc l'URL absolue
     *    ("https://.../storage/badges/xxx.png"), pas le chemin relatif que `FileUpload`
     *    attend. Résultat, sans ce correctif : l'image ne s'affiche pas en édition, et si
     *    le formulaire est enregistré sans y retoucher, cette URL absolue écrase le chemin
     *    relatif en base — l'image devient définitivement introuvable (perdue).
     *    À brancher sur `->formatStateUsing()` du FileUpload dans chaque Resource concernée
     *    (Badge, Carte, Contenu, Evenement) pour lui redonner le chemin relatif attendu.
     */
    public static function cheminRelatifImage(?string $valeur): ?string
    {
        if (! $valeur) {
            return $valeur;
        }

        return preg_replace('#^https?://[^/]+/storage/#', '', $valeur) ?? $valeur;
    }
}
