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
        Schema::create('epp_skus', function (Blueprint $table) {
            $table->id();
             $table->foreignId('epp_item_id')->constrained('epp_items');
            $table->foreignId('talla_id')->constrained('tallas');
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->unique(['epp_item_id', 'talla_id'], 'uq_epp_sku_item_talla');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('epp_skus');
    }
};
