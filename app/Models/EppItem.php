<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EppItem extends Model
{
    protected $table = 'epp_items';

    protected $fillable = [
        'nombre',
        'marca',
        'categoria',
        'unidad_medida',
        'usa_tallas',
        'stock_total',
        'stock_minimo',
        'imagen_url',
    ];
    protected $casts = [
        'usa_tallas' => 'boolean',
        'stock_total' => 'integer',
        'stock_minimo' => 'integer',
    ];
    /* un epp tiene muchas tallas y variantes */

    public function tallas(): HasMany
    {
        return $this->hasMany(EppInventarioTalla::class, 'epp_item_id');
    }

    public function ingresoDetalles(): HasMany
    {
        return $this->hasMany(EppIngresoDetalle::class, 'epp_item_id');
    }
}
