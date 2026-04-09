<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('epp_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('categoria_id')->nullable()->constrained('epp_categorias');
            $table->string('nombre', 160);
            $table->string('marca', 60)->nullable();
            $table->string('unidad_medida', 20)->default('UND');
            $table->boolean('usa_tallas')->default(false);
            $table->integer('vida_util_meses')->nullable();
            $table->string('imagen_url', 255)->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('epp_items');
    }
};
