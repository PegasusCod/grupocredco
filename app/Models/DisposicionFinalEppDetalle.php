<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DisposicionFinalEppDetalle extends Model
{
    protected $table = 'disposicion_final_epp_detalles';

    protected $fillable = [
        'baja_id',
        'epp_sku_id',
        'cantidad',
        'movimiento_salida_id',
        'observaciones',
    ];

    protected $casts = [
        'cantidad' => 'integer',
    ];

    public function baja(): BelongsTo
    {
        return $this->belongsTo(DisposicionFinalEpp::class, 'baja_id');
    }

    public function sku(): BelongsTo
    {
        return $this->belongsTo(EppSku::class, 'epp_sku_id');
    }

    public function movimientoSalida(): BelongsTo
    {
        return $this->belongsTo(MovimientoEpp::class, 'movimiento_salida_id');
    }
}