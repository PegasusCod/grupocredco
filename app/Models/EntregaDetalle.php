<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EntregaDetalle extends Model
{
    protected $table = 'entrega_detalles';

    protected $fillable = [
        'entrega_id',
        'epp_talla_id',
        'cantidad',
        'motivo',
    ];

    public function entrega()
    {
        return $this->belongsTo(Entrega::class, 'entrega_id');
    }

    public function eppTalla()
    {
        return $this->belongsTo(EppInventarioTalla::class, 'epp_talla_id');
    }
}
