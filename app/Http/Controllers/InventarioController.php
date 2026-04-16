<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
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
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));

        $items = EppItem::with([
            'categoria:id,nombre',
            'skus' => fn ($q) => $q->with('talla:id,codigo,nombre', 'stocks.almacen'),
        ])
            ->where('activo', true)
            ->orderBy('nombre')
            ->get()
            ->map(fn ($item) => [
                'id'          => $item->id,
                'nombre'      => $item->nombre,
                'codigo'      => 'EPP-' . str_pad((string) $item->id, 3, '0', STR_PAD_LEFT),
                'categoria'   => $item->categoria?->nombre,
                'usa_tallas'  => (bool) $item->usa_tallas,
                'stock_total' => (int) $item->skus->flatMap->stocks->where('estado_stock', 'DISPONIBLE')->sum('cantidad_actual'),
                'skus'        => $item->skus->map(fn ($sku) => [
                    'id'    => $sku->id,
                    'talla' => $sku->talla?->codigo ?? 'UNICA',
                    'stocks' => $sku->stocks->map(fn ($s) => [
                        'almacen_id'      => $s->almacen_id,
                        'almacen_nombre'  => $s->almacen?->nombre,
                        'estado_stock'    => $s->estado_stock,
                        'cantidad_actual' => $s->cantidad_actual,
                    ])->values(),
                ])->values(),
            ])
            ->values();

        $query = MovimientoEpp::query()
            ->with([
                'sku.item:id,nombre',
                'sku.talla:id,codigo,nombre',
                'almacen:id,nombre',
                'tipoMovimiento:id,nombre,codigo',
                'user:id,name',
            ])
            ->where('naturaleza', 'ENTRADA')
            ->whereHas('tipoMovimiento', fn ($q) =>
                $q->where('codigo', 'INGRESO_GUIA_REMISION')
            )
            ->when($search !== '', fn ($q) =>
                $q->where(fn ($inner) =>
                    $inner->where('referencia', 'like', "%{$search}%")
                          ->orWhereHas('sku.item', fn ($i) =>
                              $i->where('nombre', 'like', "%{$search}%")
                          )
                          ->orWhereHas('user', fn ($u) =>
                              $u->where('name', 'like', "%{$search}%")
                          )
                )
            )
            ->orderByDesc('fecha_movimiento');

        $paginated = $query->paginate(10)->withQueryString();

        $ingresos = [
            'data' => collect($paginated->items())->map(fn ($mov) => [
                'id'             => $mov->id,
                'fecha'          => $mov->fecha_movimiento->format('Y-m-d'),
                'lote'           => $mov->referencia,
                'cantidad'       => $mov->cantidad,
                'saldo_anterior' => $mov->saldo_anterior,
                'saldo_nuevo'    => $mov->saldo_nuevo,
                'talla'          => $mov->sku?->talla?->codigo ?? 'UNICA',
                'almacen'        => $mov->almacen?->nombre,
                'observaciones'  => $mov->observaciones,
                'responsable'    => $mov->user?->name,
                'epp' => [
                    'id'     => $mov->sku?->item?->id,
                    'nombre' => $mov->sku?->item?->nombre,
                    'codigo' => $mov->sku?->item
                        ? 'EPP-' . str_pad((string) $mov->sku->item->id, 3, '0', STR_PAD_LEFT)
                        : null,
                ],
            ])->values(),
            'meta' => [
                'current_page'  => $paginated->currentPage(),
                'last_page'     => $paginated->lastPage(),
                'per_page'      => $paginated->perPage(),
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
                'total_ingresos'      => MovimientoEpp::where('naturaleza', 'ENTRADA')
                    ->whereHas('tipoMovimiento', fn ($q) => $q->where('codigo', 'INGRESO_GUIA_REMISION'))
                    ->count(),
                'unidades_ingresadas' => (int) MovimientoEpp::where('naturaleza', 'ENTRADA')
                    ->whereHas('tipoMovimiento', fn ($q) => $q->where('codigo', 'INGRESO_GUIA_REMISION'))
                    ->sum('cantidad'),
                'ultimo_ingreso'      => MovimientoEpp::where('naturaleza', 'ENTRADA')
                    ->whereHas('tipoMovimiento', fn ($q) => $q->where('codigo', 'INGRESO_GUIA_REMISION'))
                    ->latest('fecha_movimiento')
                    ->value('fecha_movimiento')
                    ?->format('Y-m-d'),
            ],
            'almacenes' => Almacen::where('activo', true)
                ->where('tipo_almacen', 'OPERATIVO')
                ->with('proyecto:id,nombre')
                ->get(['id', 'nombre', 'proyecto_id']),
            'authUser' => [
                'id'   => $request->user()->id,
                'name' => $request->user()->name,
            ],
        ]);
    }


    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'fecha_ingreso'             => 'required|date',
            'numero_guia'               => 'required|string|max:100',
            'proveedor'                 => 'required|string|max:255',
            'observaciones'             => 'nullable|string',
            'almacen_id'                => 'required|exists:almacenes,id',
            'detalles'                  => 'required|array|min:1',
            'detalles.*.epp_sku_id'     => 'required|exists:epp_skus,id',
            'detalles.*.cantidad'       => 'required|integer|min:1',
        ]);

        DB::transaction(function () use ($request, $data) {
            $tipoIngreso = MovimientoTipo::where('codigo', 'INGRESO_GUIA_REMISION')->firstOrFail();

            foreach ($data['detalles'] as $det) {
                $sku      = EppSku::with('item')->lockForUpdate()->findOrFail($det['epp_sku_id']);
                $cantidad = (int) $det['cantidad'];

                $stock = StockAlmacen::firstOrCreate(
                    [
                        'almacen_id'   => $data['almacen_id'],
                        'epp_sku_id'   => $sku->id,
                        'estado_stock' => 'DISPONIBLE',
                    ],
                    ['cantidad_actual' => 0, 'stock_minimo' => 0]
                );

                $saldoAnterior = $stock->cantidad_actual;
                $saldoNuevo    = $saldoAnterior + $cantidad;

                $stock->update(['cantidad_actual' => $saldoNuevo]);

                MovimientoEpp::create([
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
                    'observaciones'      => trim("Proveedor: {$data['proveedor']}. " . ($data['observaciones'] ?? '')),
                    'user_id'            => $request->user()->id,
                ]);
            }
        });

        return back()->with('success', 'Ingreso registrado correctamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
