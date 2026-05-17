<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrabajadorEppCustodia extends Model
{
    protected $table = 'trabajador_epp_custodia';

    protected $fillable = [
        'trabajador_id',
        'entrega_detalle_id',
        'epp_sku_id',
        'cantidad_entregada',
        'cantidad_devuelta',
        'cantidad_perdida',
        'estado',
        'fecha_entrega',
        'fecha_cierre',
        'observaciones'
    ];

    protected $cast = [
        'fecha_entrega' => 'datetime',
        'fecha_cierre' => 'dateetime',
        'cantidad_entregada' => 'integer',
        'cantidad_devuelta' => 'integer',
        'cantidad_perdida' => 'integer',
    ];

    public function trabajador(): BelongsTo
    {
        return $this->belongsTo(Trabajador::class);
    }

    public function entregaDetalle(): BelongsTo
    {
        return $this->belongsTo(EppEntregaDetalle::class , 'entrega_detalle_id');
    }

    public function sku(): BelongsTo
    {
        return $this->belongsTo(EppSku::class, 'epp_sku_id');
    }

    public function getCantidadPendienteAttribute():int
    {
        return $this->cantidad_entregada - $this->cantidad_devuelta - $this->cantidad_perdida;
    }
}
