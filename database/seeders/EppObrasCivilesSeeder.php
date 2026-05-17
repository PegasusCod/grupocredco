<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class EppObrasCivilesSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $now = now();

            $normalizar = fn ($valor) => Str::lower(Str::squish(Str::ascii($valor)));

            /*
            |--------------------------------------------------------------------------
            | Proyecto y almacén
            |--------------------------------------------------------------------------
            */

            DB::table('proyectos')->updateOrInsert(
                ['nombre' => 'Proyecto Obras Civiles'],
                [
                    'activo' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );

            $proyecto = DB::table('proyectos')
                ->where('nombre', 'Proyecto Obras Civiles')
                ->first();

            if (! $proyecto) {
                throw new RuntimeException('No se encontró el proyecto Proyecto Obras Civiles.');
            }

            DB::table('almacenes')->updateOrInsert(
                ['nombre' => 'Almacén Obras Civiles'],
                [
                    'proyecto_id' => $proyecto->id,
                    'tipo_almacen' => 'OPERATIVO',
                    'compartido' => 0,
                    'activo' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );

            $almacen = DB::table('almacenes')
                ->where('nombre', 'Almacén Obras Civiles')
                ->first();

            if (! $almacen) {
                throw new RuntimeException('No se encontró el almacén Almacén Obras Civiles.');
            }

            /*
            |--------------------------------------------------------------------------
            | Categorías EPP
            |--------------------------------------------------------------------------
            */

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

            foreach ($categorias as $categoria) {
                DB::table('epp_categorias')->updateOrInsert(
                    ['nombre' => $categoria],
                    [
                        'activo' => 1,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }

            $categoriaIds = DB::table('epp_categorias')
                ->get(['id', 'nombre'])
                ->mapWithKeys(fn ($categoria) => [
                    $normalizar($categoria->nombre) => $categoria->id,
                ])
                ->all();

            /*
            |--------------------------------------------------------------------------
            | Tallas
            |--------------------------------------------------------------------------
            */

            $tallas = [
                ['codigo' => 'N/A', 'nombre' => 'No aplica', 'orden_visual' => 0],
                ['codigo' => 'XS', 'nombre' => 'Extra Small', 'orden_visual' => 1],
                ['codigo' => 'S', 'nombre' => 'Small', 'orden_visual' => 2],
                ['codigo' => 'M', 'nombre' => 'Medium', 'orden_visual' => 3],
                ['codigo' => 'L', 'nombre' => 'Large', 'orden_visual' => 4],
                ['codigo' => 'XL', 'nombre' => 'Extra Large', 'orden_visual' => 5],
                ['codigo' => 'XXL', 'nombre' => 'Double Extra Large', 'orden_visual' => 6],
                ['codigo' => '36', 'nombre' => 'Talla 36', 'orden_visual' => 10],
                ['codigo' => '37', 'nombre' => 'Talla 37', 'orden_visual' => 11],
                ['codigo' => '38', 'nombre' => 'Talla 38', 'orden_visual' => 12],
                ['codigo' => '39', 'nombre' => 'Talla 39', 'orden_visual' => 13],
                ['codigo' => '40', 'nombre' => 'Talla 40', 'orden_visual' => 14],
                ['codigo' => '41', 'nombre' => 'Talla 41', 'orden_visual' => 15],
                ['codigo' => '42', 'nombre' => 'Talla 42', 'orden_visual' => 16],
                ['codigo' => '43', 'nombre' => 'Talla 43', 'orden_visual' => 17],
                ['codigo' => '44', 'nombre' => 'Talla 44', 'orden_visual' => 18],
                ['codigo' => '45', 'nombre' => 'Talla 45', 'orden_visual' => 19],
                ['codigo' => 'UNICA', 'nombre' => 'Talla Única', 'orden_visual' => 99],
            ];

            foreach ($tallas as $talla) {
                DB::table('tallas')->updateOrInsert(
                    ['codigo' => $talla['codigo']],
                    [
                        'nombre' => $talla['nombre'],
                        'orden_visual' => $talla['orden_visual'],
                        'activo' => 1,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }

            $tallaIds = DB::table('tallas')
                ->get(['id', 'codigo'])
                ->mapWithKeys(fn ($talla) => [
                    Str::upper($talla->codigo) => $talla->id,
                ])
                ->all();

            /*
            |--------------------------------------------------------------------------
            | EPP + SKUS + Stock para Almacén Obras Civiles
            |--------------------------------------------------------------------------
            |
            | cantidad_actual: tomada del kardex.
            | stock_minimo: tomado de la columna "cantidad requerida".
            | marca: ficticia cuando no había dato.
            |
            */

            $items = [
                [
                    'nombre' => 'RESPIRADOR',
                    'categoria' => 'Protección Respiratoria',
                    'marca' => 'PROSAFE',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 6,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 16, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'CARTUCHO P/POLVO P100',
                    'categoria' => 'Protección Respiratoria',
                    'marca' => 'AIRMASK',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 6,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 0, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'CARTUCHO P/GASES 6003',
                    'categoria' => 'Protección Respiratoria',
                    'marca' => 'AIRMASK',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 6,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 23, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'ADAPTADOR DE FILTRO',
                    'categoria' => 'Protección Respiratoria',
                    'marca' => 'AIRMASK',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 12,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 48, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'CASCO DE SEGURIDAD NARANJA',
                    'categoria' => 'Protección de Cabeza',
                    'marca' => 'SPRO',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 6,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 36, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'CASCO DE SEGURIDAD BLANCO',
                    'categoria' => 'Protección de Cabeza',
                    'marca' => 'TRIDENTE',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 6,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 0, 'stock_minimo' => 6],
                    ],
                ],
                [
                    'nombre' => 'CASCO DE SEGURIDAD AZUL',
                    'categoria' => 'Protección de Cabeza',
                    'marca' => 'SEGMAX',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 6,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 0, 'stock_minimo' => 2],
                    ],
                ],
                [
                    'nombre' => 'TAFILETE',
                    'categoria' => 'Protección de Cabeza',
                    'marca' => 'HELMETPRO',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 6,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 16, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'CORTAVIENTO',
                    'categoria' => 'Protección de Cabeza',
                    'marca' => 'SEGMAX',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 6,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 9, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'BARBIQUEJO',
                    'categoria' => 'Protección de Cabeza',
                    'marca' => 'HELMETPRO',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 6,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 19, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'PROTECTOR AUDITIVO TAPÓN',
                    'categoria' => 'Protección Auditiva',
                    'marca' => 'AUDIPRO',
                    'unidad_medida' => 'PAR',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 6,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 40, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'PROTECTOR AUDITIVO OREJERA',
                    'categoria' => 'Protección Auditiva',
                    'marca' => 'AUDIPRO',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 12,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 3, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'LENTES DE SEGURIDAD CLAROS',
                    'categoria' => 'Protección Visual',
                    'marca' => 'VISSAFE',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 6,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 2, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'LENTES DE SEGURIDAD OSCUROS',
                    'categoria' => 'Protección Visual',
                    'marca' => 'VISSAFE',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 6,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 8, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'LENTES GOGGLES',
                    'categoria' => 'Protección Visual',
                    'marca' => 'GOGGLEMAX',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 6,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 12, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'CLIP O ADAPTADOR DE VISOR',
                    'categoria' => 'Protección Visual',
                    'marca' => 'FACEPRO',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 6,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 7, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'VISOR PARA PROTECTOR FACIAL',
                    'categoria' => 'Protección Visual',
                    'marca' => 'FACEPRO',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 6,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 8, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'GUANTES DE JEBE',
                    'categoria' => 'Protección de Manos',
                    'marca' => 'HANDSAFE',
                    'unidad_medida' => 'PAR',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 3,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 30, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'GUANTES NITRILO',
                    'categoria' => 'Protección de Manos',
                    'marca' => 'NITRIGUARD',
                    'unidad_medida' => 'PAR',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 3,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 23, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'GUANTES ANTICORTE',
                    'categoria' => 'Protección de Manos',
                    'marca' => 'CUTSAFE',
                    'unidad_medida' => 'PAR',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 3,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 36, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'GUANTES DE BADANA',
                    'categoria' => 'Protección de Manos',
                    'marca' => 'BADANPRO',
                    'unidad_medida' => 'PAR',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 3,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 22, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'GUANTES CUERO AMARILLO',
                    'categoria' => 'Protección de Manos',
                    'marca' => 'LEATHERMAX',
                    'unidad_medida' => 'PAR',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 3,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 16, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'GUANTES CUERO REFORZADO',
                    'categoria' => 'Protección de Manos',
                    'marca' => 'LEATHERMAX',
                    'unidad_medida' => 'PAR',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 3,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 0, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'DISPENSADOR / BLOQUEADOR',
                    'categoria' => 'Protección Corporal',
                    'marca' => 'DERMASAFE',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 3,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 48, 'stock_minimo' => 5],
                    ],
                ],
                [
                    'nombre' => 'CAMISA CON CINTA REFLECTIVA',
                    'categoria' => 'Protección Corporal',
                    'marca' => 'REFLECTPRO',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 1,
                    'vida_util_meses' => 12,
                    'skus' => [
                        ['talla' => 'S', 'cantidad_actual' => 26, 'stock_minimo' => 10],
                        ['talla' => 'M', 'cantidad_actual' => 20, 'stock_minimo' => 10],
                        ['talla' => 'L', 'cantidad_actual' => 5, 'stock_minimo' => 10],
                        ['talla' => 'XL', 'cantidad_actual' => 3, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'PANTALÓN CON CINTA REFLECTIVA',
                    'categoria' => 'Protección Corporal',
                    'marca' => 'REFLECTPRO',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 1,
                    'vida_util_meses' => 12,
                    'skus' => [
                        ['talla' => 'S', 'cantidad_actual' => 36, 'stock_minimo' => 10],
                        ['talla' => 'M', 'cantidad_actual' => 21, 'stock_minimo' => 10],
                        ['talla' => 'L', 'cantidad_actual' => 5, 'stock_minimo' => 10],
                        ['talla' => 'XL', 'cantidad_actual' => 3, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'CHOMPA JORGE CHAVEZ',
                    'categoria' => 'Protección Corporal',
                    'marca' => 'REFLECTPRO',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 1,
                    'vida_util_meses' => 12,
                    'skus' => [
                        ['talla' => 'S', 'cantidad_actual' => 11, 'stock_minimo' => 10],
                        ['talla' => 'M', 'cantidad_actual' => 34, 'stock_minimo' => 10],
                        ['talla' => 'L', 'cantidad_actual' => 18, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'APRÓN DE CUERO',
                    'categoria' => 'Protección Corporal',
                    'marca' => 'LEATHERMAX',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 12,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 6, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'TRAJE TYVEK',
                    'categoria' => 'Protección Corporal',
                    'marca' => 'PROSAFE',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 12,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 0, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'CAPOTÍN / ROPA PARA AGUA',
                    'categoria' => 'Protección Corporal',
                    'marca' => 'RAINSAFE',
                    'unidad_medida' => 'UND',
                    'usa_tallas' => 0,
                    'vida_util_meses' => 12,
                    'skus' => [
                        ['talla' => 'UNICA', 'cantidad_actual' => 21, 'stock_minimo' => 10],
                    ],
                ],
                [
                    'nombre' => 'ZAPATO DE SEGURIDAD',
                    'categoria' => 'Protección de Pies',
                    'marca' => 'FOOTSAFE',
                    'unidad_medida' => 'PAR',
                    'usa_tallas' => 1,
                    'vida_util_meses' => 12,
                    'skus' => [
                        ['talla' => '37', 'cantidad_actual' => 13, 'stock_minimo' => 6],
                        ['talla' => '38', 'cantidad_actual' => 8, 'stock_minimo' => 6],
                        ['talla' => '39', 'cantidad_actual' => 4, 'stock_minimo' => 6],
                        ['talla' => '40', 'cantidad_actual' => 2, 'stock_minimo' => 6],
                        ['talla' => '41', 'cantidad_actual' => 8, 'stock_minimo' => 6],
                        ['talla' => '42', 'cantidad_actual' => 3, 'stock_minimo' => 6],
                        ['talla' => '43', 'cantidad_actual' => 6, 'stock_minimo' => 6],
                        ['talla' => '44', 'cantidad_actual' => 4, 'stock_minimo' => 6],
                    ],
                ],
                [
                    'nombre' => 'BOTAS DE JEBE PUNTA DE ACERO',
                    'categoria' => 'Protección de Pies',
                    'marca' => 'BOOTSAFE',
                    'unidad_medida' => 'PAR',
                    'usa_tallas' => 1,
                    'vida_util_meses' => 12,
                    'skus' => [
                        ['talla' => '37', 'cantidad_actual' => 4, 'stock_minimo' => 7],
                        ['talla' => '38', 'cantidad_actual' => 5, 'stock_minimo' => 7],
                        ['talla' => '39', 'cantidad_actual' => 3, 'stock_minimo' => 7],
                        ['talla' => '40', 'cantidad_actual' => 6, 'stock_minimo' => 7],
                        ['talla' => '41', 'cantidad_actual' => 6, 'stock_minimo' => 7],
                        ['talla' => '42', 'cantidad_actual' => 4, 'stock_minimo' => 7],
                        ['talla' => '43', 'cantidad_actual' => 4, 'stock_minimo' => 7],
                    ],
                ],
            ];

            foreach ($items as $item) {
                $categoriaKey = $normalizar($item['categoria']);

                if (! isset($categoriaIds[$categoriaKey])) {
                    throw new RuntimeException('No existe la categoría EPP: ' . $item['categoria']);
                }

                DB::table('epp_items')->updateOrInsert(
                    ['nombre' => $item['nombre']],
                    [
                        'categoria_id' => $categoriaIds[$categoriaKey],
                        'marca' => $item['marca'],
                        'unidad_medida' => $item['unidad_medida'],
                        'usa_tallas' => $item['usa_tallas'],
                        'vida_util_meses' => $item['vida_util_meses'],
                        'imagen_url' => null,
                        'activo' => 1,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );

                $eppItem = DB::table('epp_items')
                    ->where('nombre', $item['nombre'])
                    ->first();

                if (! $eppItem) {
                    throw new RuntimeException('No se pudo crear/encontrar el EPP: ' . $item['nombre']);
                }

                foreach ($item['skus'] as $sku) {
                    $codigoTalla = Str::upper($sku['talla']);

                    if (! isset($tallaIds[$codigoTalla])) {
                        throw new RuntimeException('No existe la talla: ' . $codigoTalla);
                    }

                    DB::table('epp_skus')->updateOrInsert(
                        [
                            'epp_item_id' => $eppItem->id,
                            'talla_id' => $tallaIds[$codigoTalla],
                        ],
                        [
                            'activo' => 1,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]
                    );

                    $eppSku = DB::table('epp_skus')
                        ->where('epp_item_id', $eppItem->id)
                        ->where('talla_id', $tallaIds[$codigoTalla])
                        ->first();

                    if (! $eppSku) {
                        throw new RuntimeException('No se pudo crear/encontrar SKU para: ' . $item['nombre']);
                    }

                    $cantidadActual = max(0, (int) $sku['cantidad_actual']);
                    $stockMinimo = max(0, (int) $sku['stock_minimo']);

                    DB::table('stock_almacen')->updateOrInsert(
                        [
                            'almacen_id' => $almacen->id,
                            'epp_sku_id' => $eppSku->id,
                        ],
                        [
                            'estado_stock' => 'DISPONIBLE',
                            'cantidad_actual' => $cantidadActual,
                            'stock_minimo' => $stockMinimo,
                            'stock_maximo' => null,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]
                    );
                }
            }
        });
    }
}