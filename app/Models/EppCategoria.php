<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EppCategoria extends Model
{
    protected $table = 'epp_categorias';

    protected $fillable = [
        'nombre',
        'activo',
    ];
    protected $casts = [
        'activo' => 'boolean',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(EppItem::class, 'categoria_id');
    }
}
