<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
use App\Models\EppEntrega;
use App\Models\EppEntregaDetalle;
use App\Models\EppSku;
use App\Models\MovimientoEpp;
use App\Models\MovimientoTipo;
use App\Models\StockAlmacen;
use App\Models\Trabajador;
use App\Models\TrabajadorEppCustodia;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EntregaController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $year   = (int) $request->input('year', now()->year);

        $trabajador = null;
        $historial  = [];

        if ($search) {
            $trabajador = Trabajador::with([
                'cargoLaboral:id,nombre',
                'proyecto:id,nombre',
                'entregas' => fn ($q) =>
                    $q->with('user:id,name')
                      ->where('estado', 'CONFIRMADO')
                      ->whereYear('fecha_entrega', $year)
                      ->orderBy('fecha_entrega'),
                'entregas.detalles.sku.item:id,nombre',
                'entregas.detalles.sku.talla:id,codigo,nombre',
            ])
                ->where('codigo_fotocheck', $search)
                ->first();

            if ($trabajador) {
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
            }
        }

        $skusDisponibles = EppSku::with([
            'item' => fn ($q) => $q->where('activo', true)->with('categoria:id,nombre'),
            'talla:id,codigo,nombre',
            'stocks' => fn ($q) =>
                $q->where('estado_stock', 'DISPONIBLE')
                  ->where('cantidad_actual', '>', 0)
                  ->with('almacen:id,nombre,proyecto_id'),
        ])
            ->whereHas('stocks', fn ($q) =>
                $q->where('estado_stock', 'DISPONIBLE')->where('cantidad_actual', '>', 0)
            )
            ->whereHas('item', fn ($q) => $q->where('activo', true))
            ->get()
            ->map(fn (EppSku $sku) => [
                'sku_id'        => $sku->id,
                'epp_item_id'   => $sku->epp_item_id,
                'nombre'        => $sku->item?->nombre,
                'categoria'     => $sku->item?->categoria?->nombre,
                'usa_tallas'    => (bool) $sku->item?->usa_tallas,
                'talla_id'      => $sku->talla_id,
                'talla'         => $sku->talla?->codigo ?? 'UNICA',
                'talla_nombre'  => $sku->talla?->nombre ?? 'Única',
                'stocks'        => $sku->stocks->map(fn ($s) => [
                    'almacen_id'      => $s->almacen_id,
                    'almacen_nombre'  => $s->almacen?->nombre,
                    'cantidad_actual' => $s->cantidad_actual,
                ])->values(),
            ])
            ->values();

        $years = range(now()->year, now()->year - 5);

        return Inertia::render('Entregas/Index', [
            'trabajador'      => $trabajador,
            'skusDisponibles' => $skusDisponibles,
            'historial'       => $historial,
            'years'           => $years,
            'filters'         => ['search' => $search, 'year' => $year],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'trabajador_id'          => 'required|exists:trabajadores,id',
            'almacen_origen_id'      => 'required|exists:almacenes,id',
            'observaciones'          => 'nullable|string',
            'items'                  => 'required|array|min:1',
            'items.*.epp_sku_id'     => 'required|exists:epp_skus,id',
            'items.*.cantidad'       => 'required|integer|min:1',
            'items.*.motivo_entrega' => 'required|in:INICIAL,REPOSICION_DESGASTE,REPOSICION_PERDIDA',
        ]);

        DB::transaction(function () use ($request) {
            $trabajador = Trabajador::findOrFail($request->trabajador_id);
            $tipoSalida = MovimientoTipo::where('codigo', 'ENTREGA_TRABAJADOR')->firstOrFail();

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
                        "items.$index.cantidad" => 'Stock insuficiente para este EPP en el almacén seleccionado.',
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

        return redirect()
            ->route('entregas.index', [
                'search' => $request->input('search'),
                'year'   => now()->year,
            ])
            ->with('success', 'Entrega registrada correctamente.');
    }

    public function create() {}



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

        return Inertia::render('Entregas/Show', [
            'entrega' => $entrega,
        ]);
    }
    public function edit(string $id) {}


    public function update(Request $request, string $id) {}



    public function destroy(string $id) {}
}