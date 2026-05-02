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
            $table->foreignId('proyecto_id')->constrained('proyectos');
            $table->foreignId('cargo_laboral_id')->nullable()->constrained('cargos_laborales');
            $table->string('codigo_fotocheck', 30)->nullable()->unique();
            $table->string('dni', 20)->unique();
            $table->string('nombres', 100);
            $table->string('apellidos', 100);
            $table->string('correo', 100)->nullable();
            $table->string('telefono', 30)->nullable();
            $table->date('happy_birthday')->nullable();
            $table->date('fecha_ingreso')->nullable();
            $table->date('fecha_cese')->nullable();
            $table->enum('estado', ['ACTIVO', 'CESADO', 'SUSPENDIDO'])->default('ACTIVO');
            $table->string('foto_url', 255)->nullable();
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
