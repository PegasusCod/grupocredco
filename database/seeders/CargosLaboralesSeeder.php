<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CargosLaboralesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        DB::table('cargos_laborales')->truncate();
        Schema::enableForeignKeyConstraints();

        $cargos =[
            'Ayudante Civil',
            'Oficial Civil',
            'Operario Civil',
            'Almacenero',
            'Capataz',
            'Chofer',
            'Asistente Administrativo',
            'Supervisor de Obras Civiles',
            'Supervisor de Seguridad',
            'ingeniero Residente',
        ];

        foreach ($cargos as $cargo) {
            DB::table('cargos_laborales')->insert([
                'nombre' => $cargo,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
