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
        Schema::create('movimientos_epp', function (Blueprint $table) {
            $table->id();$table->dateTime('fecha_movimiento');
            $table->foreignId('almacen_id')->constrained('almacenes');
            $table->foreignId('almacen_contraparte_id')->nullable()->constrained('almacenes');
            $table->foreignId('proyecto_id')->nullable()->constrained('proyectos');
            $table->foreignId('trabajador_id')->nullable()->constrained('trabajadores');
            $table->foreignId('epp_sku_id')->constrained('epp_skus');
            $table->foreignId('tipo_movimiento_id')->constrained('movimiento_tipos');
            $table->enum('naturaleza', ['ENTRADA', 'SALIDA']);
            $table->enum('estado_stock', ['DISPONIBLE', 'DANADO', 'BAJA'])->default('DISPONIBLE');
            $table->integer('cantidad');
            $table->integer('saldo_anterior')->default(0);
            $table->integer('saldo_nuevo')->default(0);
            $table->string('documento_tipo', 50)->nullable();
            $table->unsignedBigInteger('documento_id')->nullable();
            $table->string('referencia', 255)->nullable();
            $table->text('observaciones')->nullable();
            $table->enum('estado_registro', ['CONFIRMADO', 'ANULADO'])->default('CONFIRMADO');
            $table->foreignId('user_id')->constrained('users');
            $table->timestamps();

            $table->index(['almacen_id', 'epp_sku_id', 'fecha_movimiento'], 'idx_mov_kardex_1');
            $table->index(['trabajador_id', 'fecha_movimiento'], 'idx_mov_kardex_2');
            $table->index(['tipo_movimiento_id', 'fecha_movimiento'], 'idx_mov_kardex_3');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movimientos_epp');
    }
};
