<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
use App\Models\EppEntrega;
use App\Models\EppEntregaDetalle;
use App\Models\EppItem;
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
    public function index(Request $request)
    {
        $search = trim($request->input('search', ''));
        $year   = (int) $request->input('year', now()->year);

        $trabajador = null;
        $candidatos = [];   // FIX: lista cuando búsqueda por nombre devuelve varios resultados
        $historial  = [];

        if ($search) {
            // ── FIX 1: Búsqueda por fotocheck (exacto) O por nombre/apellido (parcial) ──
            // Antes: solo búsqueda exacta por fotocheck → no encontraba por nombre

            // Paso 1: coincidencia exacta de fotocheck (prioridad)
            $trabajador = Trabajador::with(['cargoLaboral:id,nombre', 'proyecto:id,nombre'])
                ->where('codigo_fotocheck', $search)
                ->first();

            // Paso 2: si no hay coincidencia exacta, buscar por nombre/apellido
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
                    // Resultado único: mostrar directamente
                    $trabajador = $matches->first();
                } elseif ($matches->count() > 1) {
                    // Múltiples resultados: devolver lista para que el usuario elija
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
                // Cargar historial
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

                // ── FIX 2: Detectar almacén desde el proyecto del trabajador ──
                // La relación es: trabajadores.proyecto_id → almacenes.proyecto_id
                // Antes: el almacén no se enviaba → el frontend no podía auto-rellenar
                $almacenProyecto = Almacen::where('proyecto_id', $trabajador->proyecto_id)
                    ->where('tipo_almacen', 'OPERATIVO')
                    ->where('activo', true)
                    ->first(['id', 'nombre']);

                // Serializar trabajador manualmente para incluir almacen_id
                $trabajador = [
                    'id'               => $trabajador->id,
                    'nombres'          => $trabajador->nombres,
                    'apellidos'        => $trabajador->apellidos,
                    'codigo_fotocheck' => $trabajador->codigo_fotocheck,
                    'cargo_laboral'    => $trabajador->cargoLaboral,
                    'proyecto'         => $trabajador->proyecto,
                    'proyecto_id'      => $trabajador->proyecto_id,
                    // Nuevo: almacen auto-detectado del proyecto
                    'almacen_id'       => $almacenProyecto?->id,
                    'almacen_nombre'   => $almacenProyecto?->nombre,
                ];
            }
        }

        // ── FIX 3: Estructura agrupada por EPP item para el selector de dos pasos ──
        // Antes: skusDisponibles era una lista plana de SKUs con EPP+talla mezclados.
        // Ahora: eppItemsDisponibles agrupa los SKUs bajo su EPP item.
        // El frontend usa: paso 1 = seleccionar EPP, paso 2 = seleccionar talla del EPP.
        $eppItemsDisponibles = EppItem::with([
            'categoria:id,nombre',
            'skus' => fn ($q) => $q
                ->with([
                    'talla:id,codigo,nombre',
                    'stocks' => fn ($q2) => $q2
                        ->where('estado_stock', 'DISPONIBLE')
                        ->where('cantidad_actual', '>', 0)
                        ->with('almacen:id,nombre,proyecto_id'),
                ])
                ->whereHas('stocks', fn ($q2) =>
                    $q2->where('estado_stock', 'DISPONIBLE')->where('cantidad_actual', '>', 0)
                ),
        ])
        ->where('activo', true)
        ->whereHas('skus', fn ($q) =>
            $q->whereHas('stocks', fn ($q2) =>
                $q2->where('estado_stock', 'DISPONIBLE')->where('cantidad_actual', '>', 0)
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
                    'almacen_nombre'  => $s->almacen?->nombre,
                    'proyecto_id'     => $s->almacen?->proyecto_id,
                    'cantidad_actual' => $s->cantidad_actual,
                ])->values(),
            ])->values(),
        ])
        ->values();

        $years = range(now()->year, now()->year - 5);

        return Inertia::render('Entregas/Index', [
            'trabajador'          => $trabajador,
            'candidatos'          => $candidatos,        // NUEVO
            'eppItemsDisponibles' => $eppItemsDisponibles, // renombrado y reestructurado
            'historial'           => $historial,
            'years'               => $years,
            'filters'             => ['search' => $search, 'year' => $year],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        // ── FIX 4: almacen_origen_id ahora viene en la raíz del request ──
        // Antes: el frontend lo enviaba dentro de cada item → $request->almacen_origen_id era null
        // → la validación fallaba silenciosamente y la entrega nunca se creaba.
        // Ahora: un solo almacén por entrega (nivel raíz), auto-detectado del proyecto del trabajador.
        $request->validate([
            'trabajador_id'          => 'required|exists:trabajadores,id',
            'almacen_origen_id'      => 'required|exists:almacenes,id',
            'observaciones'          => 'nullable|string|max:500',
            'items'                  => 'required|array|min:1',
            'items.*.epp_sku_id'     => 'required|exists:epp_skus,id',
            'items.*.cantidad'       => 'required|integer|min:1',
            'items.*.motivo_entrega' => 'required|in:INICIAL,REPOSICION_DESGASTE,REPOSICION_PERDIDA',
        ]);

        DB::transaction(function () use ($request) {
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
                $cantidad = (int) $item['cantidad'];

                $stock = StockAlmacen::where([
                    'almacen_id'   => $request->almacen_origen_id,
                    'epp_sku_id'   => $item['epp_sku_id'],
                    'estado_stock' => 'DISPONIBLE',
                ])->lockForUpdate()->first();

                if (!$stock || $stock->cantidad_actual < $cantidad) {
                    throw ValidationException::withMessages([
                        "items.{$index}.cantidad" => 'Stock insuficiente para este EPP en el almacén seleccionado.',
                    ]);
                }

                $saldoAnterior = $stock->cantidad_actual;
                $stock->decrement('cantidad_actual', $cantidad);

                $detalle = EppEntregaDetalle::create([
                    'entrega_id'     => $entrega->id,
                    'epp_sku_id'     => $item['epp_sku_id'],
                    'cantidad'       => $cantidad,
                    'motivo_entrega' => $item['motivo_entrega'],
                    'observaciones'  => $item['observaciones'] ?? null,
                ]);

                $movSalida = MovimientoEpp::create([
                    'fecha_movimiento'   => $entrega->fecha_entrega,
                    'almacen_id'         => $request->almacen_origen_id,
                    'proyecto_id'        => $trabajador->proyecto_id,
                    'trabajador_id'      => $request->trabajador_id,
                    'epp_sku_id'         => $item['epp_sku_id'],
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

                TrabajadorEppCustodia::create([
                    'trabajador_id'      => $request->trabajador_id,
                    'entrega_detalle_id' => $detalle->id,
                    'epp_sku_id'         => $item['epp_sku_id'],
                    'cantidad_entregada' => $cantidad,
                    'fecha_entrega'      => $entrega->fecha_entrega,
                    'estado'             => 'ACTIVO',
                ]);
            }
        });

        // Redirigir al historial del trabajador recién atendido
        $fotocheck = Trabajador::find($request->trabajador_id)?->codigo_fotocheck;
        return redirect()
            ->route('entregas.index', ['search' => $fotocheck, 'year' => now()->year])
            ->with('success', 'Entrega registrada correctamente.');
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