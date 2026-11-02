<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// 📖 Rattrapage : les comptes supprimés avant que User::anonymiser() efface aussi le sexe,
//    le profil de donneur, les rôles et les notifications ont gardé ces données. On applique
//    ici le même nettoyage. Sans effet s'il n'y a rien à nettoyer, donc rejouable sans risque.
return new class extends Migration
{
    public function up(): void
    {
        $supprimes = DB::table('users')->where('statut', 'supprime')->pluck('id');

        if ($supprimes->isEmpty()) {
            return;
        }

        DB::table('users')->whereIn('id', $supprimes)->update([
            'remember_token' => null,
            'avatar_id' => null,
            'code_parrainage' => null,
            'sexe' => null,
            'statut_donneur' => null,
            'derniere_connexion' => null,
            'motif_suspension' => null,
        ]);

        DB::table('notifications')
            ->where('notifiable_type', User::class)
            ->whereIn('notifiable_id', $supprimes)
            ->delete();

        DB::table('push_subscriptions')
            ->where('subscribable_type', User::class)
            ->whereIn('subscribable_id', $supprimes)
            ->delete();

        DB::table(config('permission.table_names.model_has_roles'))
            ->where('model_type', User::class)
            ->whereIn(config('permission.column_names.model_morph_key'), $supprimes)
            ->delete();
    }

    // 📖 Les données effacées ne peuvent pas être restaurées.
    public function down(): void
    {
    }
};
