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
        Schema::create('epp_ingreso_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('epp_ingreso_id')->constrained('epp_ingresos')->cascadeOnDelete();
            $table->foreignId('epp_item_id')->constrained('epp_items')->cascadeOnDelete();
            $table->string('talla', 20)->nullable();
            $table->unsignedInteger('cantidad');
            $table->unsignedInteger('stock_anterior_item');
            $table->unsignedInteger('stock_nuevo_item');
            $table->unsignedInteger('stock_anterior_talla')->nullable();
            $table->unsignedInteger('stock_nuevo_talla')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('epp_ingresos_detalles');
    }
};
