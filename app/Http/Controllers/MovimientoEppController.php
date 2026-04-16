<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
use App\Models\EppItem;
use App\Models\MovimientoEpp;
use App\Models\MovimientoTipo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MovimientoEppController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $movimientos = MovimientoEpp::with([
            'almacen:id,nombre',
            'almacenContraparte:id,nombre',
            'sku.item:id,nombre',
            'sku.talla:id,codigo,nombre',
            'tipoMovimiento:id,codigo,nombre',
            'trabajador:id,nombres,apellidos,codigo_fotocheck',
            'user:id,name',
        ])
            ->when($request->almacen_id, fn ($q) => $q->where('almacen_id', $request->almacen_id))
            ->when($request->epp_item_id, fn ($q) =>
                $q->whereHas('sku', fn ($s) => $s->where('epp_item_id', $request->epp_item_id))
            )
            ->when($request->naturaleza, fn ($q) => $q->where('naturaleza', $request->naturaleza))
            ->when($request->fecha_desde, fn ($q) => $q->whereDate('fecha_movimiento', '>=', $request->fecha_desde))
            ->when($request->fecha_hasta, fn ($q) => $q->whereDate('fecha_movimiento', '<=', $request->fecha_hasta))
            ->when($request->tipo_movimiento_id, fn ($q) => $q->where('tipo_movimiento_id', $request->tipo_movimiento_id))
            ->where('estado_registro', 'CONFIRMADO')
            ->latest('fecha_movimiento')
            ->paginate(30)
            ->through(fn ($m) => [
                'id'                  => $m->id,
                'fecha_movimiento'    => $m->fecha_movimiento?->format('Y-m-d H:i'),
                'almacen'             => $m->almacen?->nombre,
                'almacen_contraparte' => $m->almacenContraparte?->nombre,
                'epp'                 => $m->sku?->item?->nombre ?? '—',
                'talla'               => $m->sku?->talla?->codigo ?? 'ÚNICA',
                'tipo_movimiento'     => $m->tipoMovimiento?->nombre,
                'tipo_codigo'         => $m->tipoMovimiento?->codigo,
                'naturaleza'          => $m->naturaleza,
                'estado_stock'        => $m->estado_stock,
                'cantidad'            => $m->cantidad,
                'saldo_anterior'      => $m->saldo_anterior,
                'saldo_nuevo'         => $m->saldo_nuevo,
                'documento_tipo'      => $m->documento_tipo,
                'referencia'          => $m->referencia,
                'trabajador'          => $m->trabajador
                    ? "{$m->trabajador->nombres} {$m->trabajador->apellidos} ({$m->trabajador->codigo_fotocheck})"
                    : null,
                'observaciones'       => $m->observaciones,
                'responsable'         => $m->user?->name,
            ])
            ->withQueryString();

        return Inertia::render('Kardex/Index', [
            'movimientos'     => $movimientos,
            'almacenes'       => Almacen::where('activo', true)->get(['id', 'nombre', 'tipo_almacen']),
            'eppItems'        => EppItem::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
            'tiposMovimiento' => MovimientoTipo::where('activo', true)->get(['id', 'codigo', 'nombre', 'naturaleza_default']),
            'filters'         => $request->only([
                'almacen_id', 'epp_item_id', 'naturaleza',
                'fecha_desde', 'fecha_hasta', 'tipo_movimiento_id',
            ]),
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
