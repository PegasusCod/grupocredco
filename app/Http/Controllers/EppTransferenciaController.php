<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
use App\Models\EppSku;
use App\Models\EppTransferencia;
use App\Models\MovimientoEpp;
use App\Models\MovimientoTipo;
use App\Models\StockAlmacen;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EppTransferenciaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $transferencias = EppTransferencia::with([
            'almacenOrigen.proyecto',
            'almacenDestino.proyecto',
            'user:id,name',
        ])
            ->when($request->estado, fn ($q, $e) => $q->where('estado', $e))
            ->latest('fecha_transferencia')
            ->paginate(20)
            ->through(fn ($t) => [
                'id'                  => $t->id,
                'fecha_transferencia' => $t->fecha_transferencia?->format('Y-m-d H:i'),
                'almacen_origen'      => $t->almacenOrigen?->nombre,
                'proyecto_origen'     => $t->almacenOrigen?->proyecto?->nombre,
                'almacen_destino'     => $t->almacenDestino?->nombre,
                'proyecto_destino'    => $t->almacenDestino?->proyecto?->nombre,
                'motivo'              => $t->motivo,
                'observaciones'       => $t->observaciones,
                'estado'              => $t->estado,
                'responsable'         => $t->user?->name,
            ])
            ->withQueryString();

        // Detalles de cada transferencia (movimientos SALIDA asociados)
        $detallesPorTransferencia = MovimientoEpp::with(['sku.item', 'sku.talla'])
            ->where('documento_tipo', 'TRANSFERENCIA')
            ->where('naturaleza', 'SALIDA')
            ->whereIn('documento_id', $transferencias->pluck('id'))
            ->get()
            ->groupBy('documento_id')
            ->map(fn ($movs) => $movs->map(fn ($m) => [
                'epp'      => $m->sku?->item?->nombre,
                'talla'    => $m->sku?->talla?->codigo ?? 'ÚNICA',
                'cantidad' => $m->cantidad,
            ])->values());

        $stats = [
            'total'       => EppTransferencia::count(),
            'confirmadas' => EppTransferencia::where('estado', 'CONFIRMADO')->count(),
            'borradores'  => EppTransferencia::where('estado', 'BORRADOR')->count(),
        ];

        return Inertia::render('Transferencias/Index', [
            'transferencias'           => $transferencias,
            'detallesPorTransferencia' => $detallesPorTransferencia,
            'stats'                    => $stats,
            'almacenes'                => Almacen::where('activo', true)
                ->with('proyecto')
                ->get(['id', 'nombre', 'proyecto_id', 'tipo_almacen']),
            'filters'                  => $request->only(['estado']),
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
        $validated = $request->validate([
            'fecha_transferencia'         => 'required|date',
            'almacen_origen_id'           => 'required|exists:almacenes,id',
            'almacen_destino_id'          => 'required|exists:almacenes,id|different:almacen_origen_id',
            'motivo'                      => 'nullable|string|max:255',
            'observaciones'               => 'nullable|string',
            'detalles'                    => 'required|array|min:1',
            'detalles.*.epp_sku_id'       => 'required|exists:epp_skus,id',
            'detalles.*.cantidad'         => 'required|integer|min:1',
            'detalles.*.estado_stock'     => 'required|in:DISPONIBLE,DANADO,BAJA',
        ]);

        DB::transaction(function () use ($validated) {
            $transferencia = EppTransferencia::create([
                ...$validated,
                'estado'  => 'CONFIRMADO',
                'user_id' => Auth::id(),
            ]);

            $tipoSalida  = MovimientoTipo::where('codigo', 'TRANSFERENCIA_SALIDA')->firstOrFail();
            $tipoEntrada = MovimientoTipo::where('codigo', 'TRANSFERENCIA_ENTRADA')->firstOrFail();

            foreach ($validated['detalles'] as $index => $det) {
                $cantidad    = (int) $det['cantidad'];
                $estadoStock = $det['estado_stock'];

                $stockOrigen = StockAlmacen::where([
                    'almacen_id'   => $validated['almacen_origen_id'],
                    'epp_sku_id'   => $det['epp_sku_id'],
                    'estado_stock' => $estadoStock,
                ])->lockForUpdate()->first();

                if (!$stockOrigen || $stockOrigen->cantidad_actual < $cantidad) {
                    $sku = EppSku::with('item')->find($det['epp_sku_id']);
                    throw ValidationException::withMessages([
                        "detalles.$index.cantidad" => "Stock insuficiente de {$sku?->item?->nombre}.",
                    ]);
                }

                $saldoOrigenAntes = $stockOrigen->cantidad_actual;
                $stockOrigen->decrement('cantidad_actual', $cantidad);

                MovimientoEpp::create([
                    'fecha_movimiento'       => $validated['fecha_transferencia'],
                    'almacen_id'             => $validated['almacen_origen_id'],
                    'almacen_contraparte_id' => $validated['almacen_destino_id'],
                    'epp_sku_id'             => $det['epp_sku_id'],
                    'tipo_movimiento_id'     => $tipoSalida->id,
                    'naturaleza'             => 'SALIDA',
                    'estado_stock'           => $estadoStock,
                    'cantidad'               => $cantidad,
                    'saldo_anterior'         => $saldoOrigenAntes,
                    'saldo_nuevo'            => $stockOrigen->cantidad_actual,
                    'documento_tipo'         => 'TRANSFERENCIA',
                    'documento_id'           => $transferencia->id,
                    'user_id'                => Auth::id(),
                ]);

                $stockDestino = StockAlmacen::firstOrCreate(
                    [
                        'almacen_id'   => $validated['almacen_destino_id'],
                        'epp_sku_id'   => $det['epp_sku_id'],
                        'estado_stock' => $estadoStock,
                    ],
                    ['cantidad_actual' => 0, 'stock_minimo' => 0]
                );

                $saldoDestinoAntes = $stockDestino->cantidad_actual;
                $stockDestino->increment('cantidad_actual', $cantidad);

                MovimientoEpp::create([
                    'fecha_movimiento'       => $validated['fecha_transferencia'],
                    'almacen_id'             => $validated['almacen_destino_id'],
                    'almacen_contraparte_id' => $validated['almacen_origen_id'],
                    'epp_sku_id'             => $det['epp_sku_id'],
                    'tipo_movimiento_id'     => $tipoEntrada->id,
                    'naturaleza'             => 'ENTRADA',
                    'estado_stock'           => $estadoStock,
                    'cantidad'               => $cantidad,
                    'saldo_anterior'         => $saldoDestinoAntes,
                    'saldo_nuevo'            => $stockDestino->cantidad_actual,
                    'documento_tipo'         => 'TRANSFERENCIA',
                    'documento_id'           => $transferencia->id,
                    'user_id'                => Auth::id(),
                ]);
            }
        });

        return back()->with('success', 'Transferencia registrada correctamente.');
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
    public function anular(EppTransferencia $transferencia): RedirectResponse
    {
        if ($transferencia->estado === 'ANULADO') {
            return back()->with('error', 'Esta transferencia ya está anulada.');
        }

        DB::transaction(function () use ($transferencia) {
            $movimientos = MovimientoEpp::where('documento_tipo', 'TRANSFERENCIA')
                ->where('documento_id', $transferencia->id)
                ->get();

            foreach ($movimientos as $mov) {
                $stock = StockAlmacen::firstOrCreate(
                    ['almacen_id' => $mov->almacen_id, 'epp_sku_id' => $mov->epp_sku_id, 'estado_stock' => $mov->estado_stock],
                    ['cantidad_actual' => 0]
                );

                $mov->naturaleza === 'SALIDA'
                    ? $stock->increment('cantidad_actual', $mov->cantidad)
                    : $stock->decrement('cantidad_actual', $mov->cantidad);

                $mov->update(['estado_registro' => 'ANULADO']);
            }

            $transferencia->update(['estado' => 'ANULADO']);
        });

        return back()->with('success', 'Transferencia anulada y stock revertido.');
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
