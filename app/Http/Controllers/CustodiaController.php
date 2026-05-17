<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
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
    public function index(Request $request): Response
    {
        $search     = $request->input('search');
        $proyectoId = $request->input('proyecto_id');
        $tab        = $request->input('tab', 'activos');

        $baseQuery = fn() => TrabajadorEppCustodia::with([
            'trabajador.proyecto:id,nombre',
            'trabajador.cargoLaboral:id,nombre',
            'sku.item.categoria:id,nombre',
            'sku.talla:id,codigo,nombre',
            'entregaDetalle:id,motivo_entrega',
        ])
            ->when(
                $search,
                fn($q) =>
                $q->whereHas(
                    'trabajador',
                    fn($t) =>
                    $t->where('nombres', 'like', "%{$search}%")
                        ->orWhere('apellidos', 'like', "%{$search}%")
                        ->orWhere('codigo_fotocheck', 'like', "%{$search}%")
                        ->orWhere('dni', 'like', "%{$search}%")
                )
            )
            ->when(
                $proyectoId && $proyectoId !== 'todos',
                fn($q) =>
                $q->whereHas('trabajador', fn($t) => $t->where('proyecto_id', $proyectoId))
            );

        // ── Activos ───────────────────────────────────────────────────────────
        $activos = $baseQuery()
            ->where('estado', 'ACTIVO')
            ->latest('fecha_entrega')
            ->paginate(20, ['*'], 'activos_page')
            ->through(fn($c) => $this->mapCustodia($c))
            ->withQueryString();

        // ── Historial ─────────────────────────────────────────────────────────
        $historial = $baseQuery()
            ->whereIn('estado', ['DEVUELTO_DANADO', 'PERDIDO', 'EXTRAVIADO', 'CERRADO'])
            ->latest('fecha_cierre')
            ->paginate(20, ['*'], 'historial_page')
            ->through(fn($c) => $this->mapCustodia($c))
            ->withQueryString();

        // ── Stats: una sola query con GROUP BY en vez de 4 COUNT separados ───
        $statsRaw = TrabajadorEppCustodia::selectRaw('estado, COUNT(*) as total')
            ->groupBy('estado')
            ->pluck('total', 'estado');

        $stats = [
            'total_activos'   => (int) ($statsRaw['ACTIVO']          ?? 0),
            'total_devueltos' => (int) ($statsRaw['DEVUELTO_DANADO']  ?? 0),
            'total_perdidos'  => (int) (($statsRaw['PERDIDO']         ?? 0) + ($statsRaw['EXTRAVIADO'] ?? 0)),
            'total_cerrados'  => (int) ($statsRaw['CERRADO']          ?? 0),
        ];

        return Inertia::render('Custodia/Index', [
            'activos'              => $activos,
            'historial'            => $historial,
            'stats'                => $stats,
            'proyectos'            => Proyecto::where('activo', true)->get(['id', 'nombre']),
            'almacenesSegregacion' => Almacen::where('tipo_almacen', 'SEGREGACION')
                ->where('activo', true)
                ->get(['id', 'nombre']),
            'filters' => [
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
            'observaciones'      => 'nullable|string|max:500',
        ]);

        // Validar que el almacén destino es de tipo SEGREGACION
        $almacenDestino = Almacen::findOrFail($validated['almacen_destino_id']);
        if ($almacenDestino->tipo_almacen !== 'SEGREGACION') {
            return back()->withErrors([
                'almacen_destino_id' => 'El EPP devuelto solo puede enviarse a un almacén de Segregación.',
            ]);
        }

        $pendiente = $custodia->cantidad_entregada
            - $custodia->cantidad_devuelta
            - $custodia->cantidad_perdida;

        if ($validated['cantidad_devuelta'] > $pendiente) {
            return back()->withErrors([
                'cantidad_devuelta' => "Solo hay {$pendiente} unidades pendientes de devolución.",
            ]);
        }

        DB::transaction(function () use ($custodia, $validated) {
            $tipoDevolucion = MovimientoTipo::where('codigo', 'DEVOLUCION_DESGASTE')->firstOrFail();
            $cantidad       = $validated['cantidad_devuelta'];

            // ── Ingresar al stock de segregación ─────────────────────────────
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

            // ── Actualizar custodia ───────────────────────────────────────────
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

    // ── Mapper privado ────────────────────────────────────────────────────────

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
            // ✅ DESPUÉS — Carbon::parse() acepta string, null o Carbon, nunca falla
            'fecha_entrega' => $c->fecha_entrega ? \Carbon\Carbon::parse($c->fecha_entrega)->format('Y-m-d') : null,
            'fecha_cierre'  => $c->fecha_cierre  ? \Carbon\Carbon::parse($c->fecha_cierre)->format('Y-m-d')  : null,
            'motivo_entrega'     => $c->entregaDetalle?->motivo_entrega,
        ];
    }

    public function create() {}
    public function store(Request $request) {}
    public function show(string $id) {}
    public function edit(string $id) {}
    public function update(Request $request, string $id) {}
    public function destroy(string $id) {}
}
