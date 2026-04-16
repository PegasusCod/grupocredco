<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
use App\Models\MovimientoEpp;
use App\Models\MovimientoTipo;
use App\Models\StockAlmacen;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SegregacionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $search      = $request->input('search');
        $almacenId   = $request->input('almacen_id');
        $estadoStock = $request->input('estado_stock');

        $stockSegregacion = StockAlmacen::with([
            'sku.item.categoria',
            'sku.talla',
            'almacen.proyecto',
        ])
            ->whereHas('almacen', fn ($q) => $q->where('tipo_almacen', 'SEGREGACION'))
            ->where('cantidad_actual', '>', 0)
            ->when($almacenId, fn ($q) => $q->where('almacen_id', $almacenId))
            ->when($estadoStock, fn ($q) => $q->where('estado_stock', $estadoStock))
            ->when($search, fn ($q) =>
                $q->whereHas('sku.item', fn ($i) =>
                    $i->where('nombre', 'like', "%{$search}%")
                )
            )
            ->orderByDesc('cantidad_actual')
            ->paginate(20)
            ->through(fn ($s) => [
                'id'              => $s->id,
                'almacen'         => $s->almacen?->nombre,
                'proyecto'        => $s->almacen?->proyecto?->nombre,
                'epp'             => $s->sku?->item?->nombre ?? '—',
                'categoria'       => $s->sku?->item?->categoria?->nombre,
                'talla'           => $s->sku?->talla?->codigo ?? 'ÚNICA',
                'cantidad_actual' => $s->cantidad_actual,
                'estado_stock'    => $s->estado_stock,
                'epp_sku_id'      => $s->epp_sku_id,
                'almacen_id'      => $s->almacen_id,
            ])
            ->withQueryString();

        $stats = [
            'total_danado' => (int) StockAlmacen::whereHas('almacen', fn ($q) => $q->where('tipo_almacen', 'SEGREGACION'))
                ->where('estado_stock', 'DANADO')->sum('cantidad_actual'),
            'total_baja'   => (int) StockAlmacen::whereHas('almacen', fn ($q) => $q->where('tipo_almacen', 'SEGREGACION'))
                ->where('estado_stock', 'BAJA')->sum('cantidad_actual'),
            'tipos_distintos' => StockAlmacen::whereHas('almacen', fn ($q) => $q->where('tipo_almacen', 'SEGREGACION'))
                ->where('cantidad_actual', '>', 0)
                ->distinct('epp_sku_id')
                ->count(),
        ];

        return Inertia::render('Segregacion/Index', [
            'stockSegregacion'     => $stockSegregacion,
            'stats'                => $stats,
            'almacenesSegregacion' => Almacen::where('tipo_almacen', 'SEGREGACION')->where('activo', true)->get(['id', 'nombre']),
            'filters'              => $request->only(['search', 'almacen_id', 'estado_stock']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function darBaja(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'stock_almacen_id' => 'required|exists:stock_almacen,id',
            'cantidad'         => 'required|integer|min:1',
            'motivo'           => 'required|string|max:255',
            'observaciones'    => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            $stockDanado = StockAlmacen::where('id', $validated['stock_almacen_id'])
                ->where('estado_stock', 'DANADO')
                ->whereHas('almacen', fn ($q) => $q->where('tipo_almacen', 'SEGREGACION'))
                ->lockForUpdate()
                ->firstOrFail();

            if ($stockDanado->cantidad_actual < $validated['cantidad']) {
                throw ValidationException::withMessages([
                    'cantidad' => "Solo hay {$stockDanado->cantidad_actual} unidades disponibles.",
                ]);
            }

            $tipoBaja = MovimientoTipo::where('codigo', 'BAJA_DEFINITIVA')->firstOrFail();

            $saldoAnteriorDanado = $stockDanado->cantidad_actual;
            $stockDanado->decrement('cantidad_actual', $validated['cantidad']);

            // Kardex: SALIDA de DANADO
            MovimientoEpp::create([
                'fecha_movimiento'   => now(),
                'almacen_id'         => $stockDanado->almacen_id,
                'epp_sku_id'         => $stockDanado->epp_sku_id,
                'tipo_movimiento_id' => $tipoBaja->id,
                'naturaleza'         => 'SALIDA',
                'estado_stock'       => 'DANADO',
                'cantidad'           => $validated['cantidad'],
                'saldo_anterior'     => $saldoAnteriorDanado,
                'saldo_nuevo'        => $stockDanado->cantidad_actual,
                'referencia'         => $validated['motivo'],
                'observaciones'      => $validated['observaciones'] ?? null,
                'user_id'            => Auth::id(),
            ]);

            // Registrar en estado BAJA (histórico)
            $stockBaja = StockAlmacen::firstOrCreate(
                [
                    'almacen_id'   => $stockDanado->almacen_id,
                    'epp_sku_id'   => $stockDanado->epp_sku_id,
                    'estado_stock' => 'BAJA',
                ],
                ['cantidad_actual' => 0, 'stock_minimo' => 0]
            );

            $saldoAnteriorBaja = $stockBaja->cantidad_actual;
            $stockBaja->increment('cantidad_actual', $validated['cantidad']);

            // Kardex: ENTRADA en BAJA
            MovimientoEpp::create([
                'fecha_movimiento'   => now(),
                'almacen_id'         => $stockDanado->almacen_id,
                'epp_sku_id'         => $stockDanado->epp_sku_id,
                'tipo_movimiento_id' => $tipoBaja->id,
                'naturaleza'         => 'ENTRADA',
                'estado_stock'       => 'BAJA',
                'cantidad'           => $validated['cantidad'],
                'saldo_anterior'     => $saldoAnteriorBaja,
                'saldo_nuevo'        => $stockBaja->cantidad_actual,
                'referencia'         => $validated['motivo'],
                'observaciones'      => $validated['observaciones'] ?? null,
                'user_id'            => Auth::id(),
            ]);
        });

        return back()->with('success', 'EPP dado de baja definitivamente.');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
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
