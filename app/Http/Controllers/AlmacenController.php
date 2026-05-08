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
            'nombre'       => ['required', 'string', 'max:150'],
            'tipo_almacen' => ['required', 'in:OPERATIVO,SEGREGACION'],
            // ✅ proyecto_id solo es requerido si es OPERATIVO
            'proyecto_id'  => [
                'nullable',
                'required_if:tipo_almacen,OPERATIVO',
                'exists:proyectos,id',
            ],
            'compartido'   => ['boolean'],
            'activo'       => ['boolean'],
        ]);
 
        // ✅ Si es SEGREGACION, forzamos proyecto_id a null
        if ($validated['tipo_almacen'] === 'SEGREGACION') {
            $validated['proyecto_id'] = null;
        }
 
        Almacen::create($validated);
 
        return back()->with('success', 'Almacén creado correctamente.');
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
            'nombre'       => ['required', 'string', 'max:150'],
            'tipo_almacen' => ['required', 'in:OPERATIVO,SEGREGACION'],
            'proyecto_id'  => [
                'nullable',
                'required_if:tipo_almacen,OPERATIVO',
                'exists:proyectos,id',
            ],
            'compartido'   => ['boolean'],
            'activo'       => ['boolean'],
        ]);
 
        if ($validated['tipo_almacen'] === 'SEGREGACION') {
            $validated['proyecto_id'] = null;
        }
 
        $almacen->update($validated);
 
        return back()->with('success', 'Almacén actualizado correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(almacen $almacen): RedirectResponse
    {
        // Verificar si tiene stock antes de eliminar
        if ($almacen->stocks()->exists()) {
            return redirect()->back()->with(
                'error',
                'No se puede eliminar: el almacén tiene stock registrado.'
            );
        }
 
        $almacen->delete();
 
        return back()->with('success', 'Almacén eliminado correctamente.');
    }
}
