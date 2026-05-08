<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EppIngresoDetalle extends Model
{
    use HasFactory;

    protected $table = 'epp_ingreso_detalles';

    protected $fillable = [
        'ingreso_id',
        'epp_sku_id',
        'cantidad',
        'movimiento_entrada_id',
    ];

    protected $casts = [
        'cantidad' => 'integer',
    ];

    // ── Relaciones ────────────────────────────────────────────────────────────

    /**
     * Cabecera del ingreso al que pertenece este detalle.
     */
    public function ingreso(): BelongsTo
    {
        return $this->belongsTo(EppIngreso::class, 'ingreso_id');
    }

    /**
     * SKU del EPP ingresado (incluye talla).
     */
    public function sku(): BelongsTo
    {
        return $this->belongsTo(EppSku::class, 'epp_sku_id');
    }

    /**
     * Movimiento de kardex generado por este detalle.
     */
    public function movimientoEntrada(): BelongsTo
    {
        return $this->belongsTo(MovimientoEpp::class, 'movimiento_entrada_id');
    }
}