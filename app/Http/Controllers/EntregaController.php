<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Entrega;
use App\Models\EppInventarioTalla;
use App\Models\EppItem;
use App\Models\Trabajador;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class EntregaController extends Controller
{
    public function index(Request $request)
    {
        $this->asegurarInventarioUnicoParaEppsSinTalla();

        $search = $request->input('search');
        $year   = (int) $request->input('year', now()->year);

        $trabajador = null;
        $historial  = [];

        if ($search) {
            $trabajador = Trabajador::with([
                'cargo',
                'entregas' => function ($query) use ($year) {
                    $query->with('usuario')
                          ->whereYear('fecha', $year)
                          ->orderBy('fecha', 'asc');
                },
                'entregas.detalles.eppTalla.item',
            ])
                ->where('codigo_fotocheck', $search)
                ->first();

            if ($trabajador) {
                $historial = collect($trabajador->entregas)
                    ->flatMap(function ($entrega) {
                        return $entrega->detalles->map(function ($detalle) use ($entrega) {
                            return [
                                'epp'            => $detalle->eppTalla?->item?->nombre ?? 'EPP sin nombre',
                                'fecha'          => $entrega->fecha
                                    ? Carbon::parse($entrega->fecha)->format('Y-m-d')
                                    : null,
                                'motivo'         => $detalle->motivo,
                                'cantidad'       => (int) ($detalle->cantidad ?? 1),
                                'observaciones'  => $entrega->observaciones,
                                'registrado_por' => $entrega->usuario?->name ?? null,
                            ];
                        });
                    })
                    ->groupBy('epp')
                    ->map(function ($grupo, $nombreEpp) {
                        return [
                            'epp'     => $nombreEpp,
                            'cambios' => $grupo->map(fn ($c) => [
                                'fecha'          => $c['fecha'],
                                'motivo'         => $c['motivo'],
                                'cantidad'       => $c['cantidad'],
                                'observaciones'  => $c['observaciones'],
                                'registrado_por' => $c['registrado_por'],
                            ])->values(),
                            'total' => $grupo->sum('cantidad'),
                        ];
                    })
                    ->values();
            }
        }

        $items = EppItem::with([
            'tallas' => function ($query) {
                $query->where('stock_actual', '>', 0)
                    ->orderByRaw("CASE WHEN talla REGEXP '^[0-9]+$' THEN 0 ELSE 1 END")
                    ->orderByRaw("CAST(talla AS UNSIGNED)")
                    ->orderBy('talla');
            }
        ])
            ->whereHas('tallas', fn ($q) => $q->where('stock_actual', '>', 0))
            ->orderBy('nombre')
            ->get()
            ->map(function (EppItem $item) {
                $tallasDisponibles = $item->tallas->values();
                $usaTallas         = (bool) $item->usa_tallas;
                $filaUnica         = !$usaTallas ? $tallasDisponibles->first() : null;

                return [
                    'id'                     => $item->id,
                    'nombre'                 => $item->nombre,
                    'usa_tallas'             => $usaTallas,
                    'stock_total_disponible' => $usaTallas
                        ? (int) $tallasDisponibles->sum('stock_actual')
                        : (int) optional($filaUnica)->stock_actual,
                    'inventario_unico_id'    => $filaUnica?->id,
                    'tallas'                 => $usaTallas
                        ? $tallasDisponibles->map(fn ($inv) => [
                            'id'           => $inv->id,
                            'talla'        => $inv->talla,
                            'stock_actual' => (int) $inv->stock_actual,
                        ])->values()
                        : [],
                ];
            })
            ->values();

        $years = range(now()->year, now()->year - 5);

        return Inertia::render('Entregas/Index', [
            'trabajador' => $trabajador,
            'items'      => $items,
            'historial'  => $historial,
            'years'      => $years,
            'filters'    => ['search' => $search, 'year' => $year],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'trabajador_id'        => 'required|exists:trabajadores,id',
            'observaciones'        => 'nullable|string',
            'items'                => 'required|array|min:1',
            'items.*.epp_item_id'  => 'required|exists:epp_items,id',
            'items.*.epp_talla_id' => 'required|exists:epp_inventario_tallas,id',
            'items.*.cantidad'     => 'required|integer|min:1',
            'items.*.motivo'       => 'required|string|in:Personal Nuevo,Desgaste,Perdida',
        ]);

        DB::transaction(function () use ($request) {
            $entrega = Entrega::create([
                'trabajador_id'     => $request->trabajador_id,
                'registrado_por_id' => Auth::id(),
                'observaciones'     => $request->observaciones,
                'fecha'             => now(),
            ]);

            foreach ($request->items as $index => $item) {
                $cantidad   = (int) $item['cantidad'];
                $inventario = EppInventarioTalla::with('item')
                    ->lockForUpdate()
                    ->findOrFail($item['epp_talla_id']);

                if ((int) $inventario->epp_item_id !== (int) $item['epp_item_id']) {
                    throw ValidationException::withMessages([
                        "items.$index.epp_talla_id" => "La talla seleccionada no pertenece al EPP elegido.",
                    ]);
                }

                if ((int) $inventario->stock_actual < $cantidad) {
                    throw ValidationException::withMessages([
                        "items.$index.cantidad" => "No hay stock suficiente para este EPP.",
                    ]);
                }

                $entrega->detalles()->create([
                    'epp_talla_id' => $inventario->id,
                    'cantidad'     => $cantidad,
                    'motivo'       => $item['motivo'],
                ]);

                $inventario->decrement('stock_actual', $cantidad);

                if ($inventario->item) {
                    $inventario->item()->decrement('stock_total', $cantidad);
                }
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
    public function show(string $id) {}
    public function edit(string $id) {}
    public function update(Request $request, string $id) {}
    public function destroy(string $id) {}

    private function asegurarInventarioUnicoParaEppsSinTalla(): void
    {
        EppItem::with('tallas:id,epp_item_id,talla,stock_actual')
            ->where('usa_tallas', false)
            ->get()
            ->each(function (EppItem $item) {
                $primeraFila = $item->tallas->sortBy('id')->first();

                if (!$primeraFila) {
                    $item->tallas()->create([
                        'talla'        => 'Única',
                        'stock_actual' => (int) $item->stock_total,
                    ]);
                    return;
                }

                $primeraFila->update([
                    'talla'        => 'Única',
                    'stock_actual' => (int) $item->stock_total,
                ]);
            });
    }
}