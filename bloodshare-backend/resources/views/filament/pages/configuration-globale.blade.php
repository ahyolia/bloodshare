<x-filament-panels::page>
    <div class="fi-section rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10">
        <h2 class="text-base font-semibold text-gray-950 dark:text-white mb-4">
            Points attribués par action
        </h2>

        <table class="w-full text-sm text-left">
            <thead>
                <tr class="border-b border-gray-200 dark:border-white/10">
                    <th class="py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Action</th>
                    <th class="py-2 font-medium text-gray-500 dark:text-gray-400">Points</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($this->getPointsParAction() as $ligne)
                    <tr class="border-b border-gray-100 dark:border-white/5">
                        <td class="py-2 pr-4 text-gray-950 dark:text-white">{{ $ligne['action'] }}</td>
                        <td class="py-2 text-gray-700 dark:text-gray-300">{{ $ligne['points'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Don et événement : aucun point attribué (conformément à la charte de l'association ACDO-NC).
        </p>
    </div>
</x-filament-panels::page>
