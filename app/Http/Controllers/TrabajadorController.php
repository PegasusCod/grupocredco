<?php

namespace App\Http\Controllers;

use App\Models\Trabajador;
use App\Models\Cargo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TrabajadorController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->string('search')->toString();
        $area = $request->string('area')->toString();
        $estado = $request->string('estado')->toString();

        $trabajadores = Trabajador::query()
            ->with('cargo:id,nombre')
            ->withSum('entregaDetalles as epp_entregados_total', 'cantidad')
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('codigo_fotocheck', 'like', "%{$search}%")
                        ->orWhere('dni', 'like', "%{$search}%")
                        ->orWhere('nombres', 'like', "%{$search}%")
                        ->orWhere('apellidos', 'like', "%{$search}%")
                        ->orWhere('correo', 'like', "%{$search}%")
                        ->orWhere('telefono', 'like', "%{$search}%")
                        ->orWhere('area', 'like', "%{$search}%")
                        ->orWhereHas('cargo', function ($cargoQuery) use ($search) {
                            $cargoQuery->where('nombre', 'like', "%{$search}%");
                        });
                });
            })
            ->when($area && $area !== 'todos', function ($query) use ($area) {
                $query->where('area', $area);
            })
            ->when($estado && $estado !== 'todos', function ($query) use ($estado) {
                $query->where('estado', $estado);
            })
            ->orderBy('apellidos')
            ->orderBy('nombres')
            ->paginate(10)
            ->through(function ($trabajador) {
                return [
                    'id' => $trabajador->id,
                    'codigo_fotocheck' => $trabajador->codigo_fotocheck,
                    'dni' => $trabajador->dni,
                    'nombres' => $trabajador->nombres,
                    'apellidos' => $trabajador->apellidos,
                    'correo' => $trabajador->correo,
                    'telefono' => $trabajador->telefono,
                    'cargo' => $trabajador->cargo,
                    'cargo_id' => $trabajador->cargo_id,
                    'fecha_ingreso' => $trabajador->fecha_ingreso
                        ? \Carbon\Carbon::parse($trabajador->fecha_ingreso)->format('Y-m-d')
                        : null,
                    'area' => $trabajador->area,
                    'estado' => $trabajador->estado,
                    'foto_url' => $trabajador->foto_url,
                    'entregas_count' => (int) ($trabajador->epp_entregados_total ?? 0),
                ];
            })
            ->withQueryString();

        return Inertia::render('Trabajadores/Index', [
            'trabajadores' => $trabajadores,
            'cargos' => Cargo::orderBy('nombre')->get(['id', 'nombre']),
            'filters' => [
                'search' => $search,
                'area' => $area ?: 'todos',
                'estado' => $estado ?: 'todos',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'codigo_fotocheck' => 'required|unique:trabajadores,codigo_fotocheck',
            'dni' => 'required|unique:trabajadores,dni',
            'nombres' => 'required|string',
            'apellidos' => 'required|string',
            'correo' => 'nullable|email',
            'telefono' => 'nullable|string',
            'cargo_id' => 'required|exists:cargos,id',
            'fecha_ingreso' => 'required|date',
            'area' => 'required|string',
            'estado' => 'required|in:activo,inactivo',
            'foto' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('foto')) {
            $validated['foto'] = $request->file('foto')->store('trabajadores', 'public');
        }

        Trabajador::create($validated);

        return redirect()
            ->route('trabajadores.index')
            ->with('success', 'Trabajador creado exitosamente');
    }

    public function show(string $id)
    {
        $trabajador = Trabajador::with('cargo')->find($id);

        if (!$trabajador) {
            return response()->json(['message' => 'Trabajador no encontrado'], 404);
        }

        return response()->json([
            'id' => $trabajador->id,
            'codigo_fotocheck' => $trabajador->codigo_fotocheck,
            'dni' => $trabajador->dni,
            'nombres' => $trabajador->nombres,
            'apellidos' => $trabajador->apellidos,
            'correo' => $trabajador->correo,
            'telefono' => $trabajador->telefono,
            'cargo' => $trabajador->cargo,
            'cargo_id' => $trabajador->cargo_id,
            'fecha_ingreso' => $trabajador->fecha_ingreso
                ? \Carbon\Carbon::parse($trabajador->fecha_ingreso)->format('Y-m-d')
                : null,
            'area' => $trabajador->area,
            'estado' => $trabajador->estado,
            'foto_url' => $trabajador->foto_url,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $trabajador = Trabajador::findOrFail($id);

        $validated = $request->validate([
            'codigo_fotocheck' => 'required|unique:trabajadores,codigo_fotocheck,' . $trabajador->id,
            'dni' => 'required|unique:trabajadores,dni,' . $trabajador->id,
            'nombres' => 'required|string',
            'apellidos' => 'required|string',
            'correo' => 'nullable|email',
            'telefono' => 'nullable|string',
            'cargo_id' => 'required|exists:cargos,id',
            'fecha_ingreso' => 'required|date',
            'area' => 'required|string',
            'estado' => 'required|in:activo,inactivo',
            'foto' => 'nullable|image|max:2048',
        ]);

        // Solo lo validado
        $data = $validated;

        // Si viene foto nueva, borrar anterior y guardar nueva
        if ($request->hasFile('foto')) {
            if ($trabajador->foto) {
                Storage::disk('public')->delete($trabajador->foto);
            }
            $data['foto'] = $request->file('foto')->store('trabajadores', 'public');
        }

        $trabajador->update($data);

        return redirect()
            ->route('trabajadores.index')
            ->with('success', 'Trabajador actualizado exitosamente');
    }

    public function destroy(string $id)
    {
        $trabajador = Trabajador::findOrFail($id);

        if ($trabajador->foto) {
            Storage::disk('public')->delete($trabajador->foto);
        }

        $trabajador->delete();

        // Inertia lo maneja mejor que JSON
        return redirect()
            ->route('trabajadores.index')
            ->with('success', 'Trabajador eliminado exitosamente');
    }
}
