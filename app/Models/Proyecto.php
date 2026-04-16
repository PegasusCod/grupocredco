<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Proyecto extends Model
{
    protected $table = 'proyectos';

    protected $fillable = [
        'nombre',
        'activo',
    ];
    protected $casts = [
        'activo' => 'boolean',
    ];

    public function almacenes(): HasMany
    {
        return $this->hasMany(Almacen::class);
    }
    public function trabajadores(): HasMany
    {
        return $this->hasMany(Trabajador::class);
    }
    public function movimientos(): HasMany
    {
        return $this->hasMany(MovimientoEpp::class);
    }
    public function entregas(): HasMany
    {
        return $this->hasMany(EppEntrega::class);
    }

}
