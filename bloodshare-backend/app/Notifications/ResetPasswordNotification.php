<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        $url = config('app.url') . '/reset-password?token=' . $this->token . '&email=' . urlencode($notifiable->getEmailForPasswordReset());

        return (new MailMessage())
            ->subject('Réinitialisation de votre mot de passe BloodShare')
            ->line('Vous recevez cet email car une demande de réinitialisation de mot de passe a été effectuée pour votre compte.')
            ->action('Réinitialiser le mot de passe', $url)
            ->line('Si vous n\'êtes pas à l\'origine de cette demande, aucune action n\'est requise.');
    }
}
