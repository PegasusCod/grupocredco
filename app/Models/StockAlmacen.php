<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAlmacen extends Model
{
    protected $table = 'stock_almacen';

    protected $fillable = [
        'almacen_id',
        'epp_sku_id',
        'estado_stock',
        'cantidad_actual',
        'stock_minimo',
        'stock_maximo',
    ];

        protected $casts = [
            'cantidad_actual' => 'integer',
            'stock_minimo' => 'integer',
            'stock_maximo' => 'integer',
        ];

    public function almacen(): BelongsTo
    {
        return $this->belongsTo(Almacen::class);
    }

    public function sku(): BelongsTo
    {
        return $this->belongsTo(EppSku::class, 'epp_sku_id');
    }

    public function getBajoMinimoAttribute(): bool
    {
        return $this->cantidad_actual < $this->stock_minimo;
    }

    // ── Helper estático: incrementar stock de forma segura ─────────────────
    // Usa firstOrCreate + lockForUpdate para evitar duplicados y race conditions
    public static function incrementarSeguro(
        int $almacenId,
        int $eppSkuId,
        string $estadoStock,
        int $cantidad,
        int $stockMinimo = 0
    ): self {
        // lockForUpdate dentro de una transacción evita que dos requests
        // simultáneos creen dos filas para el mismo (almacen, sku, estado)
        $stock = self::lockForUpdate()
            ->firstOrCreate(
                [
                    'almacen_id'   => $almacenId,
                    'epp_sku_id'   => $eppSkuId,
                    'estado_stock' => $estadoStock,
                ],
                ['cantidad_actual' => 0, 'stock_minimo' => $stockMinimo]
            );
 
        $stock->increment('cantidad_actual', $cantidad);
 
        return $stock->fresh();
    }
 
    // ── Helper estático: decrementar stock de forma segura ─────────────────
    public static function decrementarSeguro(
        int $almacenId,
        int $eppSkuId,
        string $estadoStock,
        int $cantidad
    ): self {
        $stock = self::where([
            'almacen_id'   => $almacenId,
            'epp_sku_id'   => $eppSkuId,
            'estado_stock' => $estadoStock,
        ])->lockForUpdate()->firstOrFail();
 
        $stock->decrement('cantidad_actual', $cantidad);
 
        return $stock->fresh();
    }
}
