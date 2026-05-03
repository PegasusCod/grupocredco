<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EppEntrega extends Model
{
    protected $table = 'epp_entregas';

    protected $fillable = [
        'fecha_entrega',
        'trabajador_id',
        'proyecto_id',
        'almacen_origen_id',
        'observaciones',
        'estado',
        'user_id',
    ];
    protected $casts = [
        'fecha_entrega' => 'datetime',
    ];

    public function trabajador(): BelongsTo
    {
        return $this->belongsTo(Trabajador::class);
    }

    public function proyecto(): BelongsTo
    {
        return $this->belongsTo(Proyecto::class);
    }

    public function almacenOrigen(): BelongsTo
    {
        return $this->belongsTo(Almacen::class, 'almacen_origen_id');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(EppEntregaDetalle::class, 'entrega_id');
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
