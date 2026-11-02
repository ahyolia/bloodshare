<?php

namespace App\Filament\Pages\Auth;

use Filament\Http\Responses\Auth\Contracts\LoginResponse;
use Filament\Notifications\Notification;
use Filament\Pages\Auth\Login;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

/**
 * 📖 Connexion au BO avec une limite par compte visé. Filament ne limite que par IP
 *    (request()->ip()), qui suit X-Forwarded-For à cause de trustProxies('*') : en changeant
 *    l'en-tête à chaque essai, on pouvait tester des mots de passe d'admin sans limite (même
 *    contournement que prouvé sur /api/auth/login, audit cybersécurité).
 */
class Connexion extends Login
{
    public const TENTATIVES_MAX = 5;

    public const BLOCAGE_SECONDES = 15 * 60;

    public function authenticate(): ?LoginResponse
    {
        $cle = self::cle($this->data['email'] ?? '');

        if (RateLimiter::tooManyAttempts($cle, self::TENTATIVES_MAX)) {
            Notification::make()
                ->title('Trop de tentatives de connexion')
                ->body('Réessaie dans ' . ceil(RateLimiter::availableIn($cle) / 60) . ' minute(s).')
                ->danger()
                ->send();

            return null;
        }

        try {
            $reponse = parent::authenticate();
        } catch (ValidationException $exception) {
            RateLimiter::hit($cle, self::BLOCAGE_SECONDES);

            throw $exception;
        }

        if ($reponse) {
            RateLimiter::clear($cle);
        }

        return $reponse;
    }

    public static function cle(string $email): string
    {
        return 'bo-connexion:' . mb_strtolower(trim($email));
    }
}
