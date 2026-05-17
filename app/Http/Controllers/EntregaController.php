<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
use App\Models\EppEntrega;
use App\Models\EppEntregaDetalle;
use App\Models\EppItem;
use App\Models\EppSku;
use App\Models\IncidenciaEpp;
use App\Models\MovimientoEpp;
use App\Models\MovimientoTipo;
use App\Models\StockAlmacen;
use App\Models\Trabajador;
use App\Models\TrabajadorEppCustodia;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EntregaController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim($request->input('search', ''));
        $year   = (int) $request->input('year', now()->year);

        $trabajador          = null;
        $candidatos          = [];
        $historial           = [];
        $eppItemsDisponibles = [];

        if ($search) {
            $trabajador = Trabajador::with(['cargoLaboral:id,nombre', 'proyecto:id,nombre'])
                ->where('codigo_fotocheck', $search)
                ->first();

            if (!$trabajador) {
                $matches = Trabajador::with(['cargoLaboral:id,nombre', 'proyecto:id,nombre'])
                    ->where(fn ($q) =>
                        $q->where('nombres', 'like', "%{$search}%")
                          ->orWhere('apellidos', 'like', "%{$search}%")
                          ->orWhereRaw("CONCAT(nombres, ' ', apellidos) LIKE ?", ["%{$search}%"])
                    )
                    ->orderBy('apellidos')->orderBy('nombres')
                    ->limit(10)
                    ->get();

                if ($matches->count() === 1) {
                    $trabajador = $matches->first();
                } elseif ($matches->count() > 1) {
                    $candidatos = $matches->map(fn ($t) => [
                        'id'               => $t->id,
                        'nombres'          => $t->nombres,
                        'apellidos'        => $t->apellidos,
                        'codigo_fotocheck' => $t->codigo_fotocheck,
                        'cargo'            => $t->cargoLaboral?->nombre,
                        'proyecto'         => $t->proyecto?->nombre,
                    ])->values();
                }
            }

            if ($trabajador) {
                $trabajador->load([
                    'entregas' => fn ($q) =>
                        $q->with('user:id,name')
                          ->where('estado', 'CONFIRMADO')
                          ->whereYear('fecha_entrega', $year)
                          ->orderBy('fecha_entrega'),
                    'entregas.detalles.sku.item:id,nombre',
                    'entregas.detalles.sku.talla:id,codigo,nombre',
                ]);

                $historial = collect($trabajador->entregas)
                    ->flatMap(fn ($entrega) =>
                        $entrega->detalles->map(fn ($det) => [
                            'epp'            => $det->sku?->item?->nombre ?? 'EPP sin nombre',
                            'talla'          => $det->sku?->talla?->codigo ?? 'UNICA',
                            'fecha'          => Carbon::parse($entrega->fecha_entrega)->format('Y-m-d'),
                            'motivo'         => $det->motivo_entrega,
                            'cantidad'       => (int) $det->cantidad,
                            'observaciones'  => $entrega->observaciones,
                            'registrado_por' => $entrega->user?->name,
                        ])
                    )
                    ->groupBy('epp')
                    ->map(fn ($grupo, $nombreEpp) => [
                        'epp'     => $nombreEpp,
                        'cambios' => $grupo->map(fn ($c) => [
                            'fecha'          => $c['fecha'],
                            'talla'          => $c['talla'],
                            'motivo'         => $c['motivo'],
                            'cantidad'       => $c['cantidad'],
                            'observaciones'  => $c['observaciones'],
                            'registrado_por' => $c['registrado_por'],
                        ])->values(),
                        'total' => $grupo->sum('cantidad'),
                    ])
                    ->values();

                $almacenProyecto = null;
                if ($trabajador->proyecto_id) {
                    $almacenProyecto = Almacen::where('proyecto_id', $trabajador->proyecto_id)
                        ->where('tipo_almacen', 'OPERATIVO')
                        ->where('activo', true)
                        ->first(['id', 'nombre']);
                }

                $eppItemsDisponibles = $almacenProyecto
                    ? $this->getEppDisponiblesPorAlmacen($almacenProyecto->id)
                    : [];

                $trabajador = [
                    'id'               => $trabajador->id,
                    'nombres'          => $trabajador->nombres,
                    'apellidos'        => $trabajador->apellidos,
                    'codigo_fotocheck' => $trabajador->codigo_fotocheck,
                    'cargo_laboral'    => $trabajador->cargoLaboral,
                    'proyecto'         => $trabajador->proyecto,
                    'proyecto_id'      => $trabajador->proyecto_id,
                    'almacen_id'       => $almacenProyecto?->id,
                    'almacen_nombre'   => $almacenProyecto?->nombre,
                    'sin_proyecto'     => !$trabajador->proyecto_id,
                    'sin_almacen'      => $trabajador->proyecto_id && !$almacenProyecto,
                ];
            }
        }

        return Inertia::render('Entregas/Index', [
            'trabajador'          => $trabajador,
            'candidatos'          => $candidatos,
            'eppItemsDisponibles' => $eppItemsDisponibles,
            'historial'           => $historial,
            'years'               => range(now()->year, now()->year - 5),
            'filters'             => ['search' => $search, 'year' => $year],
        ]);
    }

    private function getEppDisponiblesPorAlmacen(int $almacenId): array
    {
        return EppItem::with([
            'categoria:id,nombre',
            'skus' => fn ($q) => $q
                ->where('activo', true)
                ->with([
                    'talla:id,codigo,nombre',
                    'stocks' => fn ($q2) => $q2
                        ->where('almacen_id', $almacenId)
                        ->where('estado_stock', 'DISPONIBLE')
                        ->where('cantidad_actual', '>', 0),
                ])
                ->whereHas('stocks', fn ($q2) =>
                    $q2->where('almacen_id', $almacenId)
                       ->where('estado_stock', 'DISPONIBLE')
                       ->where('cantidad_actual', '>', 0)
                ),
        ])
        ->where('activo', true)
        ->whereHas('skus', fn ($q) =>
            $q->where('activo', true)
              ->whereHas('stocks', fn ($q2) =>
                $q2->where('almacen_id', $almacenId)
                   ->where('estado_stock', 'DISPONIBLE')
                   ->where('cantidad_actual', '>', 0)
              )
        )
        ->orderBy('nombre')
        ->get()
        ->map(fn (EppItem $item) => [
            'epp_item_id' => $item->id,
            'nombre'      => $item->nombre,
            'categoria'   => $item->categoria?->nombre,
            'usa_tallas'  => (bool) $item->usa_tallas,
            'skus'        => $item->skus->map(fn ($sku) => [
                'sku_id'       => $sku->id,
                'talla_id'     => $sku->talla_id,
                'talla'        => $sku->talla?->codigo ?? 'UNICA',
                'talla_nombre' => $sku->talla?->nombre ?? 'Talla Única',
                'stock_total'  => $sku->stocks->sum('cantidad_actual'),
                'stocks'       => $sku->stocks->map(fn ($s) => [
                    'almacen_id'      => $s->almacen_id,
                    'cantidad_actual' => $s->cantidad_actual,
                ])->values(),
            ])->values(),
        ])
        ->values()
        ->toArray();
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'trabajador_id'          => 'required|exists:trabajadores,id',
            'almacen_origen_id'      => 'required|exists:almacenes,id',
            'observaciones'          => 'nullable|string|max:500',
            'items'                  => 'required|array|min:1',
            'items.*.epp_sku_id'     => 'required|exists:epp_skus,id',
            'items.*.cantidad'       => 'required|integer|min:1',
            'items.*.motivo_entrega' => 'required|in:INICIAL,REPOSICION_DESGASTE,REPOSICION_PERDIDA',
        ]);

        $almacen = Almacen::findOrFail($request->almacen_origen_id);
        if ($almacen->tipo_almacen !== 'OPERATIVO') {
            throw ValidationException::withMessages([
                'almacen_origen_id' => 'Solo se puede entregar EPP desde almacenes operativos.',
            ]);
        }

        // Almacén de segregación — se busca una sola vez fuera del loop
        $almacenSegregacion = Almacen::where('tipo_almacen', 'SEGREGACION')
            ->where('activo', true)
            ->first();

        DB::transaction(function () use ($request, $almacenSegregacion) {
            $trabajador = Trabajador::findOrFail($request->trabajador_id);
            $tipoSalida = MovimientoTipo::where('codigo', 'SALIDA_ENTREGA')->firstOrFail();

            $entrega = EppEntrega::create([
                'fecha_entrega'     => now(),
                'trabajador_id'     => $request->trabajador_id,
                'proyecto_id'       => $trabajador->proyecto_id,
                'almacen_origen_id' => $request->almacen_origen_id,
                'observaciones'     => $request->observaciones,
                'estado'            => 'CONFIRMADO',
                'user_id'           => Auth::id(),
            ]);

            foreach ($request->items as $index => $item) {
                $cantidad  = (int) $item['cantidad'];
                $motivo    = $item['motivo_entrega'];
                $eppSkuId  = $item['epp_sku_id'];

                // ── 1. Verificar y descontar stock ────────────────────────────
                $stock = StockAlmacen::where([
                    'almacen_id'   => $request->almacen_origen_id,
                    'epp_sku_id'   => $eppSkuId,
                    'estado_stock' => 'DISPONIBLE',
                ])->lockForUpdate()->first();

                if (!$stock || $stock->cantidad_actual < $cantidad) {
                    throw ValidationException::withMessages([
                        "items.{$index}.cantidad" => 'Stock insuficiente para este EPP en el almacén seleccionado.',
                    ]);
                }

                $saldoAnterior = $stock->cantidad_actual;
                $stock->decrement('cantidad_actual', $cantidad);

                // ── 2. Crear detalle ──────────────────────────────────────────
                $detalle = EppEntregaDetalle::create([
                    'entrega_id'     => $entrega->id,
                    'epp_sku_id'     => $eppSkuId,
                    'cantidad'       => $cantidad,
                    'motivo_entrega' => $motivo,
                    'observaciones'  => $item['observaciones'] ?? null,
                ]);

                // ── 3. Kardex: movimiento de salida ───────────────────────────
                $movSalida = MovimientoEpp::create([
                    'fecha_movimiento'   => $entrega->fecha_entrega,
                    'almacen_id'         => $request->almacen_origen_id,
                    'proyecto_id'        => $trabajador->proyecto_id,
                    'trabajador_id'      => $request->trabajador_id,
                    'epp_sku_id'         => $eppSkuId,
                    'tipo_movimiento_id' => $tipoSalida->id,
                    'naturaleza'         => 'SALIDA',
                    'estado_stock'       => 'DISPONIBLE',
                    'cantidad'           => $cantidad,
                    'saldo_anterior'     => $saldoAnterior,
                    'saldo_nuevo'        => $stock->cantidad_actual,
                    'documento_tipo'     => 'ENTREGA',
                    'documento_id'       => $entrega->id,
                    'user_id'            => Auth::id(),
                ]);

                $detalle->update(['movimiento_salida_id' => $movSalida->id]);

                // ════════════════════════════════════════════════════════════
                // ── 4. Lógica de REPOSICIÓN: cerrar custodia anterior ────────
                // ════════════════════════════════════════════════════════════
                $custodiaAfectadaId = null;
                $incidenciaId       = null;

                if (in_array($motivo, ['REPOSICION_DESGASTE', 'REPOSICION_PERDIDA'])) {

                    $eppSku    = EppSku::find($eppSkuId);
                    $eppItemId = $eppSku?->epp_item_id;

                    if ($eppItemId) {
                        // Obtener todas las custodias activas del mismo EPP item
                        $custodiasActivas = TrabajadorEppCustodia::where('trabajador_id', $request->trabajador_id)
                            ->where('estado', 'ACTIVO')
                            ->whereHas('sku', fn ($q) => $q->where('epp_item_id', $eppItemId))
                            ->orderByDesc('fecha_entrega')
                            ->get();

                        foreach ($custodiasActivas as $custodiaAnterior) {

                            $cantidadPendiente = $custodiaAnterior->cantidad_entregada
                                - $custodiaAnterior->cantidad_devuelta
                                - $custodiaAnterior->cantidad_perdida;

                            // ── REPOSICION_DESGASTE ───────────────────────────
                            // EPP usado pero físicamente devuelto → va a segregación
                            if ($motivo === 'REPOSICION_DESGASTE') {
                                $custodiaAnterior->update([
                                    'estado'            => 'DEVUELTO_DANADO',
                                    'fecha_cierre'      => now(),
                                    'cantidad_devuelta' => $custodiaAnterior->cantidad_devuelta + $cantidadPendiente,
                                ]);

                                if ($almacenSegregacion && $cantidadPendiente > 0) {
                                    $this->enviarASegregacion(
                                        custodia:           $custodiaAnterior,
                                        cantidadPendiente:  $cantidadPendiente,
                                        almacenSegregacion: $almacenSegregacion,
                                        trabajadorId:       $request->trabajador_id,
                                    );
                                }
                            }

                            // ── REPOSICION_PERDIDA ────────────────────────────
                            // EPP perdido → NO va a segregación, genera incidencia
                            // Según tu regla de negocio: pérdida no genera cargo,
                            // solo genera un registro de incidencia (sin cargo económico)
                            if ($motivo === 'REPOSICION_PERDIDA') {
                                $custodiaAnterior->update([
                                    'estado'           => 'PERDIDO',
                                    'fecha_cierre'     => now(),
                                    'cantidad_perdida' => $custodiaAnterior->cantidad_perdida + $cantidadPendiente,
                                ]);

                                // ✅ Crear registro en incidencias_epp
                                $incidencia = IncidenciaEpp::create([
                                    'fecha_incidencia'  => now(),
                                    'trabajador_id'     => $request->trabajador_id,
                                    'proyecto_id'       => $trabajador->proyecto_id,
                                    'custodia_id'       => $custodiaAnterior->id,
                                    'epp_sku_id'        => $custodiaAnterior->epp_sku_id,
                                    'tipo_incidencia'   => 'PERDIDA',
                                    'cantidad'          => $cantidadPendiente,
                                    'genera_reposicion' => true,
                                    'descripcion'       => $request->observaciones
                                        ?? 'Reposición por pérdida registrada durante entrega.',
                                    'estado'            => 'REGISTRADA',
                                    'user_id'           => Auth::id(),
                                ]);

                                // Guardar el id de la primera incidencia creada
                                if (!$incidenciaId) {
                                    $incidenciaId = $incidencia->id;
                                }
                            }

                            // Guardar el id de la primera custodia afectada
                            if (!$custodiaAfectadaId) {
                                $custodiaAfectadaId = $custodiaAnterior->id;
                            }
                        }
                    }
                }

                // ── 5. Actualizar detalle con trazabilidad completa ───────────
                $updateDetalle = [];
                if ($custodiaAfectadaId) $updateDetalle['custodia_afectada_id'] = $custodiaAfectadaId;
                if ($incidenciaId)       $updateDetalle['incidencia_id']        = $incidenciaId;
                if (!empty($updateDetalle)) $detalle->update($updateDetalle);

                // ── 6. Crear NUEVA custodia activa ────────────────────────────
                TrabajadorEppCustodia::create([
                    'trabajador_id'      => $request->trabajador_id,
                    'entrega_detalle_id' => $detalle->id,
                    'epp_sku_id'         => $eppSkuId,
                    'cantidad_entregada' => $cantidad,
                    'cantidad_devuelta'  => 0,
                    'cantidad_perdida'   => 0,
                    'fecha_entrega'      => $entrega->fecha_entrega,
                    'estado'             => 'ACTIVO',
                ]);
            }
        });

        $fotocheck = Trabajador::find($request->trabajador_id)?->codigo_fotocheck;
        return redirect()
            ->route('entregas.index', ['search' => $fotocheck, 'year' => now()->year])
            ->with('success', 'Entrega registrada correctamente.');
    }

    /**
     * Envía unidades dañadas al almacén de segregación.
     * Solo se llama para REPOSICION_DESGASTE.
     */
    private function enviarASegregacion(
        TrabajadorEppCustodia $custodia,
        int $cantidadPendiente,
        Almacen $almacenSegregacion,
        int $trabajadorId
    ): void {
        $tipoDevolucion = MovimientoTipo::where('codigo', 'DEVOLUCION_DESGASTE')->first();
        if (!$tipoDevolucion) return;

        $stockSeg = StockAlmacen::firstOrCreate(
            [
                'almacen_id'   => $almacenSegregacion->id,
                'epp_sku_id'   => $custodia->epp_sku_id,
                'estado_stock' => 'DANADO',
            ],
            ['cantidad_actual' => 0, 'stock_minimo' => 0]
        );

        $saldoAnterior = $stockSeg->cantidad_actual;
        $stockSeg->increment('cantidad_actual', $cantidadPendiente);

        MovimientoEpp::create([
            'fecha_movimiento'   => now(),
            'almacen_id'         => $almacenSegregacion->id,
            'trabajador_id'      => $trabajadorId,
            'epp_sku_id'         => $custodia->epp_sku_id,
            'tipo_movimiento_id' => $tipoDevolucion->id,
            'naturaleza'         => 'ENTRADA',
            'estado_stock'       => 'DANADO',
            'cantidad'           => $cantidadPendiente,
            'saldo_anterior'     => $saldoAnterior,
            'saldo_nuevo'        => $stockSeg->cantidad_actual,
            'documento_tipo'     => 'DEVOLUCION',
            'documento_id'       => $custodia->id,
            'observaciones'      => 'Reposición por desgaste — enviado automáticamente a segregación',
            'user_id'            => Auth::id(),
        ]);
    }

    public function show(EppEntrega $entrega): Response
    {
        $entrega->load([
            'trabajador.proyecto',
            'trabajador.cargoLaboral',
            'almacenOrigen',
            'detalles.sku.item',
            'detalles.sku.talla',
            'detalles.custodia',
            'user',
        ]);

        return Inertia::render('Entregas/Show', ['entrega' => $entrega]);
    }

    public function create() {}
    public function edit(string $id) {}
    public function update(Request $request, string $id) {}
    public function destroy(string $id) {}
}