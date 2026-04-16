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
        Schema::create('incidencias_epp', function (Blueprint $table) {
            $table->id();
            $table->dateTime('fecha_incidencia');
            $table->foreignId('trabajador_id')->constrained('trabajadores');
            $table->foreignId('proyecto_id')->constrained('proyectos');
            $table->foreignId('custodia_id')->nullable()->constrained('trabajador_epp_custodia');
            $table->foreignId('epp_sku_id')->constrained('epp_skus');
            $table->enum('tipo_incidencia', [
                'PERDIDA',
                'EXTRAVIO',
                'ROBO',
                'NO_DEVOLUCION',
                'OTRO'
            ]);
            $table->integer('cantidad')->default(1);
            $table->boolean('genera_reposicion')->default(true);
            $table->text('descripcion')->nullable();
            $table->enum('estado', ['REGISTRADA', 'ATENDIDA', 'CERRADA'])->default('REGISTRADA');
            $table->foreignId('user_id')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incidencias_epp');
    }
};
