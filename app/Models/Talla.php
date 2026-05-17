<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Talla extends Model
{
    protected $table = 'tallas';

    protected $fillable = [
        'codigo',
        'nombre',
        'orden_visual',
        'activo',
    ];
    protected $casts = [
        'activo' => 'boolean',
    ];

    public function skus(): HasMany
    {
        return $this->hasMany(EppSku::class , 'talla_id');
    }
}
