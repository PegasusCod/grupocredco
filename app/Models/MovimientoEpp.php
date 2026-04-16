<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MovimientoEpp extends Model
{
    protected $table = 'movimientos_epp';

    protected $fillable = [
        'fecha_movimiento',
        'almacen_id',
        'almacen_contraparte_id',
        'proyecto_id',
        'trabajador_id',
        'epp_sku_id',
        'tipo_movimiento_id',
        'naturaleza',
        'estado_stock',
        'cantidad',
        'saldo_anterior',
        'saldo_nuevo',
        'documento_tipo',
        'documento_id',
        'referencia',
        'observaciones',
        'estado_registro',
        'user_id',
    ];

    protected $casts = [
        'fecha_movimiento' => 'datetime',
        'cantidad' => 'integer',
        'saldo_anterior' => 'integer',
        'saldo_nuevo' => 'integer',
    ];

    public function almacen(): BelongsTo
    {
        return $this->belongsTo(Almacen::class);
    }

    public function almacenContraparte(): BelongsTo
    {
        return $this->belongsTo(Almacen::class, 'almacen_contraparte_id');
    }

    public function proyecto(): BelongsTo
    {
        return $this->belongsTo(Proyecto::class);
    }

    public function trabajador(): BelongsTo
    {
        return $this->belongsTo(Trabajador::class);
    }

    public function sku(): BelongsTo
    {
        return $this->belongsTo(EppSku::class, 'epp_sku_id');
    }

    public function tipoMovimiento(): BelongsTo
    {
        return $this->belongsTo(MovimientoTipo::class, 'tipo_movimiento_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

}
