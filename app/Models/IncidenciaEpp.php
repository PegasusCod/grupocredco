<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IncidenciaEpp extends Model
{
    protected $table = 'incidencia_epp';

    protected $fillable = [
        'fecha_incidencia',
        'trabajador_id',
        'proyecto_id',
        'custodia_id',
        'epp_sku_id',
        'cantidad',
        'tipo_incidencia',
        'genera_reposicion',
        'descripcion',
        'estado',
        'user_id',
    ];

    protected $casts = [
        'fecha_incidencia' => 'datetime',
        'genra_reposicion' => 'boolean',
        'cantidad' => 'integer'
    ];

    public function trabajador() : Belongsto
    {
        return $this->belongsTo(Trabajador::class);
    }

    public function proyecto(): BelongsTo
    {
        return $this->belongsTo(Proyecto::class);
    }

    public function custodia(): BelongsTo
    {
        return $this->belongsTo(TrabajadorEppCustodia::class, 'custodia_id');
    }

    public function sku(): BelongsTo
    {
        return $this->belongsTo(EppSku::class, 'epp_sku_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
