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
        Schema::table('epp_entrega_detalles', function (Blueprint $table) {
            $table->foreign('custodia_afectada_id', 'fk_entrega_custodia')
                ->references('id')
                ->on('trabajador_epp_custodia');

            $table->foreign('incidencia_id', 'fk_entrega_incidencia')
                ->references('id')
                ->on('incidencias_epp');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('epp_entrega_detalles', function (Blueprint $table) {
            $table->dropForeign('fk_entrega_custodia');
            $table->dropForeign('fk_entrega_incidencia');
        });
    }
};
