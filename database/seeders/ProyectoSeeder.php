<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProyectoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        DB::table('proyectos')->truncate();

        Schema::enableForeignKeyConstraints();

        $proyectos = [
            'Proyecto Obras Civiles',
            'Proyecto Relavera',
        ];

        foreach ($proyectos as $proyecto) {
            DB::table('proyectos')->insert([
                'nombre' => $proyecto,
                'activo' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
