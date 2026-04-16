<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Auth\Events\Login;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Auth;
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
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Auth/Login', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

/* cambianr la ruta de welcome a login */
/* Route::get('/', function () {
    return Auth::check()
    ?redirect() -> route('dashboard')
    :redirect() -> route('login');
}); */

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

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
});

require __DIR__.'/auth.php';
