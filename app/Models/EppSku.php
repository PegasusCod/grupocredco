<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EppSku extends Model
{
    protected $table = 'epp_skus';

    protected $fillable = [
        'epp_item_id',
        'talla_id',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(EppItem::class, 'epp_item_id');
    }

    public function talla(): BelongsTo
    {
        return $this->belongsTo(Talla::class);
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(StockAlmacen::class);
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(MovimientoEpp::class);
    }
}
