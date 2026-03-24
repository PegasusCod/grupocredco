<?php

namespace App\Http\Controllers;

use App\Models\EppIngreso;
use App\Models\EppIngresoDetalle;
use App\Models\EppInventarioTalla;
use App\Models\EppItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
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

        $items = EppItem::with(['tallas' => function ($query) {
            $query->orderBy('talla');
        }])
            ->orderBy('nombre')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'nombre' => $item->nombre,
                    'codigo' => 'EPP-' . str_pad((string) $item->id, 3, '0', STR_PAD_LEFT),
                    'usa_tallas' => (bool) $item->usa_tallas,
                    'stock_total' => $item->usa_tallas
                        ? (int) $item->tallas->sum('stock_actual')
                        : (int) $item->stock_total,
                    'tallas' => $item->tallas->map(function ($talla) {
                        return [
                            'id' => $talla->id,
                            'talla' => $talla->talla,
                            'stock_actual' => (int) $talla->stock_actual,
                        ];
                    })->values(),
                ];
            })
            ->values();

        $query = EppIngresoDetalle::query()
            ->select('epp_ingreso_detalles.*')
            ->join('epp_ingresos', 'epp_ingresos.id', '=', 'epp_ingreso_detalles.epp_ingreso_id')
            ->with([
                'item:id,nombre',
                'ingreso:id,numero_lote,fecha_ingreso,proveedor,user_id,observaciones',
                'ingreso.user:id,name',
            ])
            ->when($search !== '', function ($builder) use ($search) {
                $builder->where(function ($q) use ($search) {
                    $q->where('epp_ingresos.numero_lote', 'like', "%{$search}%")
                        ->orWhere('epp_ingresos.proveedor', 'like', "%{$search}%")
                        ->orWhereHas('item', function ($itemQuery) use ($search) {
                            $itemQuery->where('nombre', 'like', "%{$search}%");
                        })
                        ->orWhereHas('ingreso.user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->orderByDesc('epp_ingresos.fecha_ingreso')
            ->orderByDesc('epp_ingresos.id')
            ->orderByDesc('epp_ingreso_detalles.id');

        $paginated = $query->paginate(10)->withQueryString();

        $ingresos = [
            'data' => collect($paginated->items())->map(function ($detalle) {
                return [
                    'id' => $detalle->id,
                    'fecha' => optional($detalle->ingreso->fecha_ingreso)->format('Y-m-d'),
                    'lote' => $detalle->ingreso->numero_lote,
                    'cantidad' => (int) $detalle->cantidad,

                    'stock_anterior_item' => (int) $detalle->stock_anterior_item,
                    'stock_nuevo_item' => (int) $detalle->stock_nuevo_item,

                    'stock_anterior_talla' => $detalle->stock_anterior_talla,
                    'stock_nuevo_talla' => $detalle->stock_nuevo_talla,

                    'talla' => $detalle->talla,
                    'proveedor' => $detalle->ingreso->proveedor,
                    'responsable' => $detalle->ingreso->user?->name,
                    'observaciones' => $detalle->ingreso->observaciones,

                    'epp' => [
                        'id' => $detalle->item?->id,
                        'nombre' => $detalle->item?->nombre,
                        'codigo' => $detalle->item
                            ? 'EPP-' . str_pad((string) $detalle->item->id, 3, '0', STR_PAD_LEFT)
                            : null,
                    ],
                ];
            })->values(),

            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'from' => $paginated->firstItem(),
                'to' => $paginated->lastItem(),
                'prev_page_url' => $paginated->previousPageUrl(),
                'next_page_url' => $paginated->nextPageUrl(),
            ],
        ];

        return Inertia::render('Inventario/Index', [
            'items' => $items,
            'ingresos' => $ingresos,
            'filters' => [
                'search' => $search,
            ],
            'stats' => [
                'total_ingresos' => EppIngreso::count(), // lotes
                'unidades_ingresadas' => (int) EppIngresoDetalle::sum('cantidad'),
                'ultimo_ingreso' => optional(
                    EppIngreso::orderByDesc('fecha_ingreso')->first()
                )?->fecha_ingreso?->format('Y-m-d'),
            ],
            'authUser' => [
                'id' => $request->user()->id,
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
            'fecha_ingreso' => ['required', 'date'],
            'numero_lote' => ['required', 'string', 'max:100'],
            'proveedor' => ['required', 'string', 'max:255'],
            'observaciones' => ['nullable', 'string'],

            'detalles' => ['required', 'array', 'min:1'],
            'detalles.*.epp_item_id' => ['required', 'exists:epp_items,id'],
            'detalles.*.talla' => ['nullable', 'string', 'max:20'],
            'detalles.*.cantidad' => ['required', 'integer', 'min:1'],
        ]);

        DB::transaction(function () use ($request, $data) {
            $user = $request->user();

            // 1) Crear o reutilizar cabecera del lote
            $ingreso = EppIngreso::query()
                ->where('numero_lote', $data['numero_lote'])
                ->lockForUpdate()
                ->first();

            if (! $ingreso) {
                $ingreso = EppIngreso::create([
                    'numero_lote' => $data['numero_lote'],
                    'fecha_ingreso' => $data['fecha_ingreso'],
                    'proveedor' => $data['proveedor'],
                    'user_id' => $user->id,
                    'observaciones' => $data['observaciones'] ?? null,
                ]);
            } else {
                if (
                    $ingreso->fecha_ingreso->format('Y-m-d') !== $data['fecha_ingreso']
                    || $ingreso->proveedor !== $data['proveedor']
                ) {
                    throw ValidationException::withMessages([
                        'numero_lote' => 'Ese lote ya existe con otra fecha o proveedor.',
                    ]);
                }
            }

            // 2) Procesar cada EPP del lote
            foreach ($data['detalles'] as $index => $detalleData) {
                $item = EppItem::query()
                    ->lockForUpdate()
                    ->findOrFail($detalleData['epp_item_id']);

                $talla = $item->usa_tallas
                    ? trim((string) ($detalleData['talla'] ?? ''))
                    : null;

                if ($item->usa_tallas && $talla === '') {
                    throw ValidationException::withMessages([
                        "detalles.$index.talla" => 'La talla es obligatoria para este EPP.',
                    ]);
                }

                if (! $item->usa_tallas) {
                    $talla = null;
                }

                // Evitar duplicar mismo EPP + misma talla dentro del mismo lote
                $detalleExistente = $ingreso->detalles()
                    ->where('epp_item_id', $item->id)
                    ->when(
                        $talla !== null,
                        fn($q) => $q->where('talla', $talla),
                        fn($q) => $q->whereNull('talla')
                    )
                    ->exists();

                if ($detalleExistente) {
                    throw ValidationException::withMessages([
                        "detalles.$index.epp_item_id" => 'Ese EPP ya fue agregado en este lote con esa misma talla.',
                    ]);
                }

                $cantidad = (int) $detalleData['cantidad'];

                $filasInventario = EppInventarioTalla::query()
                    ->where('epp_item_id', $item->id)
                    ->lockForUpdate()
                    ->get();

                $stockAnteriorItem = $item->usa_tallas
                    ? (int) $filasInventario->sum('stock_actual')
                    : (int) $item->stock_total;

                $stockAnteriorTalla = null;
                $stockNuevoTalla = null;

                if ($item->usa_tallas) {
                    $inventarioTalla = $filasInventario->firstWhere('talla', $talla);

                    if (! $inventarioTalla) {
                        $inventarioTalla = EppInventarioTalla::create([
                            'epp_item_id' => $item->id,
                            'talla' => $talla,
                            'stock_actual' => 0,
                        ]);
                    }

                    $stockAnteriorTalla = (int) $inventarioTalla->stock_actual;
                    $stockNuevoTalla = $stockAnteriorTalla + $cantidad;

                    $inventarioTalla->update([
                        'stock_actual' => $stockNuevoTalla,
                    ]);
                } else {
                    $inventarioTalla = $filasInventario->sortBy('id')->first();

                    if (! $inventarioTalla) {
                        $inventarioTalla = EppInventarioTalla::create([
                            'epp_item_id' => $item->id,
                            'talla' => 'Única',
                            'stock_actual' => 0,
                        ]);
                    } else {
                        $valorTalla = trim((string) $inventarioTalla->talla);

                        if ($valorTalla === '' || mb_strtolower($valorTalla) !== 'única') {
                            $inventarioTalla->update([
                                'talla' => 'Única',
                            ]);
                        }
                    }

                    $stockAnteriorTalla = $stockAnteriorItem;
                    $stockNuevoTalla = $stockAnteriorTalla + $cantidad;

                    $inventarioTalla->update([
                        'stock_actual' => $stockNuevoTalla,
                    ]);
                }

                $stockNuevoItem = $stockAnteriorItem + $cantidad;

                $item->update([
                    'stock_total' => $stockNuevoItem,
                ]);

                EppIngresoDetalle::create([
                    'epp_ingreso_id' => $ingreso->id,
                    'epp_item_id' => $item->id,
                    'talla' => $item->usa_tallas ? $talla : null,
                    'cantidad' => $cantidad,
                    'stock_anterior_item' => $stockAnteriorItem,
                    'stock_nuevo_item' => $stockNuevoItem,
                    'stock_anterior_talla' => $stockAnteriorTalla,
                    'stock_nuevo_talla' => $stockNuevoTalla,
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
