<x-filament-panels::page>
    {{-- 📖 Uniquement des classes présentes dans le CSS précompilé de Filament (pas de
         build Tailwind dans le projet) : une classe absente est ignorée sans erreur. Les
         explications passent par la description des sections, stylée par Filament et
         lisible dans les deux thèmes. --}}
    <div class="flex flex-col gap-6">

        <x-filament::section icon="heroicon-o-tv">
            <x-slot name="heading">Écran du centre</x-slot>
            <x-slot name="description">
                Le QR Code change toutes les 30 secondes : ouvre ce lien sur l'écran ou la tablette
                du centre. Ne le partage qu'avec le centre.
            </x-slot>

            <div class="flex flex-col items-start gap-3">
                <p class="break-words font-mono text-sm text-gray-950 dark:text-white">
                    {{ $this->getLienAffichage() }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    QR Code créé le {{ $qrCode?->created_at?->format('d/m/Y à H:i') ?? '—' }}.
                    Si le lien a circulé, régénère le QR Code (en haut de page).
                </p>

                {{ $this->ouvrirAffichageAction }}
            </div>
        </x-filament::section>

        <x-filament::section icon="heroicon-o-lifebuoy">
            <x-slot name="heading">QR de secours (imprimé)</x-slot>
            <x-slot name="description">
                À imprimer à l'avance, au cas où l'écran tombe en panne. Accepté seulement quand le
                mode secours est activé (en haut de page), jusqu'à 23h59 le jour même.
            </x-slot>

            <div class="flex flex-wrap items-center gap-2">
                @if ($qrCode?->secoursActif())
                    <x-filament::badge color="warning">
                        Actif jusqu'au {{ $qrCode->secours_jusqu_a->format('d/m/Y à H:i') }}
                    </x-filament::badge>
                @else
                    <x-filament::badge color="gray">Mode secours désactivé</x-filament::badge>
                @endif

                {{ $this->imprimerSecoursAction }}

                <x-filament-actions::group
                    :actions="[$this->telechargerSecoursPngAction, $this->telechargerSecoursPdfAction]"
                    label="Télécharger"
                    icon="heroicon-o-arrow-down-tray"
                    color="gray"
                    :button="true"
                />
            </div>
        </x-filament::section>

    </div>
</x-filament-panels::page>
