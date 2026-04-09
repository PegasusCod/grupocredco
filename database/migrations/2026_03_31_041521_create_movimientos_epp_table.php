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
        Schema::create('movimientos_epp', function (Blueprint $table) {
            $table->id();
            $table->enum('tipo_movimiento', ['ingreso', 'egreso']);
            $table->foreignId("proyecto_id")->constrained("proyectos")->cascadeOnDelete();
            $table->foreignId("ubicacion_id")->constrained("ubicaciones")->cascadeOnDelete();
            $table->foreignId('trabajador_id')->constrained('trabajadores')->cascadeOnDelete();
            $table->foreignId('epp_inventario_talla_id')->constrained('epp_inventario_tallas')->cascadeOnDelete();
            $table->string('talla', 20);
            $table->integer('cantidad');
            $table->string('referencia', 255)->nullable();
            $table->string('requerimiento', 255)->nullable();
            $table->string('motivo', 255)->nullable();
            $table->boolean('devolvio_epp');
            $table->text('observaciones')->nullable();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movimientos_epp');
    }
};
