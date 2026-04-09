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
        Schema::create('disposicion_final_epp_detalles', function (Blueprint $table) {
            $table->id();
             $table->foreignId('baja_id')->constrained('disposicion_final_epp');
            $table->foreignId('epp_sku_id')->constrained('epp_skus');
            $table->integer('cantidad');
            $table->foreignId('movimiento_salida_id')->nullable()->constrained('movimientos_epp');
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('disposicion_final_epp_detalles');
    }
};
