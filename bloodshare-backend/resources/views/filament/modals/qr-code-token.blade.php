<div class="space-y-3">
    @if ($token)
        <div id="qr-code-svg-container" class="flex justify-center bg-white p-4 rounded">
            {!! \SimpleSoftwareIO\QrCode\Facades\QrCode::size(220)->generate($token) !!}
        </div>

        <div class="flex gap-2 justify-center">
            <button
                type="button"
                onclick="window.__downloadEvenementQrCode()"
                class="fi-btn fi-btn-size-sm fi-color-gray inline-flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
                Télécharger
            </button>
            <button
                type="button"
                onclick="window.__printEvenementQrCode()"
                class="fi-btn fi-btn-size-sm fi-color-gray inline-flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
                Imprimer
            </button>
        </div>

        <p class="text-sm text-gray-500">Token du QR Code lié à cet événement :</p>
        <p class="font-mono text-sm break-all bg-gray-100 dark:bg-gray-800 rounded p-2">{{ $token }}</p>

        <script>
            // 📖 Le SVG est déjà dans le DOM (rendu côté serveur) : pas besoin de
            // regénérer le QR code en JS, on se contente de sérialiser ce noeud.
            window.__downloadEvenementQrCode = function () {
                const svg = document.querySelector('#qr-code-svg-container svg');
                if (!svg) return;
                const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'qr-code-evenement.svg';
                a.click();
                URL.revokeObjectURL(url);
            };

            // 📖 Fenêtre dédiée plutôt qu'un window.print() direct : évite d'imprimer
            // toute la page backoffice (sidebar, tableau...) derrière la modale.
            window.__printEvenementQrCode = function () {
                const svg = document.querySelector('#qr-code-svg-container svg');
                if (!svg) return;
                const fenetre = window.open('', '_blank', 'width=400,height=500');
                fenetre.document.write(
                    '<html><head><title>QR Code événement</title></head><body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">'
                    + svg.outerHTML
                    + '</body></html>'
                );
                fenetre.document.close();
                fenetre.focus();
                fenetre.print();
            };
        </script>
    @else
        <p class="text-sm text-gray-500">Aucun QR Code n'est encore lié à cet événement.</p>
    @endif
</div>
