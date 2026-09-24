<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Request;

class ResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        // 📖 config('app.url') pointe, sur Dokploy, vers un domaine sslip.io auto-généré non
        //    exposé publiquement (seul le tunnel ngrok l'est) : un lien construit avec cette
        //    URL est injoignable depuis le mail d'un vrai destinataire — même défaut que les
        //    URLs d'images (HasStorageImageUrl), corrigé de la même façon : on préfère l'hôte
        //    de la requête en cours (celui par lequel forgot-password a été appelé) quand il
        //    est disponible.
        $hote = Request::hasHeader('host') ? Request::getSchemeAndHttpHost() : config('app.url');
        $url = $hote . '/reset-password?token=' . $this->token . '&email=' . urlencode($notifiable->getEmailForPasswordReset());

        return (new MailMessage())
            ->subject('Réinitialisation de votre mot de passe BloodShare')
            ->line('Vous recevez cet email car une demande de réinitialisation de mot de passe a été effectuée pour votre compte.')
            ->action('Réinitialiser le mot de passe', $url)
            ->line('Si vous n\'êtes pas à l\'origine de cette demande, aucune action n\'est requise.');
    }
}
