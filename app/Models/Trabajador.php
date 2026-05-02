<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Trabajador extends Model
{
    protected $table = 'trabajadores';

    protected $fillable = [
        'proyecto_id',
        'cargo_laboral_id',
        'codigo_fotocheck',
        'dni',
        'nombres',
        'apellidos',
        'correo',
        'telefono',
        'happy_birthday',
        'fecha_ingreso',
        'fecha_cese',
        'estado',
        'foto_url',
    ];

    protected $casts = [
        'happy_birthday' => 'date',
        'fecha_ingreso' => 'date',
        'fecha_cese' => 'date',
    ];

    public function proyecto(): BelongsTo
    {
        return $this->belongsTo(Proyecto::class);
    }

    public function cargoLaboral(): BelongsTo
    {
        return $this->belongsTo(CargoLaboral::class);
    }

    public function custodias(): HasMany
    {
        return $this->hasMany(TrabajadorEppCustodia::class);
    }

    public function entregas(): HasMany
    {
        return $this->hasMany(EppEntrega::class);
    }

    public function incidencias(): HasMany
    {
        return $this->hasMany(IncidenciaEpp::class);
    }

    public function getNombreCompletoAttribute(): string
    {
        return "{$this->nombres} {$this->apellidos}";
    }
}
