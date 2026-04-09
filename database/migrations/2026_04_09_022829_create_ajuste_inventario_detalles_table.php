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
        Schema::create('ajuste_inventario_detalles', function (Blueprint $table) {
            $table->id();
             $table->foreignId('ajuste_id')->constrained('ajustes_inventario');
            $table->foreignId('epp_sku_id')->constrained('epp_skus');
            $table->integer('cantidad');
            $table->foreignId('movimiento_id')->nullable()->constrained('movimientos_epp');
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ajuste_inventario_detalles');
    }
};
