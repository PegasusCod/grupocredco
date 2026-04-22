<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\EppCategoria;

class EppCategoriasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categorias = [
            'Protección de Cabeza',
            'Protección de Manos',
            'Protección de Pies',
            'Protección Visual',
            'Protección Auditiva',
            'Protección Respiratoria',
            'Protección Corporal',
            'Protección Anticaídas',
        ];

        foreach ($categorias as $nombre) {
            EppCategoria::firstOrCreate(['nombre' => $nombre]);
        }
    }
}
