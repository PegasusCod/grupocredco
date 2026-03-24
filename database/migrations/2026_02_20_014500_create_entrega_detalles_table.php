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
        Schema::create('entrega_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrega_id')->constrained('entregas')->onDelete('cascade');
            /* referenciamos a la talla especifica que se entrego */
            $table->foreignId('epp_talla_id')->constrained('epp_inventario_tallas');
            $table->integer('cantidad')->default(1);
            $table->string('motivo', 30);//nuevo, desgaste,etc
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('entrega_detalles');
    }
};
