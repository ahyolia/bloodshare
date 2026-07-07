<div class="space-y-2">
    @if ($token)
        <p class="text-sm text-gray-500">Token du QR Code lié à cet événement :</p>
        <p class="font-mono text-sm break-all bg-gray-100 dark:bg-gray-800 rounded p-2">{{ $token }}</p>
    @else
        <p class="text-sm text-gray-500">Aucun QR Code n'est encore lié à cet événement.</p>
    @endif
</div>
