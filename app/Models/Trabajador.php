<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use App\Models\Entrega;
use App\Models\EntregaDetalle;

class Trabajador extends Model
{
    use HasFactory;

    protected $table = 'trabajadores';

    protected $fillable = [
        'codigo_fotocheck',
        'dni',
        'nombres',
        'apellidos',
        'correo',
        'telefono',
        'cargo_id',
        'fecha_ingreso',
        'area',
        'estado',
        'foto'
    ];

    public function cargo()
    {
        return $this->belongsTo(Cargo::class, 'cargo_id');
    }

    public function entregas()
    {
        return $this->hasMany(Entrega::class, 'trabajador_id');
    }

    public function entregaDetalles(): HasManyThrough
    {
        return $this->hasManyThrough(
            \App\Models\EntregaDetalle::class,
            \App\Models\Entrega::class,
            'trabajador_id',
            'entrega_id',
            'id',
            'id'
        );
    }

    public function getNombreCompletoAttribute()
    {
        return "{$this->nombres} {$this->apellidos}";
    }

    public function getFotoUrlAttribute()
    {
        if ($this->foto && Storage::disk('public')->exists($this->foto)) {
            return Storage::url($this->foto);
        }
        return null;
    }
}
