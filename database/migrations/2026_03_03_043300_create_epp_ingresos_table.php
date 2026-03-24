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
        Schema::create('epp_ingresos', function (Blueprint $table) {
            $table->id();
            $table->string('numero_lote', 100)->unique();
            $table->date('fecha_ingreso');
            $table->string('proveedor', 255);
            $table->foreignId('user_id')->contrained('users')->casecadeOnDelete();
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('epp_ingresos');
    }
};
