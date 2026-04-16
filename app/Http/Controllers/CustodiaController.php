<?php

namespace App\Http\Controllers;

use App\Models\MovimientoEpp;
use App\Models\MovimientoTipo;
use App\Models\Proyecto;
use App\Models\StockAlmacen;
use App\Models\TrabajadorEppCustodia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CustodiaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index( Request $request): Response
    {
        $search     = $request->input('search');
        $proyectoId = $request->input('proyecto_id');
        $tab        = $request->input('tab', 'activos'); // activos | historial

        // ── Pestaña ACTIVOS: custodias con estado ACTIVO
        $activos = TrabajadorEppCustodia::with([
            'trabajador.proyecto',
            'trabajador.cargoLaboral',
            'sku.item.categoria',
            'sku.talla',
            'entregaDetalle',
        ])
            ->where('estado', 'ACTIVO')
            ->when($search, fn ($q) =>
                $q->whereHas('trabajador', fn ($t) =>
                    $t->where('nombres', 'like', "%{$search}%")
                      ->orWhere('apellidos', 'like', "%{$search}%")
                      ->orWhere('codigo_fotocheck', 'like', "%{$search}%")
                      ->orWhere('dni', 'like', "%{$search}%")
                )
            )
            ->when($proyectoId && $proyectoId !== 'todos', fn ($q) =>
                $q->whereHas('trabajador', fn ($t) => $t->where('proyecto_id', $proyectoId))
            )
            ->latest('fecha_entrega')
            ->paginate(20, ['*'], 'activos_page')
            ->through(fn ($c) => $this->mapCustodia($c))
            ->withQueryString();

        // ── Pestaña HISTORIAL: todos los estados cerrados/finalizados
        $historial = TrabajadorEppCustodia::with([
            'trabajador.proyecto',
            'trabajador.cargoLaboral',
            'sku.item.categoria',
            'sku.talla',
            'entregaDetalle',
        ])
            ->whereIn('estado', ['DEVUELTO_DANADO', 'PERDIDO', 'EXTRAVIADO', 'CERRADO'])
            ->when($search, fn ($q) =>
                $q->whereHas('trabajador', fn ($t) =>
                    $t->where('nombres', 'like', "%{$search}%")
                      ->orWhere('apellidos', 'like', "%{$search}%")
                      ->orWhere('codigo_fotocheck', 'like', "%{$search}%")
                )
            )
            ->when($proyectoId && $proyectoId !== 'todos', fn ($q) =>
                $q->whereHas('trabajador', fn ($t) => $t->where('proyecto_id', $proyectoId))
            )
            ->latest('fecha_cierre')
            ->paginate(20, ['*'], 'historial_page')
            ->through(fn ($c) => $this->mapCustodia($c))
            ->withQueryString();

        $stats = [
            'total_activos'   => TrabajadorEppCustodia::where('estado', 'ACTIVO')->count(),
            'total_devueltos' => TrabajadorEppCustodia::where('estado', 'DEVUELTO_DANADO')->count(),
            'total_perdidos'  => TrabajadorEppCustodia::whereIn('estado', ['PERDIDO', 'EXTRAVIADO'])->count(),
            'total_cerrados'  => TrabajadorEppCustodia::where('estado', 'CERRADO')->count(),
        ];

        return Inertia::render('Custodia/Index', [
            'activos'   => $activos,
            'historial' => $historial,
            'stats'     => $stats,
            'proyectos' => Proyecto::where('activo', true)->get(['id', 'nombre']),
            'filters'   => [
                'search'      => $search,
                'proyecto_id' => $proyectoId ?: 'todos',
                'tab'         => $tab,
            ],
        ]);
    }

    /**
     * Registrar devolución — envía al almacén de segregación.
     */
    public function devolver(Request $request, TrabajadorEppCustodia $custodia): RedirectResponse
    {
        $validated = $request->validate([
            'cantidad_devuelta'  => 'required|integer|min:1',
            'almacen_destino_id' => 'required|exists:almacenes,id',
            'observaciones'      => 'nullable|string',
        ]);

        $pendiente = $custodia->cantidad_entregada - $custodia->cantidad_devuelta - $custodia->cantidad_perdida;

        if ($validated['cantidad_devuelta'] > $pendiente) {
            return back()->withErrors([
                'cantidad_devuelta' => "Solo hay {$pendiente} unidades pendientes de devolución.",
            ]);
        }

        DB::transaction(function () use ($custodia, $validated) {
            $tipoDevolucion = MovimientoTipo::where('codigo', 'DEVOLUCION_DESGASTE')->firstOrFail();
            $cantidad = $validated['cantidad_devuelta'];

            $stockSeg = StockAlmacen::firstOrCreate(
                [
                    'almacen_id'   => $validated['almacen_destino_id'],
                    'epp_sku_id'   => $custodia->epp_sku_id,
                    'estado_stock' => 'DANADO',
                ],
                ['cantidad_actual' => 0, 'stock_minimo' => 0]
            );

            $saldoAnterior = $stockSeg->cantidad_actual;
            $stockSeg->increment('cantidad_actual', $cantidad);

            MovimientoEpp::create([
                'fecha_movimiento'   => now(),
                'almacen_id'         => $validated['almacen_destino_id'],
                'trabajador_id'      => $custodia->trabajador_id,
                'epp_sku_id'         => $custodia->epp_sku_id,
                'tipo_movimiento_id' => $tipoDevolucion->id,
                'naturaleza'         => 'ENTRADA',
                'estado_stock'       => 'DANADO',
                'cantidad'           => $cantidad,
                'saldo_anterior'     => $saldoAnterior,
                'saldo_nuevo'        => $stockSeg->cantidad_actual,
                'documento_tipo'     => 'DEVOLUCION',
                'observaciones'      => $validated['observaciones'] ?? null,
                'user_id'            => Auth::id(),
            ]);

            $nuevaDevuelta  = $custodia->cantidad_devuelta + $cantidad;
            $nuevoPendiente = $custodia->cantidad_entregada - $nuevaDevuelta - $custodia->cantidad_perdida;

            $custodia->update([
                'cantidad_devuelta' => $nuevaDevuelta,
                'estado'            => $nuevoPendiente <= 0 ? 'DEVUELTO_DANADO' : 'ACTIVO',
                'fecha_cierre'      => $nuevoPendiente <= 0 ? now() : null,
                'observaciones'     => $validated['observaciones'] ?? $custodia->observaciones,
            ]);
        });

        return back()->with('success', 'Devolución registrada. EPP enviado al almacén de segregación.');
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

    private function mapCustodia(TrabajadorEppCustodia $c): array
    {
        return [
            'id'                 => $c->id,
            'trabajador'         => [
                'id'               => $c->trabajador->id,
                'nombre_completo'  => "{$c->trabajador->nombres} {$c->trabajador->apellidos}",
                'codigo_fotocheck' => $c->trabajador->codigo_fotocheck,
                'proyecto'         => $c->trabajador->proyecto?->nombre,
                'cargo'            => $c->trabajador->cargoLaboral?->nombre,
            ],
            'epp'                => $c->sku?->item?->nombre ?? '—',
            'talla'              => $c->sku?->talla?->codigo ?? 'ÚNICA',
            'categoria'          => $c->sku?->item?->categoria?->nombre,
            'cantidad_entregada' => $c->cantidad_entregada,
            'cantidad_devuelta'  => $c->cantidad_devuelta,
            'cantidad_perdida'   => $c->cantidad_perdida,
            'cantidad_pendiente' => $c->cantidad_entregada - $c->cantidad_devuelta - $c->cantidad_perdida,
            'estado'             => $c->estado,
            'fecha_entrega'      => $c->fecha_entrega?->format('Y-m-d'),
            'fecha_cierre'       => $c->fecha_cierre?->format('Y-m-d'),
            'motivo_entrega'     => $c->entregaDetalle?->motivo_entrega,
        ];
    }
}
