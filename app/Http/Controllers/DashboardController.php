<?php

namespace App\Http\Controllers;

use App\Models\EppEntrega;
use App\Models\IncidenciaEpp;
use App\Models\StockAlmacen;
use App\Models\TrabajadorEppCustodia;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $proyectoId = $request->input('proyecto_id');
        $anio       = (int) $request->input('year', now()->year);
        $mes        = $request->input('mes');

        $stats = [
            'total_entregas' => EppEntrega::where('estado', 'CONFIRMADO')
                ->when($proyectoId, fn ($q) => $q->where('proyecto_id', $proyectoId))
                ->whereYear('fecha_entrega', $anio)
                ->when($mes, fn ($q) => $q->whereMonth('fecha_entrega', $mes))
                ->count(),
            'trabajadores_con_epp' => TrabajadorEppCustodia::where('estado', 'ACTIVO')
                ->when($proyectoId, fn ($q) =>
                    $q->whereHas('trabajador', fn ($t) => $t->where('proyecto_id', $proyectoId))
                )
                ->distinct('trabajador_id')->count(),
            'en_custodia' => TrabajadorEppCustodia::where('estado', 'ACTIVO')
                ->when($proyectoId, fn ($q) =>
                    $q->whereHas('trabajador', fn ($t) => $t->where('proyecto_id', $proyectoId))
                )
                ->sum('cantidad_entregada'),
            'devueltos_desgaste' => TrabajadorEppCustodia::where('estado', 'DEVUELTO_DANADO')
                ->when($proyectoId, fn ($q) =>
                    $q->whereHas('trabajador', fn ($t) => $t->where('proyecto_id', $proyectoId))
                )
                ->sum('cantidad_devuelta'),
            'incidencias' => IncidenciaEpp::whereIn('estado', ['REGISTRADA', 'ATENDIDA'])
                ->when($proyectoId, fn ($q) => $q->where('proyecto_id', $proyectoId))
                ->count(),
        ];

        // Top 10 EPP más entregados
        $topEpp = EppEntrega::join('epp_entrega_detalles', 'epp_entregas.id', '=', 'epp_entrega_detalles.entrega_id')
            ->join('epp_skus', 'epp_entrega_detalles.epp_sku_id', '=', 'epp_skus.id')
            ->join('epp_items', 'epp_skus.epp_item_id', '=', 'epp_items.id')
            ->leftJoin('epp_categorias', 'epp_items.categoria_id', '=', 'epp_categorias.id')
            ->where('epp_entregas.estado', 'CONFIRMADO')
            ->whereYear('epp_entregas.fecha_entrega', $anio)
            ->when($proyectoId, fn ($q) => $q->where('epp_entregas.proyecto_id', $proyectoId))
            ->selectRaw('epp_items.id, epp_items.nombre, epp_categorias.nombre as categoria, SUM(epp_entrega_detalles.cantidad) as total_entregas')
            ->groupBy('epp_items.id', 'epp_items.nombre', 'epp_categorias.nombre')
            ->orderByDesc('total_entregas')
            ->limit(10)
            ->get();

        // Gráfico de barras por mes
        $entregasPorMes = EppEntrega::where('estado', 'CONFIRMADO')
            ->whereYear('fecha_entrega', $anio)
            ->when($proyectoId, fn ($q) => $q->where('proyecto_id', $proyectoId))
            ->selectRaw('MONTH(fecha_entrega) as mes, COUNT(*) as total')
            ->groupBy('mes')
            ->orderBy('mes')
            ->pluck('total', 'mes');

        $meses   = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        $barData = collect(range(1, 12))->map(fn ($m) => [
            'mes'   => $meses[$m - 1],
            'total' => (int) ($entregasPorMes[$m] ?? 0),
        ]);

        // EPP bajo stock mínimo
        $stockBajoMinimo = StockAlmacen::with(['sku.item.categoria', 'sku.talla', 'almacen'])
            ->whereColumn('cantidad_actual', '<=', 'stock_minimo')
            ->where('estado_stock', 'DISPONIBLE')
            ->where('cantidad_actual', '>', 0)
            ->limit(8)
            ->get()
            ->map(fn ($s) => [
                'epp'             => $s->sku?->item?->nombre,
                'categoria'       => $s->sku?->item?->categoria?->nombre,
                'talla'           => $s->sku?->talla?->codigo ?? 'ÚNICA',
                'almacen'         => $s->almacen?->nombre,
                'cantidad_actual' => $s->cantidad_actual,
                'stock_minimo'    => $s->stock_minimo,
            ]);

        // Top trabajadores con más EPP activos en custodia
        $topTrabajadores = TrabajadorEppCustodia::with('trabajador.proyecto')
            ->where('estado', 'ACTIVO')
            ->when($proyectoId, fn ($q) =>
                $q->whereHas('trabajador', fn ($t) => $t->where('proyecto_id', $proyectoId))
            )
            ->selectRaw('trabajador_id, SUM(cantidad_entregada) as total_activo, COUNT(*) as tipos')
            ->groupBy('trabajador_id')
            ->orderByDesc('total_activo')
            ->limit(5)
            ->with('trabajador.proyecto')
            ->get()
            ->map(fn ($c) => [
                'trabajador'   => "{$c->trabajador->nombres} {$c->trabajador->apellidos}",
                'fotocheck'    => $c->trabajador->codigo_fotocheck,
                'proyecto'     => $c->trabajador->proyecto?->nombre,
                'total_activo' => (int) $c->total_activo,
                'tipos'        => (int) $c->tipos,
            ]);

        return Inertia::render('Dashboard', [
            'stats'           => $stats,
            'topEpp'          => $topEpp,
            'barData'         => $barData,
            'stockBajoMinimo' => $stockBajoMinimo,
            'topTrabajadores' => $topTrabajadores,
            'filters'         => [
                'proyecto_id' => $proyectoId ?: 'todos',
                'year'        => $anio,
                'mes'         => $mes,
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
