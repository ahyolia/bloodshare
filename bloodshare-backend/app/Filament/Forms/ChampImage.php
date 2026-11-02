<?php

namespace App\Filament\Forms;

use Filament\Forms\Components\FileUpload;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Imagick;
use Livewire\Features\SupportFileUploads\TemporaryUploadedFile;

/**
 * 📖 Champ image commun aux formulaires du BO (badges, cartes, contenus, événements).
 *    `->image()` seul acceptait tout `image/*` sans limite (audit cybersécurité) :
 *    - SVG : c'est du XML qui peut contenir du JavaScript, servi depuis le domaine du BO
 *      (XSS stockée avec les droits de l'admin qui l'ouvre) ;
 *    - aucune limite de poids ni de dimensions : une image de 10 000 px, légère à envoyer,
 *      demande des centaines de Mo de mémoire pour être décodée ;
 *    - le fichier était gardé tel quel, avec ses métadonnées (GPS d'une photo, code caché).
 *
 *    Désormais : JPEG, PNG ou WebP uniquement (vérifiés sur le contenu, pas sur
 *    l'extension), 2 Mo et 4 000 px au plus, puis réencodage en WebP de 1 600 px maximum.
 *    Le réencodage ne garde que les pixels : tout contenu caché dans le fichier disparaît,
 *    et les images servies à l'app restent légères.
 */
class ChampImage
{
    public const POIDS_MAX_KO = 2048;

    public const COTE_MAX_ENVOI = 4000;

    public const COTE_MAX_STOCKE = 1600;

    public static function make(string $nom, string $dossier): FileUpload
    {
        return FileUpload::make($nom)
            ->label('Image')
            ->image()
            ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp'])
            ->maxSize(self::POIDS_MAX_KO)
            ->rules(['dimensions:max_width=' . self::COTE_MAX_ENVOI . ',max_height=' . self::COTE_MAX_ENVOI])
            ->helperText('JPEG, PNG ou WebP, 2 Mo maximum. L\'image est automatiquement réduite et convertie en WebP.')
            ->directory($dossier)
            ->saveUploadedFileUsing(fn (TemporaryUploadedFile $file, FileUpload $component) => self::reencoder($file, $component));
    }

    private static function reencoder(TemporaryUploadedFile $file, FileUpload $component): string
    {
        $image = new Imagick();
        $image->readImageBlob($file->get());

        // 📖 Avant stripImage() : l'orientation d'une photo de téléphone est dans ses EXIF.
        $image->autoOrient();

        if ($image->getImageWidth() > self::COTE_MAX_STOCKE || $image->getImageHeight() > self::COTE_MAX_STOCKE) {
            $image->thumbnailImage(self::COTE_MAX_STOCKE, self::COTE_MAX_STOCKE, true);
        }

        $image->stripImage();
        $image->setImageFormat('webp');
        $image->setImageCompressionQuality(82);

        // 📖 Nom aléatoire : rien de ce que l'admin a envoyé (nom, extension) n'est réutilisé.
        $chemin = $component->getDirectory() . '/' . Str::ulid() . '.webp';
        Storage::disk($component->getDiskName())->put($chemin, $image->getImageBlob(), 'public');

        $image->clear();

        return $chemin;
    }
}
