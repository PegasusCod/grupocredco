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
        Schema::create('epp_entrega_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrega_id')->constrained('epp_entregas');
            $table->foreignId('epp_sku_id')->constrained('epp_skus');
            $table->integer('cantidad');
            $table->enum('motivo_entrega', [
                'INICIAL',
                'REPOSICION_DESGASTE',
                'REPOSICION_PERDIDA'
            ])->default('INICIAL');

            $table->unsignedBigInteger('custodia_afectada_id')->nullable();
            $table->unsignedBigInteger('incidencia_id')->nullable();

            $table->foreignId('movimiento_salida_id')->nullable()->constrained('movimientos_epp');
            $table->foreignId('movimiento_entrada_seg_id')->nullable()->constrained('movimientos_epp');

            $table->text('observaciones')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('epp_entrega_detalles');
    }
};
