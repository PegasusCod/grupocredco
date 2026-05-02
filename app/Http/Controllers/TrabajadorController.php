<?php

namespace App\Http\Controllers;

use App\Models\Trabajador;
use App\Models\CargoLaboral;
use App\Models\Proyecto;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TrabajadorController extends Controller
{
    public function index(Request $request)
    {
    $search     = $request->string('search')->toString();
    $proyectoId = $request->input('proyecto_id');
    $estado     = $request->string('estado')->toString();

    $stats = DB::table('trabajadores')->selectRaw("
        COUNT(*)                  AS total,
        SUM(estado = 'ACTIVO')    AS activos,
        SUM(estado = 'CESADO')    AS cesados,
        SUM(foto_url IS NOT NULL) AS con_foto
    ")->first();

    // ✅ Ya no necesitamos $storageBase — Storage::url() resuelve el path solo
    $trabajadores = Trabajador::query()
        ->with('cargoLaboral:id,nombre', 'proyecto:id,nombre')
        ->withCount([
            'entregas as epp_entregados_total' => fn ($q) =>
                $q->where('estado', 'CONFIRMADO'),
        ])
        ->when($search, function ($q) use ($search) {
            $q->leftJoin('cargos_laborales', 'cargos_laborales.id', '=', 'trabajadores.cargo_laboral_id')
              ->where(fn ($inner) =>
                  $inner->where('trabajadores.codigo_fotocheck', 'like', "%{$search}%")
                        ->orWhere('trabajadores.dni',            'like', "%{$search}%")
                        ->orWhere('trabajadores.nombres',        'like', "%{$search}%")
                        ->orWhere('trabajadores.apellidos',      'like', "%{$search}%")
                        ->orWhere('trabajadores.correo',         'like', "%{$search}%")
                        ->orWhere('trabajadores.telefono',       'like', "%{$search}%")
                        ->orWhere('cargos_laborales.nombre',     'like', "%{$search}%")
              )
              ->select('trabajadores.*');
        })
        ->when($proyectoId && $proyectoId !== 'todos', fn ($q) =>
            $q->where('proyecto_id', $proyectoId)
        )
        ->when($estado && $estado !== 'todos', fn ($q) =>
            $q->where('estado', $estado)
        )
        ->orderBy('trabajadores.apellidos')
        ->orderBy('trabajadores.nombres')
        ->paginate(10)
        ->through(fn ($t) => [
            'id'               => $t->id,
            'codigo_fotocheck' => $t->codigo_fotocheck,
            'dni'              => $t->dni,
            'nombres'          => $t->nombres,
            'apellidos'        => $t->apellidos,
            'nombre_completo'  => "{$t->nombres} {$t->apellidos}",
            'correo'           => $t->correo,
            'telefono'         => $t->telefono,
            'cargo_laboral'    => $t->cargoLaboral,
            'cargo_laboral_id' => $t->cargo_laboral_id,
            'proyecto'         => $t->proyecto,
            'proyecto_id'      => $t->proyecto_id,
            'fecha_ingreso'    => $t->fecha_ingreso?->format('Y-m-d'),
            'fecha_cese'       => $t->fecha_cese?->format('Y-m-d'),
            'happy_birthday'   => $t->happy_birthday?->format('Y-m-d'),
            'estado'           => $t->estado,
            // ✅ Storage::url() — igual que el original pero sin llamar asset() N veces
            'foto_url'         => $t->foto_url ? Storage::url($t->foto_url) : null,
            'entregas_count'   => (int) ($t->epp_entregados_total ?? 0),
        ])
        ->withQueryString();

    return Inertia::render('Trabajadores/Index', [
        'trabajadores' => $trabajadores,
        'cargos'       => CargoLaboral::orderBy('nombre')->get(['id', 'nombre']),
        'proyectos'    => Proyecto::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
        'filters'      => [
            'search'      => $search,
            'proyecto_id' => $proyectoId ?: 'todos',
            'estado'      => $estado ?: 'todos',
        ],
        'stats' => [
            'total'    => (int) $stats->total,
            'activos'  => (int) $stats->activos,
            'cesados'  => (int) $stats->cesados,
            'con_foto' => (int) $stats->con_foto,
        ],
    ]);
}

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'codigo_fotocheck' => 'required|string|max:30|unique:trabajadores,codigo_fotocheck',
            'dni'              => 'required|string|max:20|unique:trabajadores,dni',
            'nombres'          => 'required|string|max:100',
            'apellidos'        => 'required|string|max:100',
            'correo'           => 'nullable|email|max:100',
            'telefono'         => 'nullable|string|max:30',
            'cargo_laboral_id' => 'required|exists:cargos_laborales,id',
            'proyecto_id'      => 'required|exists:proyectos,id',
            'happy_birthday'   => 'nullable|date',
            'fecha_ingreso'    => 'required|date',
            'estado'           => 'required|in:ACTIVO,CESADO,SUSPENDIDO',
            'foto'             => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('foto')) {
            $validated['foto_url'] = $request->file('foto')->store('trabajadores', 'public');
        }

        unset($validated['foto']);

        Trabajador::create($validated);

        return back()->with('success', 'Trabajador creado exitosamente.');
    }

    public function show(Trabajador $trabajador)
    {
        $trabajador->load('cargoLaboral', 'proyecto');

        return response()->json([
            'id'               => $trabajador->id,
            'codigo_fotocheck' => $trabajador->codigo_fotocheck,
            'dni'              => $trabajador->dni,
            'nombres'          => $trabajador->nombres,
            'apellidos'        => $trabajador->apellidos,
            'correo'           => $trabajador->correo,
            'telefono'         => $trabajador->telefono,
            'cargo_laboral'    => $trabajador->cargoLaboral,
            'cargo_laboral_id' => $trabajador->cargo_laboral_id,
            'proyecto'         => $trabajador->proyecto,
            'proyecto_id'      => $trabajador->proyecto_id,
            'fecha_ingreso'    => $trabajador->fecha_ingreso?->format('Y-m-d'),
            'fecha_cese'       => $trabajador->fecha_cese?->format('Y-m-d'),
            'happy_birthday'   => $trabajador->happy_birthday?->format('Y-m-d'),
            'estado'           => $trabajador->estado,
            'foto_url'         => $trabajador->foto_url,
        ]);
    }

    public function update(Request $request, Trabajador $trabajador): RedirectResponse
    {
        $validated = $request->validate([
            'codigo_fotocheck' => [
                'required', 'string', 'max:30',
                Rule::unique('trabajadores')->ignore($trabajador->id),
            ],
            'dni' => [
                'required', 'string', 'max:20',
                Rule::unique('trabajadores')->ignore($trabajador->id),
            ],
            'nombres'          => 'required|string|max:100',
            'apellidos'        => 'required|string|max:100',
            'correo'           => 'nullable|email|max:100',
            'telefono'         => 'nullable|string|max:30',
            'cargo_laboral_id' => 'required|exists:cargos_laborales,id',
            'proyecto_id'      => 'required|exists:proyectos,id',
            'fecha_ingreso'    => 'required|date',
            'fecha_cese'       => 'nullable|date',
            'happy_birthday'   => 'nullable|date',
            'estado'           => 'required|in:ACTIVO,CESADO,SUSPENDIDO',
            'foto'             => 'nullable|image|max:2048',
        ]);
 
        if ($request->hasFile('foto')) {
            if ($trabajador->foto_url) {
                Storage::disk('public')->delete($trabajador->foto_url);
            }
            $validated['foto_url'] = $request->file('foto')->store('trabajadores', 'public');
        }
 
        unset($validated['foto']);
        $trabajador->update($validated);
 
        return back()->with('success', 'Trabajador actualizado exitosamente.');
    }

    public function destroy(Trabajador $trabajador): RedirectResponse
    {
        if ($trabajador->custodias()->where('estado', 'ACTIVO')->exists()) {
            return back()->with('error', 'El trabajador tiene EPP en custodia activa. No se puede eliminar.');
        }

        if ($trabajador->foto_url) {
            Storage::disk('public')->delete($trabajador->foto_url);
        }

        $trabajador->delete();

        return back()->with('success', 'Trabajador eliminado exitosamente.');
    }
}
