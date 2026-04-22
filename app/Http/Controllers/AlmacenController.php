<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Almacen;
use Illuminate\Http\RedirectResponse;

class AlmacenController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
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
    public function store(Request $request): RedirectResponse
     {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255|unique:almacenes,nombre',
            'proyecto_id' => 'required|exists:proyectos,id',
            'tipo_almacen' => 'required|in:OPERATIVO,SEGREGACION',
            'compartido' => 'required|boolean',
            'activo' => 'required|boolean',
        ]);

        Almacen::create($validated);

        return back()->with('success', 'Almacén creado exitosamente.');
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
    public function update(Request $request, Almacen $almacen): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255|unique:almacenes,nombre,' . $almacen->id,
            'proyecto_id' => 'required|exists:proyectos,id',
            'tipo_almacen' => 'required|in:general,segregacion',
            'compartido' => 'required|boolean',
            'activo' => 'required|boolean',
        ]);

        $almacen->update($validated);

        return back()->with('success', 'Almacén actualizado exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(almacen $almacen): RedirectResponse
    {
        if ($almacen->stocks()->where('cantidad_actual', '>', 0)->exists()) {
            return back()->with('error', 'No puedes eliminar un almacén que tiene stock.');
        }

        $almacen->delete();

        return back()->with('success', 'Almacén eliminado.');
    }
}
