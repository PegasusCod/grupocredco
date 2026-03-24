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
        Schema::create('epp_inventario_tallas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('epp_item_id')->constrained('epp_items')->onDelete('cascade');
            $table->string('talla', 20);
            $table->integer('stock_actual')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('epp_inventario_tallas');
    }
};
