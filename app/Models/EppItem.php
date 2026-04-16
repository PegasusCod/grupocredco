<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EppItem extends Model
{
    protected $table = 'epp_items';

    protected $fillable = [
        'categoria_id',
        'nombre',
        'marca',
        'unidad_medida',
        'usa_tallas',
        'vida_util_meses',
        'imagen_url',
        'activo',
    ];

    protected $casts = [
        'usa_tallas' => 'boolean',
        'activo' => 'boolean',
    ];

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(EppCategoria::class, 'categoria_id');   
    }
    public function skus(): HasMany
    {
        return $this->hasMany(EppSku::class);
    }
}
