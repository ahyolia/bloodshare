<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * 📖 L'adresse d'un abonnement push est fournie par l'app, puis le serveur y envoie une
 *    requête POST à chaque notification. Une adresse libre permettait de faire appeler par
 *    le serveur n'importe quelle URL interne (SSRF, prouvé en local avec un abonnement vers
 *    http://127.0.0.1:8000) : panel Dokploy, base de données, services de la machine.
 *    Seuls les services de push des navigateurs sont acceptés, en HTTPS.
 */
class EndpointPushAutorise implements ValidationRule
{
    // Chrome, Edge, Firefox, Safari (macOS et iOS).
    private const HOTES = [
        'fcm.googleapis.com',
        'updates.push.services.mozilla.com',
        'web.push.apple.com',
    ];

    // 📖 Edge (WNS) : un sous-domaine par région, ex. wns2-par02p.notify.windows.com.
    private const SUFFIXES = ['.notify.windows.com'];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $url = parse_url((string) $value);
        $hote = strtolower($url['host'] ?? '');

        $autorise = ($url['scheme'] ?? '') === 'https'
            && ! isset($url['port'])
            && ! isset($url['user'])
            && (in_array($hote, self::HOTES, true) || collect(self::SUFFIXES)->contains(fn ($s) => str_ends_with($hote, $s)));

        if (! $autorise) {
            $fail("Ce service de notifications n'est pas pris en charge.");
        }
    }
}
