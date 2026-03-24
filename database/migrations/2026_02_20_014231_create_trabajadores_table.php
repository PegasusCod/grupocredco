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
        Schema::create('trabajadores', function (Blueprint $table) {
            $table->id();
            $table->string('codigo_fotocheck', 30)->unique();
            $table->string('dni', 20)->unique();
            $table->string('nombres', 60);
            $table->string('apellidos', 60);
            $table->string('correo', 100)->unique();
            $table->string('telefono', 20)->nullable();
            $table->foreignId('cargo_id')->constrained('cargos');
            $table->date('fecha_ingreso');
            $table->string('area', 60)->nullable();//proyectos o relavera
            $table->string('estado', 20)->default('ACTIVO');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trabajadores');
    }
};
