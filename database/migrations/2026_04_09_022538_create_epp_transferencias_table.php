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
        Schema::create('epp_transferencias', function (Blueprint $table) {
            $table->id();
            $table->dateTime('fecha_transferencia');
            $table->foreignId('almacen_origen_id')->constrained('almacenes');
            $table->foreignId('almacen_destino_id')->constrained('almacenes');
            $table->string('motivo', 255)->nullable();
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
        Schema::dropIfExists('epp_transferencias');
    }
};
