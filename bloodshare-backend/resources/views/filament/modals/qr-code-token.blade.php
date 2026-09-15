<div class="space-y-3">
    @if ($token)
        <div class="flex justify-center bg-white p-4 rounded">
            {!! \SimpleSoftwareIO\QrCode\Facades\QrCode::size(220)->generate($token) !!}
        </div>
        <p class="text-sm text-gray-500">Token du QR Code lié à cet événement :</p>
        <p class="font-mono text-sm break-all bg-gray-100 dark:bg-gray-800 rounded p-2">{{ $token }}</p>
    @else
        <p class="text-sm text-gray-500">Aucun QR Code n'est encore lié à cet événement.</p>
    @endif
</div>
