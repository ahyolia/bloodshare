<?php

namespace App\Services;

use App\Models\QrCode;

/**
 * 📖 QR Code du centre tournant : un QR fixe, une fois photographié et partagé, permettait de
 *    valider un don depuis chez soi (AIPD, audit cybersécurité). Le QR affiché au centre
 *    encode maintenant `C.{fenêtre}.{signature}`, qui change toutes les 30 secondes. La
 *    signature est un HMAC de la fenêtre avec le token du QR centre actif, qui reste secret :
 *    il n'est plus jamais affiché ni encodé dans un QR.
 *
 *    La fenêtre précédente reste acceptée, pour un scan commencé juste avant le changement :
 *    une photo du QR ne sert donc qu'une minute au plus.
 *
 *    QR de secours (`S.{signature}`) : fixe, à imprimer à l'avance au cas où l'écran du
 *    centre tombe en panne. Il n'est accepté que pendant un mode secours activé dans le BO
 *    (jusqu'à la fin de la journée) : le reste du temps, une photo de ce QR ne sert à rien.
 */
class QrCentreTournant
{
    public const PERIODE_SECONDES = 30;

    private const PREFIXE = 'C';

    private const PREFIXE_SECOURS = 'S';

    public function jetonSecours(QrCode $qrCode): string
    {
        return self::PREFIXE_SECOURS . '.' . substr(hash_hmac('sha256', 'secours', $qrCode->token), 0, 32);
    }

    public function jetonCourant(QrCode $qrCode): string
    {
        $fenetre = $this->fenetreCourante();

        return self::PREFIXE . '.' . $fenetre . '.' . $this->signer($qrCode, $fenetre);
    }

    /** Secondes avant que le jeton affiché change. */
    public function secondesRestantes(): int
    {
        return self::PERIODE_SECONDES - (now()->getTimestamp() % self::PERIODE_SECONDES);
    }

    /** QR centre actif correspondant au jeton, ou null s'il est faux ou expiré. */
    public function verifier(string $jeton): ?QrCode
    {
        if (str_starts_with($jeton, self::PREFIXE_SECOURS . '.')) {
            return $this->verifierSecours($jeton);
        }

        $morceaux = explode('.', $jeton);

        if (count($morceaux) !== 3 || $morceaux[0] !== self::PREFIXE || ! ctype_digit($morceaux[1])) {
            return null;
        }

        [, $fenetre, $signature] = $morceaux;
        $fenetre = (int) $fenetre;
        $courante = $this->fenetreCourante();

        if ($fenetre !== $courante && $fenetre !== $courante - 1) {
            return null;
        }

        $qrCode = QrCode::where('type', 'centre')->where('actif', true)->first();

        if (! $qrCode || ! hash_equals($this->signer($qrCode, $fenetre), $signature)) {
            return null;
        }

        return $qrCode;
    }

    private function verifierSecours(string $jeton): ?QrCode
    {
        $qrCode = QrCode::where('type', 'centre')->where('actif', true)->first();

        if (! $qrCode || ! $qrCode->secoursActif() || ! hash_equals($this->jetonSecours($qrCode), $jeton)) {
            return null;
        }

        return $qrCode;
    }

    private function fenetreCourante(): int
    {
        return intdiv(now()->getTimestamp(), self::PERIODE_SECONDES);
    }

    private function signer(QrCode $qrCode, int $fenetre): string
    {
        // 📖 20 caractères hexadécimaux (80 bits) : impossible à deviner pendant les
        //    60 secondes de validité, et le QR reste lisible de loin.
        return substr(hash_hmac('sha256', (string) $fenetre, $qrCode->token), 0, 20);
    }
}
