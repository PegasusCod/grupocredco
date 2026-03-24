<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EppInventarioTalla extends Model
{
    protected $table = 'epp_inventario_tallas';

    protected $fillable = [
        'epp_item_id',
        'talla',
        'stock_actual',
    ];

    protected $casts = [
        'stock_actual' => 'integer',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(EppItem::class, 'epp_item_id');
    }
}
