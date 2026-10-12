<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentJuridique extends Model
{
    protected $table = 'documents_juridiques';

    public const TYPES = [
        'cgu' => "Conditions générales d'utilisation",
        'confidentialite' => 'Politique de confidentialité',
        'mentions_legales' => 'Mentions légales',
    ];

    protected $fillable = [
        'titre',
        'contenu',
        'version',
        'admin_id',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
