<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Entrega extends Model
{
    protected $table = 'entregas';

    protected $fillable = [
        'fecha',
        'trabajador_id',
        'registrado_por_id',
        'observaciones',
    ];

    protected $casts = [
        'fecha' => 'date',
    ];

    public function trabajador()
    {
        return $this->belongsTo(Trabajador::class, 'trabajador_id');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'registrado_por_id');
    }

    public function detalles()
    {
        return $this->hasMany(EntregaDetalle::class, 'entrega_id');
    }
}
