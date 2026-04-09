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
        Schema::create('epp_ingreso_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingreso_id')->constrained('epp_ingresos');
            $table->foreignId('epp_sku_id')->constrained('epp_skus');
            $table->integer('cantidad');
            $table->foreignId('movimiento_entrada_id')->nullable()->constrained('movimientos_epp');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('epp_ingreso_detalles');
    }
};
