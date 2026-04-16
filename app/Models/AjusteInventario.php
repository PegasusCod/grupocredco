<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AjusteInventario extends Model
{
    protected $table = 'ajuste_inventario';

    protected $fillable = [
        'fecha_ajuste',
        'almacen_id',
        'tipo_ajuste',
        'motivo',
        'observaciones',
        'estado',
        'user_id',
    ];

    protected $casts = [
        'fecha_ajuste' => 'datetime',
    ];

    public function almacen(): BelongsTo
    {
        return $this->belongsTo(Almacen::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
