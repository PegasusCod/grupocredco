<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Auth\Events\Login;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\EppController;
use App\Http\Controllers\TrabajadorController;
use App\Http\Controllers\CargoController;
use App\Http\Controllers\EntregaController;
use App\Http\Controllers\InventarioController;
use Inertia\Inertia;

/* Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});+ */

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

Route::middleware('auth', 'verified')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    /* Route::get('/epp', [EppController::class, 'index'])->name('epp.index');
    Route::post('/epp', [EppController::class, 'store'])->name('epp.store');

    Route::get('/epp/{epp}', [EppController::class, 'update'])->name('epp.update');
    Route::delete('/epp/{epp}', [EppController::class, 'destroy'])->name('epp.destroy'); */
    Route::resource('epp', EppController::class)->only(['index', 'store', 'update', 'destroy']);

    Route::prefix('trabajadores')->group(function () {
        Route::get('/', [TrabajadorController::class, 'index'])->name('trabajadores.index');
        Route::post('/', [TrabajadorController::class, 'store'])->name('trabajadores.store');
        Route::get('/{id}', [TrabajadorController::class, 'show'])->name('trabajadores.show');
        Route::put('/{id}', [TrabajadorController::class, 'update'])->name('trabajadores.update');
        Route::delete('/{id}', [TrabajadorController::class, 'destroy'])->name('trabajadores.destroy');
    });

    /* Route::get('/cargos', [CargoController::class, 'index']); */ 

    Route::post('/cargos/quick-store', [CargoController::class, 'storeQuick'])->name('cargos.quick-store');


    Route::get('/entregas', [EntregaController::class, 'index'])->name('entregas.index');
    Route::post('/entregas', [EntregaController::class, 'store'])->name('entregas.store');

    Route::get('/inventario', [InventarioController::class, 'index'])->name('inventario.index');
    Route::post('/inventario/ingresos', [InventarioController::class, 'store'])->name('inventario.ingresos.store');
});

require __DIR__.'/auth.php';
