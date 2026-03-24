<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EppIngresoDetalle extends Model
{
    protected $table = 'epp_ingreso_detalles';

    protected $fillable = [
        'epp_ingreso_id',
        'epp_item_id',
        'talla',
        'cantidad',
        'stock_anterior_item',
        'stock_nuevo_item',
        'stock_anterior_talla',
        'stock_nuevo_talla',
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'stock_anterior_item' => 'integer',
        'stock_nuevo_item' => 'integer',
        'stock_anterior_talla' => 'integer',
        'stock_nuevo_talla' => 'integer',
    ];

    public function ingreso(): BelongsTo
    {
        return $this->belongsTo(EppIngreso::class, 'epp_ingreso_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(EppItem::class, 'epp_item_id');
    }
}
