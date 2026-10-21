<x-filament-panels::page>
    {{-- 📖 Uniquement des classes présentes dans le CSS précompilé de Filament (pas de
         build Tailwind dans le projet) : une classe absente est ignorée sans erreur. Par
         exemple dark:text-gray-300 n'existe pas (le texte restait gris foncé sur fond
         sombre) : dark:text-gray-200 est utilisé à la place. --}}
    <div class="flex flex-col gap-6">

        <x-filament::section>
            <x-slot name="heading">Affichage au centre de collecte</x-slot>

            <div class="flex flex-col gap-3 text-sm text-gray-700 dark:text-gray-200">
                <p>
                    Le QR Code du centre change toutes les 30 secondes : une photo partagée ne permet
                    plus de valider un don depuis chez soi. Il s'affiche sur un écran ou une tablette
                    du centre, à partir du lien ci-dessous. Un QR Code imprimé ne fonctionne plus.
                </p>
                <p>
                    Ce lien donne accès au QR Code en direct : ne le partage qu'avec le centre. S'il a
                    pu circuler, régénère le QR Code (bouton en haut de page) et ouvre le nouveau lien
                    sur l'écran.
                </p>
            </div>
        </x-filament::section>

        <x-filament::section>
            <x-slot name="heading">Lien de l'écran du centre</x-slot>

            <div class="flex flex-col items-start gap-3">
                <p class="break-words font-mono text-sm text-gray-950 dark:text-white">
                    {{ $this->getLienAffichage() }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    QR Code créé le {{ $qrCode?->created_at?->format('d/m/Y à H:i') ?? '—' }}
                </p>

                {{ $this->ouvrirAffichageAction }}
            </div>
        </x-filament::section>

        <x-filament::section>
            <x-slot name="heading">QR de secours (imprimé)</x-slot>

            <div class="flex flex-col items-start gap-3 text-sm text-gray-700 dark:text-gray-200">
                <p>
                    À imprimer à l'avance et à garder au centre au cas où l'écran tombe en panne. Il ne
                    fonctionne que lorsque le mode secours est activé, jusqu'à 23h59 le jour même.
                </p>

                @if ($qrCode?->secoursActif())
                    <x-filament::badge color="warning">
                        Mode secours actif jusqu'au {{ $qrCode->secours_jusqu_a->format('d/m/Y à H:i') }}
                    </x-filament::badge>
                @else
                    <x-filament::badge color="gray">Mode secours désactivé</x-filament::badge>
                @endif

                <div class="flex flex-wrap items-center gap-2">
                    {{ $this->imprimerSecoursAction }}
                    {{ $this->telechargerSecoursPngAction }}
                    {{ $this->telechargerSecoursPdfAction }}
                    {{ $this->activerSecoursAction }}
                    {{ $this->desactiverSecoursAction }}
                </div>
            </div>
        </x-filament::section>

    </div>
</x-filament-panels::page>
