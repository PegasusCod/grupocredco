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
        Schema::create('disposicion_final_epp', function (Blueprint $table) {
            $table->id();
            $table->dateTime('fecha_baja');
            $table->foreignId('almacen_origen_id')->constrained('almacenes');
            $table->string('motivo', 255);
            $table->string('acta_numero', 50)->nullable();
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
        Schema::dropIfExists('disposicion_final_epp');
    }
};
