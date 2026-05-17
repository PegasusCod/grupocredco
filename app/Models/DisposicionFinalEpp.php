<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DisposicionFinalEpp extends Model
{
    protected $table = 'disposicion_final_epp';

    protected $fillable = [
        'fecha_baja',
        'almacen_origen_id',
        'motivo',
        'acta_numero',
        'observaciones',
        'estado',        // BORRADOR | CONFIRMADO
        'user_id',
    ];

    protected $casts = [
        'fecha_baja' => 'datetime',
    ];

    public function almacenOrigen(): BelongsTo
    {
        return $this->belongsTo(Almacen::class, 'almacen_origen_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(DisposicionFinalEppDetalle::class, 'baja_id');
    }
}