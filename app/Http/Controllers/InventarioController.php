<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
use App\Models\EppIngreso;
use App\Models\EppIngresoDetalle;
use App\Models\EppItem;
use App\Models\EppSku;
use App\Models\MovimientoEpp;
use App\Models\MovimientoTipo;
use App\Models\StockAlmacen;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InventarioController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));

        // ── Items para el formulario ─────────────────────────────────────────
        // NUEVO: incluye stocks por almacén para mostrar disponibilidad en el modal
        $items = EppItem::with([
            'skus' => fn ($q) => $q
                ->with([
                    'talla:id,codigo,nombre',
                    'stocks' => fn ($sq) => $sq
                        ->where('estado_stock', 'DISPONIBLE')
                        ->select(['id', 'almacen_id', 'epp_sku_id', 'cantidad_actual']),
                ])
                ->select(['id', 'epp_item_id', 'talla_id']),
        ])
            ->where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'usa_tallas'])
            ->map(fn ($item) => [
                'id'         => $item->id,
                'nombre'     => $item->nombre,
                'usa_tallas' => (bool) $item->usa_tallas,
                'skus'       => $item->skus->map(fn ($sku) => [
                    'id'           => $sku->id,
                    'talla_codigo' => $sku->talla?->codigo ?? 'UNICA',
                    'talla_nombre' => $sku->talla?->nombre ?? 'Talla Única',
                    // NUEVO: stock por almacén para mostrar disponibilidad en modal
                    'stocks'       => $sku->stocks->map(fn ($s) => [
                        'almacen_id'      => $s->almacen_id,
                        'cantidad_actual' => (int) $s->cantidad_actual,
                    ])->values(),
                ])->values(),
            ])
            ->values();

        // ── Ingresos paginados ────────────────────────────────────────────────
        $query = EppIngreso::query()
            ->with([
                'detalles.sku.item:id,nombre',
                'detalles.sku.talla:id,codigo',
                // NUEVO: carga el movimiento para obtener saldo_anterior y saldo_nuevo
                'detalles.movimientoEntrada:id,saldo_anterior,saldo_nuevo',
                'almacenDestino:id,nombre',
                'user:id,name',
            ])
            ->when($search !== '', fn ($q) =>
                $q->where(fn ($inner) =>
                    $inner->where('documento_guia_remision', 'like', "%{$search}%")
                          ->orWhereHas('detalles.sku.item', fn ($i) =>
                              $i->where('nombre', 'like', "%{$search}%")
                          )
                          ->orWhereHas('user', fn ($u) =>
                              $u->where('name', 'like', "%{$search}%")
                          )
                )
            )
            ->orderByDesc('fecha_ingreso');

        $paginated = $query->paginate(10)->withQueryString();

        $statsBase = EppIngreso::selectRaw('COUNT(*) as total, MAX(fecha_ingreso) as ultimo')->first();
        $unidades  = EppIngresoDetalle::sum('cantidad');

        $ingresos = [
            'data' => collect($paginated->items())->map(fn ($ing) => [
                'id'             => $ing->id,
                'fecha'          => $ing->fecha_ingreso instanceof \Carbon\Carbon
                    ? $ing->fecha_ingreso->format('Y-m-d')
                    : (string) $ing->fecha_ingreso,
                'guia'           => $ing->documento_guia_remision,
                'observaciones'  => $ing->observaciones,
                'almacen'        => $ing->almacenDestino?->nombre,
                'responsable'    => $ing->user?->name,
                'estado'         => $ing->estado,
                'total_unidades' => $ing->detalles->sum('cantidad'),
                'detalles'       => $ing->detalles->map(fn ($det) => [
                    'epp_nombre'     => $det->sku?->item?->nombre ?? '—',
                    'talla'          => $det->sku?->talla?->codigo ?? 'UNICA',
                    'cantidad'       => (int) $det->cantidad,
                    // NUEVO: saldo antes y después del ingreso
                    'saldo_anterior' => $det->movimientoEntrada?->saldo_anterior,
                    'saldo_nuevo'    => $det->movimientoEntrada?->saldo_nuevo,
                ])->values(),
            ])->values(),
            'meta' => [
                'current_page'  => $paginated->currentPage(),
                'last_page'     => $paginated->lastPage(),
                'total'         => $paginated->total(),
                'from'          => $paginated->firstItem(),
                'to'            => $paginated->lastItem(),
                'prev_page_url' => $paginated->previousPageUrl(),
                'next_page_url' => $paginated->nextPageUrl(),
            ],
        ];

        return Inertia::render('Inventario/Index', [
            'items'    => $items,
            'ingresos' => $ingresos,
            'filters'  => ['search' => $search],
            'stats'    => [
                'total_ingresos'      => (int) ($statsBase->total ?? 0),
                'unidades_ingresadas' => (int) $unidades,
                'ultimo_ingreso'      => $statsBase->ultimo,
            ],
            'almacenes' => Almacen::where('activo', true)
                ->where('tipo_almacen', 'OPERATIVO')
                ->get(['id', 'nombre']),
            'authUser' => [
                'id'   => $request->user()->id,
                'name' => $request->user()->name,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'fecha_ingreso'         => 'required|date',
            'numero_guia'           => 'required|string|max:100',
            'observaciones'         => 'nullable|string|max:500',
            'almacen_id'            => 'required|exists:almacenes,id',
            'detalles'              => 'required|array|min:1',
            'detalles.*.epp_sku_id' => 'required|exists:epp_skus,id',
            'detalles.*.cantidad'   => 'required|integer|min:1',
        ]);

        DB::transaction(function () use ($request, $data) {
            $tipoIngreso = MovimientoTipo::firstOrCreate(
                ['codigo' => 'INGRESO_COMPRA'],
                ['nombre' => 'Ingreso por compra', 'naturaleza_default' => 'ENTRADA', 'afecta_stock' => true, 'activo' => true]
            );

            $ingreso = EppIngreso::create([
                'fecha_ingreso'           => $data['fecha_ingreso'],
                'almacen_destino_id'      => $data['almacen_id'],
                'documento_guia_remision' => $data['numero_guia'],
                'observaciones'           => $data['observaciones'] ?? null,
                'estado'                  => 'CONFIRMADO',
                'user_id'                 => $request->user()->id,
            ]);

            foreach ($data['detalles'] as $det) {
                $sku      = EppSku::findOrFail($det['epp_sku_id']);
                $cantidad = (int) $det['cantidad'];

                $stock = StockAlmacen::firstOrCreate(
                    ['almacen_id' => $data['almacen_id'], 'epp_sku_id' => $sku->id, 'estado_stock' => 'DISPONIBLE'],
                    ['cantidad_actual' => 0, 'stock_minimo' => 0]
                );

                $saldoAnterior = $stock->cantidad_actual;
                $saldoNuevo    = $saldoAnterior + $cantidad;
                $stock->update(['cantidad_actual' => $saldoNuevo]);

                $movimiento = MovimientoEpp::create([
                    'fecha_movimiento'   => $data['fecha_ingreso'],
                    'almacen_id'         => $data['almacen_id'],
                    'epp_sku_id'         => $sku->id,
                    'tipo_movimiento_id' => $tipoIngreso->id,
                    'naturaleza'         => 'ENTRADA',
                    'estado_stock'       => 'DISPONIBLE',
                    'cantidad'           => $cantidad,
                    'saldo_anterior'     => $saldoAnterior,
                    'saldo_nuevo'        => $saldoNuevo,
                    'documento_tipo'     => 'GUIA_REMISION',
                    'referencia'         => $data['numero_guia'],
                    'observaciones'      => $data['observaciones'] ?? null,
                    'user_id'            => $request->user()->id,
                ]);

                EppIngresoDetalle::create([
                    'ingreso_id'            => $ingreso->id,
                    'epp_sku_id'            => $sku->id,
                    'cantidad'              => $cantidad,
                    'movimiento_entrada_id' => $movimiento->id,
                ]);
            }
        });

        return back()->with('success', 'Ingreso registrado correctamente.');
    }

    public function create() {}
    public function show(string $id) {}
    public function edit(string $id) {}
    public function update(Request $request, string $id) {}
    public function destroy(string $id) {}
}