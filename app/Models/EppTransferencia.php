<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EppTransferencia extends Model
{
    protected $table = 'epp_transferencia';

    protected $fillable = [
        'fecha_transferencia',
        'almacen_origen_id',
        'almacen_destino_id',
        'motivo',
        'observaciones',
        'estado',
        'user_id',
    ];

    protected $casts = [
        'fecha_transferencia' => 'datetime',
    ];

    public function almacenOrigen(): BelongsTo
    {
        return $this->belongsTo(Almacen::class, 'almacen_origen_id');
    }

    public function almacenDestino(): BelongsTo
    {
        return $this->belongsTo(Almacen::class, 'almacen_destino_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
