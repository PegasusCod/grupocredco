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
}
