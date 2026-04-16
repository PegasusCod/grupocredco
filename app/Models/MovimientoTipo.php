<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MovimientoTipo extends Model
{
    protected $table = 'movimiento_tipos';

    public $timestamps = false;

    protected $fillable = [
        'codigo',
        'nombre',
        'naturaleza_default',
        'afecta_stock',
        'activo',
    ];

    protected $casts = [
        'afecta_stock' => 'boolean',
        'activo' => 'boolean',
    ];

    public function movimientos(): HasMany
    {
        return $this->hasMany(MovimientoEpp::class, 'tipo_movimiento_id');
    }
}
