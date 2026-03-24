<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EppIngreso extends Model
{
    protected $table = 'epp_ingresos';

    protected $fillable = [
        'numero_lote',
        'fecha_ingreso',
        'proveedor',
        'user_id',
        'observaciones',
    ];

    protected $casts = [
        'fecha_ingreso'=> 'date',
    ];

    public function detalles(): HasMany
    {
        return $this->hasMany(EppIngresoDetalle::class, 'epp_ingreso_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
