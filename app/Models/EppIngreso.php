<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EppIngreso extends Model
{
    use HasFactory;

    protected $table = 'epp_ingresos';

    protected $fillable = [
        'fecha_ingreso',
        'almacen_destino_id',
        'documento_guia_remision',
        'observaciones',
        'estado',
        'user_id',
    ];

    protected $casts = [
        'fecha_ingreso' => 'date',
    ];

    // ── Relaciones ────────────────────────────────────────────────────────────

    /**
     * Almacén donde se recibe el ingreso.
     * Columna real: almacen_destino_id (no almacen_id)
     */
    public function almacenDestino(): BelongsTo
    {
        return $this->belongsTo(Almacen::class, 'almacen_destino_id');
    }

    /**
     * Detalles de cada EPP/SKU ingresado.
     */
    public function detalles(): HasMany
    {
        return $this->hasMany(EppIngresoDetalle::class, 'ingreso_id');
    }

    /**
     * Usuario que registró el ingreso.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}