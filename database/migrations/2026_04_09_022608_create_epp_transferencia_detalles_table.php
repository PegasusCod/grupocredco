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
        Schema::create('epp_transferencia_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transferencia_id')->constrained('epp_transferencias');
            $table->foreignId('epp_sku_id')->constrained('epp_skus');
            $table->integer('cantidad');
            $table->foreignId('movimiento_salida_id')->nullable()->constrained('movimientos_epp');
            $table->foreignId('movimiento_entrada_id')->nullable()->constrained('movimientos_epp');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('epp_transferencia_detalles');
    }
};
