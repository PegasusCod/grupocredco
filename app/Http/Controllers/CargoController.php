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
            'nombre' => 'required|string|max:255|unique:cargo_laboral,nombre',
        ]);
        $cargo = CargoLaboral::create($validated);

        return redirect()
        ->route('trabajadores.index')
        ->with('success', 'Cargo laboral creado exitosamente.');
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
            'nombre' => 'required|string|max:255|unique:cargo_laboral,nombre,' . $cargo->id,
        ]);
        
        $cargo->update($validated);

        return back()->with('success', 'Cargo laboral actualizado exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CargoLaboral $cargo): RedirectResponse
    {
        if ($cargo->trabajadores()->exists()) {
            return back()->with('error', 'No se puede eliminar el cargo laboral porque está asociado a trabajadores.');
        }

        $cargo->delete();

        return back()->with('success', 'Cargo laboral eliminado exitosamente.');
    }
}
