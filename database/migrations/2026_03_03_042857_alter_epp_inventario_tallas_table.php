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
        Schema::table('epp_inventario_tallas', function (Blueprint $table) {
            $table->unique(['epp_item_id', 'talla'], 'epp_item_id_talla_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('epp_inventario_tallas', function (Blueprint $table) {
            $table->dropUnique('epp_item_id_talla_unique');
        });
    }
};
