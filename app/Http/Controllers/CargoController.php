<?php

namespace App\Http\Controllers;

use App\Models\CargoLaboral;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CargoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(CargoLaboral::orderBy('nombre')->get(['id', 'nombre']));
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
    public function storeQuick(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255|unique:cargos_laborales,nombre',
        ]);
        $cargo = CargoLaboral::create($validated);

        return back()->with('success', 'Cargo creado correctamente.');
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
    public function update(Request $request, CargoLaboral $cargo): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                'unique:cargos_laborales,nombre,' . $cargo->id,
            ],
        ]);
 
        $cargo->update($validated);
 
        return back()->with('success', 'Cargo actualizado correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CargoLaboral $cargo): RedirectResponse
    {
        if ($cargo->trabajadores()->exists()) {
            return redirect()->back()->with(
                'error',
                'No se puede eliminar: el cargo tiene trabajadores asignados.'
            );
        }
 
        $cargo->delete();
 
        return back()->with('success', 'Cargo eliminado correctamente.');
    }
}
