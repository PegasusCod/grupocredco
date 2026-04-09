<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MovimientoTipoSeeder extends Seeder
{
    public function run(): void
    {
        $tipos = [
            [
                'codigo' => 'INGRESO_COMPRA',
                'nombre' => 'Ingreso por compra',
                'naturaleza_default' => 'ENTRADA',
                'afecta_stock' => true,
                'activo' => true,
            ],
            [
                'codigo' => 'INGRESO_DEVOLUCION',
                'nombre' => 'Ingreso por devolución',
                'naturaleza_default' => 'ENTRADA',
                'afecta_stock' => true,
                'activo' => true,
            ],
            [
                'codigo' => 'INGRESO_TRANSFERENCIA',
                'nombre' => 'Ingreso por transferencia',
                'naturaleza_default' => 'ENTRADA',
                'afecta_stock' => true,
                'activo' => true,
            ],
            [
                'codigo' => 'INGRESO_AJUSTE_POSITIVO',
                'nombre' => 'Ingreso por ajuste positivo',
                'naturaleza_default' => 'ENTRADA',
                'afecta_stock' => true,
                'activo' => true,
            ],
            [
                'codigo' => 'SALIDA_ENTREGA',
                'nombre' => 'Salida por entrega a trabajador',
                'naturaleza_default' => 'SALIDA',
                'afecta_stock' => true,
                'activo' => true,
            ],
            [
                'codigo' => 'SALIDA_TRANSFERENCIA',
                'nombre' => 'Salida por transferencia',
                'naturaleza_default' => 'SALIDA',
                'afecta_stock' => true,
                'activo' => true,
            ],
            [
                'codigo' => 'SALIDA_BAJA',
                'nombre' => 'Salida por baja / disposición final',
                'naturaleza_default' => 'SALIDA',
                'afecta_stock' => true,
                'activo' => true,
            ],
            [
                'codigo' => 'SALIDA_AJUSTE_NEGATIVO',
                'nombre' => 'Salida por ajuste negativo',
                'naturaleza_default' => 'SALIDA',
                'afecta_stock' => true,
                'activo' => true,
            ],
            [
                'codigo' => 'MOVIMIENTO_REFERENCIAL',
                'nombre' => 'Movimiento referencial sin afectar stock',
                'naturaleza_default' => 'ENTRADA',
                'afecta_stock' => false,
                'activo' => true,
            ],
        ];

        foreach ($tipos as $tipo) {
            DB::table('movimiento_tipos')->updateOrInsert(
                ['codigo' => $tipo['codigo']],
                [
                    'nombre' => $tipo['nombre'],
                    'naturaleza_default' => $tipo['naturaleza_default'],
                    'afecta_stock' => $tipo['afecta_stock'],
                    'activo' => $tipo['activo'],
                ]
            );
        }
    }
}