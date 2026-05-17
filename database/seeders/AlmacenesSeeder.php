<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AlmacenesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        DB::table('almacenes')->truncate();

        Schema::enableForeignKeyConstraints();

        DB::table('almacenes')->insert([
            [
                'proyecto_id' => 1, // Proyecto Obras Civiles
                'nombre' => 'Almacén Obras Civiles',
                'tipo_almacen' => 'OPERATIVO',
                'compartido' => 0,
                'activo' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'proyecto_id' => 2, // Proyecto Relavera
                'nombre' => 'Almacén Relavera',
                'tipo_almacen' => 'OPERATIVO',
                'compartido' => 0,
                'activo' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'proyecto_id' => null, // Compartido entre proyectos
                'nombre' => 'Almacén Segregación',
                'tipo_almacen' => 'SEGREGACION',
                'compartido' => 1,
                'activo' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
