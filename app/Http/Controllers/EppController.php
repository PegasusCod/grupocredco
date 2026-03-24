<?php

namespace App\Http\Controllers;

use App\Models\EppItem;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EppController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        // Normaliza EPP antiguos sin talla para que tengan fila "Única"
        $this->asegurarInventarioUnicoParaEppsSinTalla();

        $epps = EppItem::with([
            'tallas' => fn($query) => $query->orderBy('talla'),
        ])
            ->orderBy('nombre')
            ->get()
            ->map(fn(EppItem $item) => $this->mapEpp($item))
            ->values();

        $categorias = $epps
            ->pluck('categoria')
            ->filter()
            ->unique()
            ->values();

        return Inertia::render('EPP/Index', [
            'epps' => $epps,
            'categorias' => $categorias,
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
            'nombre' => ['required', 'string', 'max:160'],
            'categoria' => ['required', 'string', 'max:160'],
            'marca' => ['required', 'string', 'max:160'],
            'unidad_medida' => ['required', 'string', 'max:30'],
            'stock_minimo' => ['required', 'integer', 'min:0'],
            'stock_inicial' => ['required', 'integer', 'min:0'],
            'usa_tallas' => ['required', 'boolean'],
            'talla_inicial' => ['nullable', 'string', 'max:20'],
        ]);

        $usaTallas = (bool) $data['usa_tallas'];
        $stockInicial = (int) $data['stock_inicial'];
        $tallaInicial = trim((string) ($data['talla_inicial'] ?? ''));

        if ($usaTallas && $stockInicial > 0 && $tallaInicial === '') {
            throw ValidationException::withMessages([
                'talla_inicial' => 'Si el EPP usa tallas y registras stock inicial, debes indicar la talla inicial.',
            ]);
        }

        DB::transaction(function () use ($data, $usaTallas, $stockInicial, $tallaInicial) {
            $item = EppItem::create([
                'nombre' => $data['nombre'],
                'categoria' => $data['categoria'],
                'marca' => $data['marca'],
                'unidad_medida' => $data['unidad_medida'],
                'usa_tallas' => $usaTallas,
                'stock_total' => $stockInicial,
                'stock_minimo' => $data['stock_minimo'],
            ]);

            // SI USA TALLAS: crea la talla que el usuario indicó
            if ($usaTallas && $tallaInicial !== '') {
                $item->tallas()->create([
                    'talla' => $tallaInicial,
                    'stock_actual' => $stockInicial,
                ]);
            }

            // SI NO USA TALLAS: crea automáticamente la fila "Única"
            if (! $usaTallas) {
                $item->tallas()->create([
                    'talla' => 'Única',
                    'stock_actual' => $stockInicial,
                ]);
            }
        });

        return redirect()
            ->route('epp.index')
            ->with('success', 'EPP registrado exitosamente.');
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
    public function update(Request $request, EppItem $epp): RedirectResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:160'],
            'categoria' => ['required', 'string', 'max:160'],
            'marca' => ['required', 'string', 'max:160'],
            'unidad_medida' => ['required', 'string', 'max:30'],
            'stock_minimo' => ['required', 'integer', 'min:0'],
            'usa_tallas' => ['required', 'boolean'],
        ]);

        $nuevoUsaTallas = (bool) $data['usa_tallas'];
        $stockPorTallas = (int) $epp->tallas()->sum('stock_actual');

        if (! $epp->usa_tallas && $nuevoUsaTallas && (int) $epp->stock_total > 0) {
            throw ValidationException::withMessages([
                'usa_tallas' => 'No puedes activar tallas si el EPP ya tiene stock global. Ajusta el inventario primero.',
            ]);
        }

        if ($epp->usa_tallas && ! $nuevoUsaTallas && $stockPorTallas > 0) {
            throw ValidationException::withMessages([
                'usa_tallas' => 'No puedes desactivar tallas mientras existan stocks por talla.',
            ]);
        }

        DB::transaction(function () use ($epp, $data, $nuevoUsaTallas) {
            // Si pasa de usar tallas a NO usar tallas, dejamos una sola fila "Única"
            if ($epp->usa_tallas && ! $nuevoUsaTallas) {
                $epp->tallas()->delete();

                $epp->tallas()->create([
                    'talla' => 'Única',
                    'stock_actual' => 0,
                ]);
            }

            $epp->update([
                'nombre' => $data['nombre'],
                'categoria' => $data['categoria'],
                'marca' => $data['marca'],
                'unidad_medida' => $data['unidad_medida'],
                'usa_tallas' => $nuevoUsaTallas,
                'stock_minimo' => $data['stock_minimo'],
            ]);

            // Si no usa tallas, garantizamos que exista su fila "Única"
            if (! $nuevoUsaTallas) {
                $fila = $epp->tallas()->orderBy('id')->first();

                if (! $fila) {
                    $epp->tallas()->create([
                        'talla' => 'Única',
                        'stock_actual' => (int) $epp->stock_total,
                    ]);
                } else {
                    $valorTalla = trim((string) $fila->talla);

                    if ($valorTalla === '' || mb_strtolower($valorTalla) !== 'única') {
                        $fila->update([
                            'talla' => 'Única',
                        ]);
                    }
                }
            }
        });

        return redirect()
            ->route('epp.index')
            ->with('success', 'EPP actualizado correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(EppItem $epp): RedirectResponse
    {
        $stockActual = $epp->usa_tallas
            ? (int) $epp->tallas()->sum('stock_actual')
            : (int) $epp->stock_total;

        if ($stockActual > 0) {
            return back()->with('error', 'No puedes eliminar un EPP que aún tiene stock.');
        }

        try {
            DB::transaction(function () use ($epp) {
                $epp->tallas()->delete();
                $epp->delete();
            });

            return redirect()
                ->route('epp.index')
                ->with('success', 'EPP eliminado correctamente.');
        } catch (QueryException $e) {
            return back()->with(
                'error',
                'No se puede eliminar este EPP porque tiene movimientos relacionados.'
            );
        }
    }

    private function mapEpp(EppItem $item): array
    {
        $stockPorTallas = $item->tallas->map(function ($talla) {
            return [
                'id' => $talla->id,
                'talla' => (string) $talla->talla,
                'stock_actual' => (int) $talla->stock_actual,
            ];
        })->values();

        // Si tiene filas en inventario por talla, usamos ese stock (incluye "Única")
        $stockActual = $stockPorTallas->isNotEmpty()
            ? (int) $stockPorTallas->sum('stock_actual')
            : (int) $item->stock_total;

        return [
            'id' => $item->id,
            'codigo' => 'EPP-' . str_pad((string) $item->id, 3, '0', STR_PAD_LEFT),
            'nombre' => $item->nombre,
            'marca' => $item->marca,
            'categoria' => $item->categoria,
            'unidad_medida' => $item->unidad_medida,
            'unidad' => $item->unidad_medida,
            'usa_tallas' => (bool) $item->usa_tallas,
            'stock' => $stockActual,
            'stockMinimo' => (int) $item->stock_minimo,
            'estado' => $this->resolverEstado($stockActual, (int) $item->stock_minimo),
            'tallas' => $stockPorTallas,
        ];
    }

    private function resolverEstado(int $stockActual, int $stockMinimo): string
    {
        if ($stockActual <= 0) {
            return 'agotado';
        }

        if ($stockActual <= $stockMinimo) {
            return 'bajo_stock';
        }

        return 'disponible';
    }

    /**
     * Arregla EPP antiguos que no usan talla pero no tienen fila en epp_inventario_tallas.
     */
    private function asegurarInventarioUnicoParaEppsSinTalla(): void
    {
        EppItem::with('tallas:id,epp_item_id,talla,stock_actual')
            ->where('usa_tallas', false)
            ->get()
            ->each(function (EppItem $item) {
                $primeraFila = $item->tallas->sortBy('id')->first();

                if (! $primeraFila) {
                    $item->tallas()->create([
                        'talla' => 'Única',
                        'stock_actual' => (int) $item->stock_total,
                    ]);

                    return;
                }

                $primeraFila->update([
                    'talla' => 'Única',
                    'stock_actual' => (int) $item->stock_total,
                ]);
            });
    }
}
