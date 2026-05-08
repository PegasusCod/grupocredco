<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Proyecto;
use Illuminate\Http\RedirectResponse;

class ProyectoController extends Controller
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
            'nombre' => 'required|string|max:255|unique:proyectos,nombre',
            'activo' => 'required|boolean',
        ]);

        Proyecto::create($validated);

        return back()->with('success', 'Proyecto creado exitosamente.');
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
    public function update(Request $request, Proyecto $proyecto): RedirectResponse
     {
        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:150',
                'unique:proyectos,nombre,' . $proyecto->id,
            ],
            'activo' => ['boolean'],
        ]);
 
        $proyecto->update($validated);
 
        return back()->with('success', 'Proyecto actualizado correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Proyecto $proyecto): RedirectResponse
     {
        if ($proyecto->trabajadores()->exists()) {
            return back()->with(
                'error',
                'No se puede eliminar: el proyecto tiene trabajadores asignados.'
            );
        }
 
        if ($proyecto->almacenes()->exists()) {
            return redirect()->back()->with(
                'error',
                'No se puede eliminar: el proyecto tiene almacenes asignados.'
            );
        }
 
        $proyecto->delete();
 
        return back()->with('success', 'Proyecto eliminado correctamente.');
    }
}
