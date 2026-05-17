<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class EppEntregaDetalle extends Model
{
    protected $table = 'epp_entrega_detalles';

    protected $fillable = [
        'entrega_id',
        'epp_sku_id',
        'cantidad',
        'motivo_entrega',
        'custodia_afectada_id',
        'incidencia_id',
        'movimientos_salida_id',
        'movimientos_entrada_seg_id',
        'observaciones',
    ];

        protected $casts = [
            'cantidad' => 'integer',
        ];

    public function entrega(): BelongsTo
    {
        return $this->belongsTo(EppEntrega::class, 'entrega_id');
    }

    public function sku(): BelongsTo
    {
        return $this->belongsTo(EppSku::class, 'epp_sku_id');
    }

    public function custodiaAfectada(): BelongsTo
    {
        return $this->belongsTo(TrabajadorEppCustodia::class, 'custodia_afectada_id');
    }

    public function incidencia(): BelongsTo
    {
        return $this->belongsTo(IncidenciaEpp::class, 'incidencia_id');
    }

    public function custodia(): HasOne
    {
        return $this->hasOne(TrabajadorEppCustodia::class, 'entrega_detalle_id');
    }
}
