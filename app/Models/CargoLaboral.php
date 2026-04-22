<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CargoLaboral extends Model
{
    protected $table = 'cargos_laborales';

    protected $fillable = [
        'nombre',
    ];

    public function trabajadores(): HasMany
    {
        return $this->hasMany(Trabajador::class);
    }
}
