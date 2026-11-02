<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        Role::firstOrCreate(['name' => 'super_admin']);
        Role::firstOrCreate(['name' => 'admin']);

        // 📖 Le super admin vient des variables d'environnement (SEED_ADMIN_*), plus d'un
        //    email codé en dur : l'ancien seeder plantait (assignRole sur null) dès que ce
        //    compte n'existait pas, donc sur toute base neuve.
        $email = env('SEED_ADMIN_EMAIL');

        if (! $email) {
            $this->command?->warn('SEED_ADMIN_EMAIL non défini : rôles créés, aucun super admin créé.');

            return;
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            $motDePasse = env('SEED_ADMIN_PASSWORD') ?: Str::password(16, symbols: false);

            $user = User::create([
                'pseudo' => env('SEED_ADMIN_PSEUDO', 'SuperAdmin'),
                'email' => $email,
                'password' => $motDePasse,
            ]);

            $this->command?->info("Super admin créé : {$email}");

            // Un mot de passe généré n'est affiché qu'ici, une seule fois.
            if (! env('SEED_ADMIN_PASSWORD')) {
                $this->command?->warn("Mot de passe généré : {$motDePasse}");
            }
        }

        // Compte déjà existant : on ne touche pas à son mot de passe, on s'assure du rôle.
        $user->assignRole('super_admin');
    }
}
