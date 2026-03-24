<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Cargo;

class CargoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $cargos = [
            ['nombre' => 'Administracion'],
            ['nombre' => 'Capataz'],
            ['nombre' => 'Operario'],
            ['nombre' => 'Oficial'],
            ['nombre' => 'Ayudante'],
            ['nombre' => 'seguridad'],
        ];

        foreach ($cargos as $cargo) {
            Cargo::create($cargo);
        }
    }
}
