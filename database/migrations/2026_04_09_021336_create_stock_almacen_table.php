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
        Schema::create('stock_almacen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('almacen_id')->constrained('almacenes');
            $table->foreignId('epp_sku_id')->constrained('epp_skus');
            $table->enum('estado_stock', ['DISPONIBLE', 'DANADO', 'BAJA'])->default('DISPONIBLE');
            $table->integer('cantidad_actual')->default(0);
            $table->integer('stock_minimo')->default(0);
            $table->integer('stock_maximo')->nullable();
            $table->timestamps();

            $table->unique(['almacen_id', 'epp_sku_id', 'estado_stock'], 'uq_stock_almacen_sku_estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_almacen');
    }
};
