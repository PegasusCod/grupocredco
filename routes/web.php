<?php

use Illuminate\Auth\Events\Login;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CargoController;
use App\Http\Controllers\CustodiaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EntregaController;
use App\Http\Controllers\EppController;
use App\Http\Controllers\EppTransferenciaController;
use App\Http\Controllers\InventarioController;
use App\Http\Controllers\MovimientoEppController;
use App\Http\Controllers\SegregacionController;
use App\Http\Controllers\TrabajadorController;
use App\Http\Controllers\ConfiguracionController;
use App\Http\Controllers\ProyectoController;
use App\Http\Controllers\AlmacenController;
use App\Models\Proyecto;
use Illuminate\Support\Facades\Route;

// ── Ruta raíz: redirige según autenticación ───────────────────────────────────
Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
});

// ── Rutas protegidas ──────────────────────────────────────────────────────────
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Perfil (Breeze)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Trabajadores
    Route::resource('trabajadores', TrabajadorController::class);

    // Cargos
    Route::get('cargos', [CargoController::class, 'index'])->name('cargos.index');
    Route::post('cargos/quick', [CargoController::class, 'storeQuick'])->name('cargos.storeQuick');
    Route::put('cargos/{cargo}', [CargoController::class, 'update'])->name('cargos.update');
    Route::delete('cargos/{cargo}', [CargoController::class, 'destroy'])->name('cargos.destroy');

    // Custodia
    Route::get('custodia', [CustodiaController::class, 'index'])->name('custodia.index');
    Route::post('custodia/{custodia}/devolver', [CustodiaController::class, 'devolver'])->name('custodia.devolver');

    // EPP Disponibles
    Route::resource('epp', EppController::class)->except(['create', 'edit', 'show']);

    // Ingresos de EPP
    Route::get('inventario', [InventarioController::class, 'index'])->name('inventario.index');
    Route::post('inventario', [InventarioController::class, 'store'])->name('inventario.store');

    // Entregas
    Route::get('entregas', [EntregaController::class, 'index'])->name('entregas.index');
    Route::post('entregas', [EntregaController::class, 'store'])->name('entregas.store');
    Route::get('entregas/{entrega}', [EntregaController::class, 'show'])->name('entregas.show');

    // Transferencias
    Route::get('transferencias', [EppTransferenciaController::class, 'index'])->name('transferencias.index');
    Route::post('transferencias', [EppTransferenciaController::class, 'store'])->name('transferencias.store');
    Route::patch('transferencias/{transferencia}/anular', [EppTransferenciaController::class, 'anular'])->name('transferencias.anular');

    // Kardex
    Route::get('kardex', [MovimientoEppController::class, 'index'])->name('kardex.index');

    // Segregación / Baja
    Route::get('segregacion', [SegregacionController::class, 'index'])->name('segregacion.index');
    Route::post('segregacion/dar-baja', [SegregacionController::class, 'darBaja'])->name('segregacion.darBaja');

    /* Tablas maestras como cargo, proyecto,almacenes */
    Route::get('configuracion', [ConfiguracionController::class, 'index'])->name('configuracion.index');

    /* Proyectos (CRUDCOMPLETO) */
    Route::resource('proyectos', ProyectoController::class)->except(['index', 'create', 'edit', 'show']);

    /* CRUD de almacenes */

    // Almacenes (CRUD completo)
    Route::resource('almacenes', AlmacenController::class)->except(['create', 'edit', 'show']);


});

require __DIR__.'/auth.php';