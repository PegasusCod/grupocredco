<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TallaSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $tallas = [
            ['codigo' => 'N/A', 'nombre' => 'No aplica', 'orden_visual' => 0, 'activo' => true],

            ['codigo' => 'XS', 'nombre' => 'Extra Small', 'orden_visual' => 1, 'activo' => true],
            ['codigo' => 'S', 'nombre' => 'Small', 'orden_visual' => 2, 'activo' => true],
            ['codigo' => 'M', 'nombre' => 'Medium', 'orden_visual' => 3, 'activo' => true],
            ['codigo' => 'L', 'nombre' => 'Large', 'orden_visual' => 4, 'activo' => true],
            ['codigo' => 'XL', 'nombre' => 'Extra Large', 'orden_visual' => 5, 'activo' => true],
            ['codigo' => 'XXL', 'nombre' => 'Double Extra Large', 'orden_visual' => 6, 'activo' => true],

            ['codigo' => '36', 'nombre' => 'Talla 36', 'orden_visual' => 10, 'activo' => true],
            ['codigo' => '37', 'nombre' => 'Talla 37', 'orden_visual' => 11, 'activo' => true],
            ['codigo' => '38', 'nombre' => 'Talla 38', 'orden_visual' => 12, 'activo' => true],
            ['codigo' => '39', 'nombre' => 'Talla 39', 'orden_visual' => 13, 'activo' => true],
            ['codigo' => '40', 'nombre' => 'Talla 40', 'orden_visual' => 14, 'activo' => true],
            ['codigo' => '41', 'nombre' => 'Talla 41', 'orden_visual' => 15, 'activo' => true],
            ['codigo' => '42', 'nombre' => 'Talla 42', 'orden_visual' => 16, 'activo' => true],
            ['codigo' => '43', 'nombre' => 'Talla 43', 'orden_visual' => 17, 'activo' => true],
            ['codigo' => '44', 'nombre' => 'Talla 44', 'orden_visual' => 18, 'activo' => true],
            ['codigo' => '45', 'nombre' => 'Talla 45', 'orden_visual' => 19, 'activo' => true],

            ['codigo' => 'UNICA', 'nombre' => 'Talla Única', 'orden_visual' => 99, 'activo' => true],
        ];

        foreach ($tallas as $talla) {
            DB::table('tallas')->updateOrInsert(
                ['codigo' => $talla['codigo']],
                [
                    'nombre' => $talla['nombre'],
                    'orden_visual' => $talla['orden_visual'],
                    'activo' => $talla['activo'],
                    'updated_at' => $now,
                    'created_at' => $now,
                ]
            );
        }
    }
}