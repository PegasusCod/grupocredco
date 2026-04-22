<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
use App\Models\EppCategoria;
use App\Models\EppItem;
use App\Models\EppSku;
use App\Models\StockAlmacen;
use App\Models\Talla;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Storage;
class EppController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $epps = EppItem::with([
            'categoria',
            'skus' => fn ($q) => $q->with('talla', 'stocks.almacen.proyecto'),
        ])
            ->where('activo', true)
            ->orderBy('nombre')
            ->get()
            ->map(fn (EppItem $item) => $this->mapEpp($item))
            ->values();

        $categorias = EppCategoria::where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        $tallas = Talla::where('activo', true)
            ->orderBy('orden_visual')
            ->get(['id', 'codigo', 'nombre']);

        $almacenes = Almacen::where('activo', true)
            ->where('tipo_almacen', 'OPERATIVO')
            ->with('proyecto')
            ->get(['id', 'nombre', 'tipo_almacen'/* , 'proyecto_id' */]);

        return Inertia::render('EPP/Index', [
            'epps'       => $epps,
            'categorias' => $categorias,
            'tallas'     => $tallas,
            'almacenes'  => $almacenes,
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
            'nombre'          => 'required|string|max:160',
            'categoria_id'    => 'required|exists:epp_categorias,id',
            'marca'           => 'nullable|string|max:60',
            'unidad_medida'   => 'required|string|max:20',
            'stock_minimo'    => 'required|integer|min:0',
            'vida_util_meses' => 'nullable|integer|min:1',
            'usa_tallas'      => 'required|boolean',
            'almacen_id'      => 'nullable|exists:almacenes,id',
            'stock_inicial'   => 'nullable|integer|min:0',
            'tallas_stock'              => 'nullable|array',
            'tallas_stock.*.talla_id'   => 'required|exists:tallas,id',
            'tallas_stock.*.almacen_id' => 'required|exists:almacenes,id',
            'tallas_stock.*.cantidad'   => 'required|integer|min:0',
            'imagen_url'       => 'nullable|image|max:2048',
        ]);

        $usaTallas = (bool) $data['usa_tallas'];

        if ($request->hasFile('imagen_url')) {
            $data['imagen_url'] = $request->file('imagen_url')
            ->store('epp_images', 'public');
        }

        /* unset($validated['imagen_url']); */

        if (!$usaTallas && empty($data['almacen_id']) && ($data['stock_inicial'] ?? 0) > 0) {
            throw ValidationException::withMessages([
                'almacen_id' => 'Debes indicar el almacén para registrar stock inicial.',
            ]);
        }

        DB::transaction(function () use ($data, $usaTallas) {
            $item = EppItem::create([
                'categoria_id'    => $data['categoria_id'],
                'nombre'          => $data['nombre'],
                'marca'           => $data['marca'] ?? null,
                'unidad_medida'   => $data['unidad_medida'],
                'usa_tallas'      => $usaTallas,
                'imagen_url'       => $data['imagen_url'] ?? null,
                'vida_util_meses' => $data['vida_util_meses'] ?? null,
                'activo'          => true,
            ]);

            if ($usaTallas && !empty($data['tallas_stock'])) {
                foreach ($data['tallas_stock'] as $ts) {
                    $sku = EppSku::firstOrCreate([
                        'epp_item_id' => $item->id,
                        'talla_id'    => $ts['talla_id'],
                    ]);

                    if ((int) $ts['cantidad'] > 0) {
                        StockAlmacen::create([
                            'almacen_id'      => $ts['almacen_id'],
                            'epp_sku_id'      => $sku->id,
                            'estado_stock'    => 'DISPONIBLE',
                            'cantidad_actual' => $ts['cantidad'],
                            'stock_minimo'    => $data['stock_minimo'],
                        ]);
                    }
                }
            } else {
                $tallaUnica = Talla::where('codigo', 'UNICA')->firstOrFail();
                $sku = EppSku::create([
                    'epp_item_id' => $item->id,
                    'talla_id'    => $tallaUnica->id,
                ]);

                if (!empty($data['almacen_id']) && ($data['stock_inicial'] ?? 0) > 0) {
                    StockAlmacen::create([
                        'almacen_id'      => $data['almacen_id'],
                        'epp_sku_id'      => $sku->id,
                        'estado_stock'    => 'DISPONIBLE',
                        'cantidad_actual' => $data['stock_inicial'],
                        'stock_minimo'    => $data['stock_minimo'],
                    ]);
                }
            }
        });

        return back()->with('success', 'EPP registrado exitosamente.');
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
            'nombre'          => 'required|string|max:160',
            'categoria_id'    => 'required|exists:epp_categorias,id',
            'marca'           => 'nullable|string|max:60',
            'unidad_medida'   => 'required|string|max:20',
            'stock_minimo'    => 'required|integer|min:0',
            'vida_util_meses' => 'nullable|integer|min:1',
            'imagen_url'       => 'nullable|image|max:2048',
            'activo'          => 'boolean',
        ]);

        if ($request->hasFile('imagen_url')) {
            if ($epp->imagen_url) {
                Storage::disk('public')->delete($epp->imagen_url);
            }
            $data['imagen_url'] = $request->file('imagen_url')
                ->store('epp_images', 'public');
        }else {
            unset($data['imagen_url']);
        }

        $epp->update($data);

        StockAlmacen::whereHas('sku', fn ($q) => $q->where('epp_item_id', $epp->id))
            ->update(['stock_minimo' => $data['stock_minimo']]);

        return back()->with('success', 'EPP actualizado correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(EppItem $epp): RedirectResponse
    {
        $tieneStock = StockAlmacen::whereHas('sku', fn ($q) => $q->where('epp_item_id', $epp->id))
            ->where('cantidad_actual', '>', 0)
            ->exists();

        if ($tieneStock) {
            return back()->with('error', 'No puedes eliminar un EPP que aún tiene stock.');
        }

        try {
            DB::transaction(function () use ($epp) {
                StockAlmacen::whereHas('sku', fn ($q) => $q->where('epp_item_id', $epp->id))->delete();
                $epp->skus()->delete();
                $epp->update(['activo' => false]);
            });

            return back()->with('success', 'EPP desactivado correctamente.');
        } catch (QueryException) {
            return back()->with('error', 'No se puede eliminar este EPP porque tiene movimientos relacionados.');
        }
    }

    private function mapEpp(EppItem $item): array
    {
        $skusMapeados = $item->skus ? $item->skus->map(function (EppSku $sku) {
            $stockDisponible = $sku->stocks->where('estado_stock', 'DISPONIBLE')->sum('cantidad_actual');

            return [
                'id'               => $sku->id,
                'talla_id'         => $sku->talla_id,
                'talla'            => $sku->talla?->codigo ?? 'UNICA',
                'talla_nombre'     => $sku->talla?->nombre ?? 'Única',
                'stock_disponible' => (int) $stockDisponible,
                'stocks_por_almacen' => $sku->stocks->map(fn ($s) => [
                    'almacen_id'      => $s->almacen_id,
                    'almacen_nombre'  => $s->almacen?->nombre,
                    'proyecto_nombre' => $s->almacen?->proyecto?->nombre,
                    'estado_stock'    => $s->estado_stock,
                    'cantidad_actual' => $s->cantidad_actual,
                    'stock_minimo'    => $s->stock_minimo,
                ])->values(),
            ];
        })->values(): collect();

        $stockTotal = $skusMapeados->sum('stock_disponible');

        return [
            'id'              => $item->id,
            'codigo'          => 'EPP-' . str_pad((string) $item->id, 3, '0', STR_PAD_LEFT),
            'nombre'          => $item->nombre,
            'marca'           => $item->marca,
            'categoria'       => $item->categoria?->nombre,
            'categoria_id'    => $item->categoria_id,
            'unidad_medida'   => $item->unidad_medida,
            'usa_tallas'      => (bool) $item->usa_tallas,
            'foto_url'        => $item->imagen_url
                    ? Storage::url($item->imagen_url)
                    : null,
            'vida_util_meses' => $item->vida_util_meses,
            'stock'           => $stockTotal,
            'stock_minimo'    => $this->getStockMinimo($item),
            'estado'          => $this->resolverEstado($stockTotal, $this->getStockMinimo($item)),
            'activo'          => (bool) $item->activo,
            'skus'            => $skusMapeados,
        ];
    }
    private function getStockMinimo(EppItem $item): int
    {
        return (int) StockAlmacen::whereHas('sku', fn ($q) => $q->where('epp_item_id', $item->id))
            ->max('stock_minimo');
    }

    private function resolverEstado(int $stock, int $minimo): string
    {
        if ($stock <= 0)       return 'AGOTADO';
        if ($stock <= $minimo) return 'BAJO_STOCK';
        return 'DISPONIBLE';
    }
}
