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
        Schema::create('epp_items', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 160);
            $table->string('marca', 60)->nullable();
            $table->string('categoria', 60)->nullable();
            $table->string('unidad_medida', 20)->default('unid.');
            $table->integer('stock_total')->default(10);
            $table->integer('stock_minimo')->default(10);
            $table->string('imagen_url')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('epp_items');
    }
};
