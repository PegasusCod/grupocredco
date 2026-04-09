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
        Schema::create('trabajador_epp_custodia', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trabajador_id')->constrained('trabajadores');
            $table->foreignId('entrega_detalle_id')->unique()->constrained('epp_entrega_detalles');
            $table->foreignId('epp_sku_id')->constrained('epp_skus');
            $table->integer('cantidad_entregada');
            $table->integer('cantidad_devuelta')->default(0);
            $table->integer('cantidad_perdida')->default(0);
            $table->enum('estado', [
                'ACTIVO',
                'DEVUELTO_DANADO',
                'PERDIDO',
                'EXTRAVIADO',
                'CERRADO'
            ])->default('ACTIVO');
            $table->dateTime('fecha_entrega');
            $table->dateTime('fecha_cierre')->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trabajador_epp_custodia');
    }
};
