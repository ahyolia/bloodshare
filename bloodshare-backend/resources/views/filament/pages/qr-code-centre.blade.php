<x-filament-panels::page>
    <div class="flex flex-col items-center gap-8 py-6">

        {{-- Token info --}}
        <div class="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Token actif</p>
            <p class="mt-1 break-words font-mono text-sm text-gray-950 dark:text-white">
                {{ $qrCode?->token ?? '—' }}
            </p>
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Généré le {{ $qrCode?->created_at?->format('d/m/Y à H:i') ?? '—' }}
            </p>
        </div>

        {{-- QR Code --}}
        {{-- 📖 Uniquement des classes présentes dans le CSS précompilé de Filament (pas de
             build Tailwind dans le projet) : une classe absente est ignorée sans erreur.
             L'impression (bordure retirée, reste de la page masqué) est gérée par le
             @media print en bas de page. --}}
        <div
            id="qr-code-container"
            class="flex items-center justify-center rounded-xl border-2 border-primary-600 bg-white p-6 shadow-lg"
        >
            {!! $qrSvg !!}
        </div>

        {{-- Légende --}}
        <div class="text-center">
            <p class="text-lg font-semibold text-gray-700 dark:text-gray-200">
                Scannez ce QR Code pour valider votre don
            </p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Présentez ce code à l'accueil du centre de collecte
            </p>
        </div>

        {{-- Bouton imprimer --}}
        <x-filament::button color="gray" icon="heroicon-o-printer" onclick="window.print()">
            Imprimer
        </x-filament::button>

    </div>

    {{-- Style d'impression : n'affiche que le QR code --}}
    <style>
        @media print {
            body * { visibility: hidden; }
            #qr-code-container,
            #qr-code-container * { visibility: visible; }
            #qr-code-container {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                border: none;
                padding: 0;
            }
        }
    </style>
</x-filament-panels::page>
