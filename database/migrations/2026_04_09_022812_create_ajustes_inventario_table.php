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
        Schema::create('ajustes_inventario', function (Blueprint $table) {
            $table->id();
            $table->dateTime('fecha_ajuste');
            $table->foreignId('almacen_id')->constrained('almacenes');
            $table->enum('tipo_ajuste', ['POSITIVO', 'NEGATIVO']);
            $table->string('motivo', 255);
            $table->text('observaciones')->nullable();
            $table->enum('estado', ['BORRADOR', 'CONFIRMADO', 'ANULADO'])->default('BORRADOR');
            $table->foreignId('user_id')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ajustes_inventario');
    }
};
