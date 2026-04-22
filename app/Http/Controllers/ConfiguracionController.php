<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
use App\Models\CargoLaboral;
use App\Models\Proyecto;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConfiguracionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('Configuracion/Index', [
            'cargos'    => CargoLaboral::orderBy('nombre')->get(['id', 'nombre']),
            'proyectos' => Proyecto::orderBy('nombre')->get(['id', 'nombre', 'activo']),
            'almacenes' => Almacen::with('proyecto:id,nombre')
                            ->orderBy('nombre')
                            ->get(['id', 'nombre', 'proyecto_id', 'tipo_almacen', 'compartido', 'activo']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
