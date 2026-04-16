<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Almacen extends Model
{
    protected $table = 'almacenes';

    protected $fillable = [
        'proyecto_id',
        'nombre',
        'tipo_almacen',
        'compartido',
        'activo',
    ];

    protected $casts = [
        'compartido' => 'boolean',
        'activo' => 'boolean',
    ];

    public function proyecto(): BelongsTo
    {
        return $this->belongsTo(Proyecto::class);
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(StockAlmacen::class);
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(MovimientoEpp::class);
    }

    public function transferenciaasOrigen(): HasMany
    {
        return $this->hasMany(EppTransferencia::class, 'almacen_origen_id');
    }

    public function transferenciasDestino(): HasMany
    {
        return $this->hasMany(EppTransferencia::class, 'almacen_destino_id');
    }
}
