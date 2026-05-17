<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
use App\Models\EppSku;
use App\Models\EppTransferencia;
use App\Models\EppTransferenciaDetalle;
use App\Models\MovimientoEpp;
use App\Models\MovimientoTipo;
use App\Models\StockAlmacen;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EppTransferenciaController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────────
    // INDEX
    // ─────────────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        // ── Transferencias paginadas ──────────────────────────────────────────
        $transferencias = EppTransferencia::with([
            'almacenOrigen.proyecto',
            'almacenDestino.proyecto',
            'user:id,name',
            'detalles.sku.item',
            'detalles.sku.talla',
        ])
        ->when($request->estado, fn ($q, $e) => $q->where('estado', $e))
        ->latest('fecha_transferencia')
        ->paginate(20)
        ->through(fn ($t) => [
            'id'                  => $t->id,
            'fecha_transferencia' => $t->fecha_transferencia
                ? \Carbon\Carbon::parse($t->fecha_transferencia)->format('Y-m-d')
                : null,
            'almacen_origen'   => $t->almacenOrigen?->nombre,
            'proyecto_origen'  => $t->almacenOrigen?->proyecto?->nombre,
            'almacen_destino'  => $t->almacenDestino?->nombre,
            'proyecto_destino' => $t->almacenDestino?->proyecto?->nombre,
            'motivo'           => $t->motivo,
            'observaciones'    => $t->observaciones,
            'estado'           => $t->estado,
            'responsable'      => $t->user?->name,
            'detalles'         => $t->detalles->map(fn ($d) => [
                'epp'      => $d->sku?->item?->nombre ?? '—',
                'talla'    => $d->sku?->talla?->codigo ?? 'ÚNICA',
                'cantidad' => $d->cantidad,
            ])->values(),
        ])
        ->withQueryString();

        // ── Almacenes activos ─────────────────────────────────────────────────
        $almacenesActivos = Almacen::where('activo', true)
            ->get(['id', 'nombre', 'tipo_almacen', 'proyecto_id']);

        $almacenIds = $almacenesActivos->pluck('id')->toArray();

        // ── stockPorAlmacen — JOIN directo en vez de eager loading anidado ────
        //
        // El eager loading con relaciones anidadas (.sku.item.categoria) falla
        // silenciosamente si alguna relación no está definida en el modelo o
        // si hay un mismatch de FK. El JOIN directo es explícito y no tiene esa
        // fragilidad: si el registro existe en las tablas, aparece.
        //
        $rows = DB::table('stock_almacen as sa')
            ->join('epp_skus as es', 'sa.epp_sku_id', '=', 'es.id')
            ->join('epp_items as ei', 'es.epp_item_id', '=', 'ei.id')
            ->leftJoin('epp_categorias as ec', 'ei.categoria_id', '=', 'ec.id')
            ->leftJoin('tallas as t', 'es.talla_id', '=', 't.id')
            ->whereIn('sa.almacen_id', $almacenIds)
            ->where('sa.cantidad_actual', '>', 0)
            ->whereIn('sa.estado_stock', ['DISPONIBLE', 'DANADO'])
            ->where('es.activo', 1)
            ->where('ei.activo', 1)
            ->select([
                'sa.almacen_id',
                'sa.epp_sku_id as sku_id',
                'sa.estado_stock',
                'sa.cantidad_actual',
                'es.epp_item_id',
                'ei.nombre as item_nombre',
                'ei.usa_tallas',
                'ec.nombre as categoria_nombre',
                't.codigo as talla_codigo',
                't.nombre as talla_nombre_completo',
            ])
            ->orderBy('ei.nombre')
            ->get();

        // Inicializar estructura vacía para cada almacén
        $grouped = [];
        foreach ($almacenIds as $id) {
            $grouped[$id] = [];
        }

        // Agrupar: almacen_id → epp_item_id → sku_id
        foreach ($rows as $row) {
            $aId  = $row->almacen_id;
            $iId  = $row->epp_item_id;
            $sId  = $row->sku_id;

            if (! isset($grouped[$aId][$iId])) {
                $grouped[$aId][$iId] = [
                    'epp_item_id' => $iId,
                    'nombre'      => $row->item_nombre,
                    'categoria'   => $row->categoria_nombre,
                    'usa_tallas'  => (bool) $row->usa_tallas,
                    'skus'        => [],
                ];
            }

            if (! isset($grouped[$aId][$iId]['skus'][$sId])) {
                $grouped[$aId][$iId]['skus'][$sId] = [
                    'sku_id'           => $sId,
                    'talla'            => $row->talla_codigo ?? 'ÚNICA',
                    'talla_nombre'     => $row->talla_nombre_completo ?? 'Talla Única',
                    'stock_disponible' => 0,
                    'stock_danado'     => 0,
                ];
            }

            if ($row->estado_stock === 'DISPONIBLE') {
                $grouped[$aId][$iId]['skus'][$sId]['stock_disponible'] += $row->cantidad_actual;
            } elseif ($row->estado_stock === 'DANADO') {
                $grouped[$aId][$iId]['skus'][$sId]['stock_danado'] += $row->cantidad_actual;
            }
        }

        // Convertir a arrays indexados y ordenar por nombre
        $stockPorAlmacen = [];
        foreach ($almacenesActivos as $almacen) {
            $items = [];
            foreach ($grouped[$almacen->id] ?? [] as $itemData) {
                $skus = array_values(array_filter(
                    $itemData['skus'],
                    fn ($s) => $s['stock_disponible'] > 0 || $s['stock_danado'] > 0
                ));
                if (empty($skus)) {
                    continue;
                }
                $itemData['skus'] = $skus;
                $items[] = $itemData;

            }
            usort($items, fn ($a, $b) => strcmp($a['nombre'], $b['nombre']));
            $stockPorAlmacen[$almacen->id] = array_values($items);
        }

        // ── Stats — UNA SOLA QUERY en vez de 3 COUNT separados ───────────────
        $statsRaw = EppTransferencia::selectRaw("
            COUNT(*) as total,
            SUM(estado = 'CONFIRMADO') as confirmadas,
            SUM(estado = 'BORRADOR')   as borradores
        ")->first();

        $stats = [
            'total'       => (int) ($statsRaw->total       ?? 0),
            'confirmadas' => (int) ($statsRaw->confirmadas ?? 0),
            'borradores'  => (int) ($statsRaw->borradores  ?? 0),
        ];

        // ── eppItemsPorAlmacen — EPPs por almacén SIN filtro de cantidad ─────────
        // Igual que stockPorAlmacen pero sin WHERE cantidad_actual > 0.
        // Sirve para el selector de destino: muestra solo los EPPs que tienen
        // un registro en stock_almacen para ese almacén, aunque tengan 0 uds.
        // Así el selector de destino nunca mezcla EPPs de otros almacenes.
        $rowsConCero = DB::table('stock_almacen as sa')
            ->join('epp_skus as es', 'sa.epp_sku_id', '=', 'es.id')
            ->join('epp_items as ei', 'es.epp_item_id', '=', 'ei.id')
            ->leftJoin('epp_categorias as ec', 'ei.categoria_id', '=', 'ec.id')
            ->leftJoin('tallas as t', 'es.talla_id', '=', 't.id')
            ->whereIn('sa.almacen_id', $almacenIds)
            ->whereIn('sa.estado_stock', ['DISPONIBLE', 'DANADO'])
            ->where('es.activo', 1)
            ->where('ei.activo', 1)
            ->select([
                'sa.almacen_id',
                'sa.epp_sku_id as sku_id',
                'es.epp_item_id',
                'ei.nombre as item_nombre',
                'ei.usa_tallas',
                'ec.nombre as categoria_nombre',
                't.codigo as talla_codigo',
                't.nombre as talla_nombre_completo',
            ])
            ->orderBy('ei.nombre')
            ->get();

        $groupedConCero = [];
        foreach ($almacenIds as $id) {
            $groupedConCero[$id] = [];
        }
        foreach ($rowsConCero as $row) {
            $aId = $row->almacen_id;
            $iId = $row->epp_item_id;
            $sId = $row->sku_id;
            if (! isset($groupedConCero[$aId][$iId])) {
                $groupedConCero[$aId][$iId] = [
                    'epp_item_id' => $iId,
                    'nombre'      => $row->item_nombre,
                    'categoria'   => $row->categoria_nombre,
                    'usa_tallas'  => (bool) $row->usa_tallas,
                    'skus'        => [],
                ];
            }
            if (! isset($groupedConCero[$aId][$iId]['skus'][$sId])) {
                $groupedConCero[$aId][$iId]['skus'][$sId] = [
                    'sku_id'      => $sId,
                    'talla'       => $row->talla_codigo ?? 'ÚNICA',
                    'talla_nombre'=> $row->talla_nombre_completo ?? 'Talla Única',
                ];
            }
        }
        $eppItemsPorAlmacen = [];
        foreach ($almacenesActivos as $almacen) {
            $items = [];
            foreach ($groupedConCero[$almacen->id] ?? [] as $itemData) {
                $itemData['skus'] = array_values($itemData['skus']);
                $items[] = $itemData;
            }
            usort($items, fn ($a, $b) => strcmp($a['nombre'], $b['nombre']));
            $eppItemsPorAlmacen[$almacen->id] = array_values($items);
        }

        return Inertia::render('Transferencias/Index', [
            'transferencias'     => $transferencias,
            'stockPorAlmacen'    => $stockPorAlmacen,
            'eppItemsPorAlmacen' => $eppItemsPorAlmacen,   // ← reemplaza todosEppItems
            'almacenes'          => $almacenesActivos->map(fn ($a) => [
                'id'           => $a->id,
                'nombre'       => $a->nombre,
                'tipo_almacen' => $a->tipo_almacen,
                'proyecto_id'  => $a->proyecto_id,
            ]),
            'stats'   => $stats,
            'filters' => $request->only(['estado']),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STORE
    // ─────────────────────────────────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'fecha_transferencia'          => 'required|date',
            'almacen_origen_id'            => 'required|exists:almacenes,id',
            'almacen_destino_id'           => 'required|exists:almacenes,id|different:almacen_origen_id',
            'motivo'                       => 'nullable|string|max:255',
            'observaciones'                => 'nullable|string|max:1000',
            'detalles'                     => 'required|array|min:1',
            'detalles.*.epp_sku_id'        => 'required|exists:epp_skus,id',
            'detalles.*.dest_epp_sku_id'   => 'required|exists:epp_skus,id',   // SKU en el almacén destino
            'detalles.*.cantidad'          => 'required|integer|min:1',
            'detalles.*.estado_stock'      => 'required|in:DISPONIBLE,DANADO',
        ]);

        // Validar SKUs duplicados en el mismo formulario
        $skuIds = array_column($validated['detalles'], 'epp_sku_id');
        $skuIdsUnicos = array_unique(array_map('intval', $skuIds));
        if (count($skuIds) !== count($skuIdsUnicos)) {
            throw ValidationException::withMessages([
                'detalles' => 'No puedes transferir el mismo EPP/SKU más de una vez en la misma operación. Combínalos en una sola fila.',
            ]);
        }

        DB::transaction(function () use ($validated) {
            $transferencia = EppTransferencia::create([
                'fecha_transferencia' => $validated['fecha_transferencia'],
                'almacen_origen_id'   => $validated['almacen_origen_id'],
                'almacen_destino_id'  => $validated['almacen_destino_id'],
                'motivo'              => $validated['motivo'],
                'observaciones'       => $validated['observaciones'],
                'estado'              => 'CONFIRMADO',
                'user_id'             => Auth::id(),
            ]);

            // Cargar los tipos de movimiento una sola vez (fuera del loop)
            $tipoSalida  = MovimientoTipo::where('codigo', 'SALIDA_TRANSFERENCIA')->firstOrFail();
            $tipoEntrada = MovimientoTipo::where('codigo', 'INGRESO_TRANSFERENCIA')->firstOrFail();

            foreach ($validated['detalles'] as $index => $det) {
                $cantidad    = (int) $det['cantidad'];
                $estadoStock = $det['estado_stock'];
                $eppSkuId    = (int) $det['epp_sku_id'];
                // dest_epp_sku_id permite que el usuario mapee explícitamente qué SKU
                // del almacén destino recibe el stock. Normalmente es el mismo que el
                // origen (mismo SKU compartido entre almacenes), pero el usuario puede
                // elegir un SKU diferente si los registros divergieron.
                $destSkuId   = (int) $det['dest_epp_sku_id'];

                // ── 1. Verificar y descontar stock origen ─────────────────────
                $stockOrigen = StockAlmacen::where([
                    'almacen_id'   => $validated['almacen_origen_id'],
                    'epp_sku_id'   => $eppSkuId,
                    'estado_stock' => $estadoStock,
                ])->lockForUpdate()->first();

                if (! $stockOrigen || $stockOrigen->cantidad_actual < $cantidad) {
                    $sku    = EppSku::with('item:id,nombre', 'talla:id,codigo')->find($eppSkuId);
                    $nombre = $sku?->item?->nombre ?? "SKU #{$eppSkuId}";
                    $talla  = $sku?->talla?->codigo ? " T.{$sku->talla->codigo}" : '';
                    throw ValidationException::withMessages([
                        "detalles.{$index}.cantidad" =>
                            "Stock insuficiente de {$nombre}{$talla}. " .
                            'Disponible: ' . ($stockOrigen?->cantidad_actual ?? 0),
                    ]);
                }

                $saldoOrigenAntes = $stockOrigen->cantidad_actual;
                $stockOrigen->decrement('cantidad_actual', $cantidad);

                // Kardex: SALIDA del origen
                $movSalida = MovimientoEpp::create([
                    'fecha_movimiento'   => $validated['fecha_transferencia'],
                    'almacen_id'         => $validated['almacen_origen_id'],
                    'epp_sku_id'         => $eppSkuId,
                    'tipo_movimiento_id' => $tipoSalida->id,
                    'naturaleza'         => 'SALIDA',
                    'estado_stock'       => $estadoStock,
                    'cantidad'           => $cantidad,
                    'saldo_anterior'     => $saldoOrigenAntes,
                    'saldo_nuevo'        => $stockOrigen->cantidad_actual,
                    'documento_tipo'     => 'TRANSFERENCIA',
                    'documento_id'       => $transferencia->id,
                    'observaciones'      => $validated['motivo'] ?? null,
                    'user_id'            => Auth::id(),
                ]);

                // ── 2. Incrementar/crear stock destino SIN duplicar ───────────
                //
                // Se busca por los tres campos clave: almacen_id + epp_sku_id + estado_stock.
                // Si existe → increment (suma la cantidad al saldo actual).
                // Si no existe → create (nueva fila en stock_almacen, NUNCA en epp_items/epp_skus).
                //
                $stockDestino = StockAlmacen::where([
                    'almacen_id'   => $validated['almacen_destino_id'],
                    'epp_sku_id'   => $destSkuId,
                    'estado_stock' => $estadoStock,
                ])->lockForUpdate()->first();

                if ($stockDestino) {
                    $saldoDestinoAntes = $stockDestino->cantidad_actual;
                    $stockDestino->increment('cantidad_actual', $cantidad);
                } else {
                    $saldoDestinoAntes = 0;
                    $stockDestino = StockAlmacen::create([
                        'almacen_id'      => $validated['almacen_destino_id'],
                        'epp_sku_id'      => $destSkuId,
                        'estado_stock'    => $estadoStock,
                        'cantidad_actual' => $cantidad,
                        'stock_minimo'    => 0,
                    ]);
                }

                // Kardex: ENTRADA al destino
                $movEntrada = MovimientoEpp::create([
                    'fecha_movimiento'   => $validated['fecha_transferencia'],
                    'almacen_id'         => $validated['almacen_destino_id'],
                    'epp_sku_id'         => $destSkuId,
                    'tipo_movimiento_id' => $tipoEntrada->id,
                    'naturaleza'         => 'ENTRADA',
                    'estado_stock'       => $estadoStock,
                    'cantidad'           => $cantidad,
                    'saldo_anterior'     => $saldoDestinoAntes,
                    'saldo_nuevo'        => $stockDestino->cantidad_actual,
                    'documento_tipo'     => 'TRANSFERENCIA',
                    'documento_id'       => $transferencia->id,
                    'observaciones'      => $validated['motivo'] ?? null,
                    'user_id'            => Auth::id(),
                ]);

                EppTransferenciaDetalle::create([
                    'transferencia_id'      => $transferencia->id,
                    'epp_sku_id'            => $eppSkuId,
                    'cantidad'              => $cantidad,
                    'movimiento_salida_id'  => $movSalida->id,
                    'movimiento_entrada_id' => $movEntrada->id,
                ]);
            }
        });

        return back()->with('success', 'Transferencia registrada. El stock ha sido actualizado correctamente.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ANULAR
    // ─────────────────────────────────────────────────────────────────────────

    public function anular(EppTransferencia $transferencia): RedirectResponse
    {
        if ($transferencia->estado === 'ANULADO') {
            return back()->with('error', 'Esta transferencia ya está anulada.');
        }

        DB::transaction(function () use ($transferencia) {
            // Cargar detalles con el movimiento de salida para recuperar el estado_stock real.
            // IMPORTANTE: no hardcodear 'DISPONIBLE' — si se transfirieron EPP DAÑADOS,
            // la reversión debe operar sobre el mismo estado_stock original.
            $detalles = $transferencia->detalles()
                ->with('movimientoSalida:id,estado_stock')
                ->get();

            foreach ($detalles as $detalle) {
                // Obtener el estado_stock del movimiento original de salida
                $estadoStock = $detalle->movimientoSalida?->estado_stock ?? 'DISPONIBLE';

                // ── Devolver cantidad al origen ───────────────────────────────
                $stockOrigen = StockAlmacen::where([
                    'almacen_id'   => $transferencia->almacen_origen_id,
                    'epp_sku_id'   => $detalle->epp_sku_id,
                    'estado_stock' => $estadoStock,
                ])->lockForUpdate()->first();

                if ($stockOrigen) {
                    $stockOrigen->increment('cantidad_actual', $detalle->cantidad);
                } else {
                    // Puede ocurrir si el registro fue borrado manualmente
                    StockAlmacen::create([
                        'almacen_id'      => $transferencia->almacen_origen_id,
                        'epp_sku_id'      => $detalle->epp_sku_id,
                        'estado_stock'    => $estadoStock,
                        'cantidad_actual' => $detalle->cantidad,
                        'stock_minimo'    => 0,
                    ]);
                }

                // ── Quitar cantidad del destino ───────────────────────────────
                $stockDestino = StockAlmacen::where([
                    'almacen_id'   => $transferencia->almacen_destino_id,
                    'epp_sku_id'   => $detalle->epp_sku_id,
                    'estado_stock' => $estadoStock,
                ])->lockForUpdate()->first();

                if ($stockDestino) {
                    $nuevoSaldo = max(0, $stockDestino->cantidad_actual - $detalle->cantidad);
                    $stockDestino->update(['cantidad_actual' => $nuevoSaldo]);
                }
            }

            // Marcar movimientos como anulados en el kardex
            MovimientoEpp::where('documento_tipo', 'TRANSFERENCIA')
                ->where('documento_id', $transferencia->id)
                ->update(['observaciones' => '[ANULADO] ' . ($transferencia->motivo ?? '')]);

            $transferencia->update(['estado' => 'ANULADO']);
        });

        return back()->with('success', 'Transferencia anulada y stock revertido.');
    }

    // Métodos vacíos requeridos por el resource route
    public function create() {}
    public function show(string $id) {}
    public function edit(string $id) {}
    public function update(Request $request, string $id) {}
    public function destroy(string $id) {}
}