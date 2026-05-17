<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EppTransferenciaDetalle extends Model
{
    protected $table = 'epp_transferencia_detalles';

    protected $fillable = [
        'transferencia_id',
        'epp_sku_id',
        'cantidad',
        'movimiento_salida_id',
        'movimiento_entrada_id',
    ];

    protected $casts = [
        'cantidad' => 'integer',
    ];

    public function transferencia(): BelongsTo
    {
        return $this->belongsTo(EppTransferencia::class, 'transferencia_id');
    }

    public function sku(): BelongsTo
    {
        return $this->belongsTo(EppSku::class, 'epp_sku_id');
    }

    public function movimientoSalida(): BelongsTo
    {
        return $this->belongsTo(MovimientoEpp::class, 'movimiento_salida_id');
    }

    public function movimientoEntrada(): BelongsTo
    {
        return $this->belongsTo(MovimientoEpp::class, 'movimiento_entrada_id');
    }
}