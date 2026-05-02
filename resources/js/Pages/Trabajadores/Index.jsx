import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import {
    Search, Plus, Edit, Trash2, Users, UserCheck, UserX,
    ImageIcon, AlertTriangle, Eye, Briefcase, Mail, Phone,
    CalendarDays, BadgeCheck, X, CheckCircle2, Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ESTADO_CONFIG = {
    ACTIVO:     { label: "Activo",     cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    CESADO:     { label: "Cesado",     cls: "bg-slate-100   text-slate-600   border-slate-200"   },
    SUSPENDIDO: { label: "Suspendido", cls: "bg-amber-100   text-amber-700   border-amber-200"   },
};

const formatDate = (d) => {
    if (!d) return "—";
    const [y, m, day] = String(d).slice(0, 10).split("-");
    return `${day}/${m}/${y}`;
};

const getInitials = (t) =>
    `${t?.nombres?.[0] ?? ""}${t?.apellidos?.[0] ?? ""}`.toUpperCase() || "?";

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ src, trabajador, size = "md" }) {
    const sizes = { sm: "h-9 w-9 text-xs", md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-lg" };
    const cls = sizes[size] ?? sizes.md;
    return src ? (
        <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            className={`${cls} rounded-full object-cover ring-2 ring-white shadow-sm`}
        />
    ) : (
        <div className={`${cls} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-sm`}>
            {getInitials(trabajador)}
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function TrabajadoresIndex({
    trabajadores = { data: [], links: [], total: 0, current_page: 1, last_page: 1, from: null, to: null },
    cargos       = [],
    proyectos    = [],
    filters      = {},
    // FIX: stats viene del servidor (una sola query SQL), no del frontend
    // Antes: se calculaba con .filter() sobre los 10 registros de la página actual
    // → números incorrectos. Ahora refleja el total real de la BD.
    stats: serverStats = { total: 0, activos: 0, cesados: 0, con_foto: 0 },
}) {
    const { flash = {} } = usePage().props;

    // ── Búsqueda con debounce ─────────────────────────────────────────────────
    // searchInput: lo que ve el usuario en el input (actualización inmediata)
    // searchTerm: dispara el request al servidor (300ms después de dejar de escribir)
    const [searchInput, setSearchInput]         = useState(filters.search || "");
    const [selectedProyecto, setSelectedProyecto] = useState(filters.proyecto_id || "todos");
    const [selectedEstado, setSelectedEstado]     = useState(filters.estado || "todos");

    const [showModal, setShowModal]             = useState(false);
    const [showCargoModal, setShowCargoModal]   = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [isEditing, setIsEditing]             = useState(false);
    const [editingTrabajador, setEditingTrabajador] = useState(null);
    const [previewUrl, setPreviewUrl]           = useState(null);
    const [detailTrabajador, setDetailTrabajador] = useState(null);

    const trabajadoresData = trabajadores?.data || [];

    const canCreate = useMemo(
        () => cargos.length > 0 && proyectos.length > 0,
        [cargos.length, proyectos.length]
    );

    // ── Debounce: auto-búsqueda 400ms tras el último keystroke ────────────────
    // Antes: solo se buscaba al presionar Enter o el botón "Buscar".
    // Ahora: búsqueda automática mientras se escribe, sin golpear el servidor
    // en cada tecla.
    useEffect(() => {
        const timer = setTimeout(() => {
            // Solo dispara si el valor cambió respecto al filtro activo
            if (searchInput !== (filters.search || "")) {
                applyFilters({ search: searchInput });
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // ── Formulario trabajador ─────────────────────────────────────────────────

    const emptyForm = {
        codigo_fotocheck: "",
        nombres: "", apellidos: "", dni: "",
        telefono: "", correo: "",
        cargo_laboral_id: "", proyecto_id: "",
        fecha_ingreso: "", fecha_cese: "", happy_birthday: "",
        estado: "ACTIVO",
        foto: null,
    };

    const { data, setData, post, processing, errors, reset } = useForm(emptyForm);

    const resetForm = useCallback(() => {
        reset(); setPreviewUrl(null); setIsEditing(false); setEditingTrabajador(null);
    }, [reset]);

    const closeModal = useCallback(() => {
        setShowModal(false); resetForm();
    }, [resetForm]);

    const openCreate = useCallback(() => {
        resetForm(); setShowModal(true);
    }, [resetForm]);

    const openEdit = useCallback((t) => {
        setEditingTrabajador(t);
        setIsEditing(true);
        setData({
            codigo_fotocheck: t.codigo_fotocheck ?? "",
            nombres:          t.nombres          ?? "",
            apellidos:        t.apellidos         ?? "",
            dni:              t.dni               ?? "",
            telefono:         t.telefono          ?? "",
            correo:           t.correo            ?? "",
            cargo_laboral_id: t.cargo_laboral_id  ? String(t.cargo_laboral_id) : "",
            proyecto_id:      t.proyecto_id       ? String(t.proyecto_id)       : "",
            fecha_ingreso:    t.fecha_ingreso      ? String(t.fecha_ingreso).slice(0, 10)  : "",
            fecha_cese:       t.fecha_cese         ? String(t.fecha_cese).slice(0, 10)     : "",
            happy_birthday:   t.happy_birthday     ? String(t.happy_birthday).slice(0, 10) : "",
            estado:           t.estado             ?? "ACTIVO",
            foto:             null,
        });
        setPreviewUrl(t.foto_url ?? null);
        setShowModal(true);
    }, [setData]);

    const openDetail  = useCallback((t) => { setDetailTrabajador(t); setShowDetailModal(true); }, []);
    const closeDetail = useCallback(() => { setDetailTrabajador(null); setShowDetailModal(false); }, []);

    // ── FIX PRINCIPAL: submit usa ruta POST dedicada ──────────────────────────
    // Problema anterior: router.post con _method:'PUT' + forceFormData:true
    // (multipart/form-data) no dispara el route model binding correctamente en
    // ciertas configs de Laravel/Inertia → $trabajador->id llega null →
    // ignore(null) no excluye el registro propio → "already been taken".
    //
    // Solución: ruta POST pura sin method spoofing.
    // Agregar en web.php (ANTES del resource):
    //   Route::post('trabajadores/{trabajador}/update', [TrabajadorController::class, 'update'])
    //       ->name('trabajadores.update.post');
    const submitTrabajador = useCallback((e) => {
        e.preventDefault();

        if (isEditing && editingTrabajador) {
            // POST puro a la ruta dedicada — sin _method, sin spoofing
            router.post(
                route("trabajadores.update.post", editingTrabajador.id),
                {
                    codigo_fotocheck: data.codigo_fotocheck,
                    nombres:          data.nombres,
                    apellidos:        data.apellidos,
                    dni:              data.dni,
                    telefono:         data.telefono  || null,
                    correo:           data.correo    || null,
                    cargo_laboral_id: data.cargo_laboral_id,
                    proyecto_id:      data.proyecto_id,
                    fecha_ingreso:    data.fecha_ingreso,
                    fecha_cese:       data.fecha_cese    || null,
                    happy_birthday:   data.happy_birthday || null,
                    estado:           data.estado,
                    ...(data.foto instanceof File ? { foto: data.foto } : {}),
                },
                {
                    forceFormData: true,
                    preserveScroll: true,
                    onSuccess: closeModal,
                    onError: (errs) => console.error("Errores validación:", errs),
                }
            );
        } else {
            post(route("trabajadores.store"), {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: closeModal,
            });
        }
    }, [isEditing, editingTrabajador, data, post, closeModal]);

    const handleDelete = useCallback((t) => {
        if (!confirm(`¿Eliminar a ${t.nombres} ${t.apellidos}?`)) return;
        router.delete(route("trabajadores.destroy", t.id), { preserveScroll: true });
    }, []);

    const handleFotoChange = (e) => {
        const file = e.target.files?.[0] || null;
        setData("foto", file);
        if (file) setPreviewUrl(URL.createObjectURL(file));
    };

    // ── Formulario cargo rápido ───────────────────────────────────────────────

    const {
        data: cargoData, setData: setCargoData, post: postCargo,
        processing: processingCargo, errors: cargoErrors, reset: resetCargo,
    } = useForm({ nombre: "" });

    const submitCargo = useCallback((e) => {
        e.preventDefault();
        postCargo(route("cargos.storeQuick"), {
            preserveScroll: true,
            onSuccess: () => { setShowCargoModal(false); resetCargo(); },
        });
    }, [postCargo, resetCargo]);

    // ── Filtros server-side ───────────────────────────────────────────────────

    const applyFilters = useCallback((params = {}) => {
        router.get(route("trabajadores.index"), {
            search:      params.search      ?? searchInput,
            proyecto_id: params.proyecto_id ?? selectedProyecto,
            estado:      params.estado      ?? selectedEstado,
        }, { preserveState: true, preserveScroll: true, replace: true });
    }, [searchInput, selectedProyecto, selectedEstado]);

    const clearFilters = useCallback(() => {
        setSearchInput(""); setSelectedProyecto("todos"); setSelectedEstado("todos");
        router.get(route("trabajadores.index"), {}, { preserveState: true, replace: true });
    }, []);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <Head title="Trabajadores" />

            <div className="flex-1 overflow-auto bg-slate-50">

                {/* Header */}
                <div className="bg-white border-b px-8 py-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Trabajadores</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Gestión de personal para control y trazabilidad de EPP</p>
                    </div>
                    <Button onClick={openCreate} disabled={!canCreate}
                        className="bg-slate-900 hover:bg-slate-700 text-white gap-2">
                        <Plus className="h-4 w-4" /> Nuevo trabajador
                    </Button>
                </div>

                <div className="p-6 space-y-5">

                    {/* Flash */}
                    {flash.success && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0" /> {flash.success}
                        </div>
                    )}
                    {flash.error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0" /> {flash.error}
                        </div>
                    )}

                    {/* Aviso sin cargos/proyectos */}
                    {!canCreate && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            {cargos.length === 0
                                ? "Primero crea al menos un cargo laboral en Configuración."
                                : "Primero registra al menos un proyecto activo en Configuración."}
                        </div>
                    )}

                    {/* KPIs — FIX: valores del servidor, no de la página actual */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total",    value: serverStats.total,    icon: Users,      cls: "text-slate-800"   },
                            { label: "Activos",  value: serverStats.activos,  icon: UserCheck,  cls: "text-emerald-600" },
                            { label: "Cesados",  value: serverStats.cesados,  icon: UserX,      cls: "text-slate-500"   },
                            { label: "Con foto", value: serverStats.con_foto, icon: ImageIcon,  cls: "text-blue-600"    },
                        ].map(({ label, value, icon: Icon, cls }) => (
                            <Card key={label} className="border shadow-sm">
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
                                        <p className={`text-3xl font-bold mt-1 ${cls}`}>{value}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                        <Icon className={`h-5 w-5 ${cls}`} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Filtros */}
                    <Card className="border shadow-sm">
                        <CardContent className="p-4">
                            <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_80px_90px]">

                                {/* FIX: searchInput separado del valor de filtro activo */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        value={searchInput}
                                        onChange={e => setSearchInput(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && applyFilters({ search: searchInput })}
                                        placeholder="Nombre, DNI, fotocheck... (busca automáticamente)"
                                        className="pl-9 h-10"
                                    />
                                </div>

                                <select
                                    value={selectedProyecto}
                                    onChange={e => { setSelectedProyecto(e.target.value); applyFilters({ proyecto_id: e.target.value }); }}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                                    <option value="todos">Todos los proyectos</option>
                                    {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>

                                <select
                                    value={selectedEstado}
                                    onChange={e => { setSelectedEstado(e.target.value); applyFilters({ estado: e.target.value }); }}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                                    <option value="todos">Todos los estados</option>
                                    <option value="ACTIVO">Activo</option>
                                    <option value="CESADO">Cesado</option>
                                    <option value="SUSPENDIDO">Suspendido</option>
                                </select>

                                <Button onClick={() => applyFilters()} className="h-10">Buscar</Button>
                                <Button variant="outline" onClick={clearFilters} className="h-10">Limpiar</Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabla */}
                    <Card className="border shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-slate-900">Listado</h2>
                                <p className="text-sm text-muted-foreground">
                                    Mostrando {trabajadoresData.length} de {trabajadores.total} resultado(s)
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px]">
                                <thead>
                                    <tr className="border-b bg-slate-50/60">
                                        {["Trabajador", "Fotocheck", "Proyecto / Cargo", "Contacto", "Ingreso", "EPP", "Estado", "Acciones"].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {trabajadoresData.length > 0 ? trabajadoresData.map(t => (
                                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar src={t.foto_url} trabajador={t} size="sm" />
                                                    <div>
                                                        <p className="font-semibold text-slate-900 text-sm">{t.nombres} {t.apellidos}</p>
                                                        <p className="text-xs text-slate-400">DNI: {t.dni}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-semibold">
                                                    {t.codigo_fotocheck}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-sm text-slate-800">{t.proyecto?.nombre ?? "—"}</p>
                                                <p className="text-xs text-slate-400">{t.cargo_laboral?.nombre ?? "Sin cargo"}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <p className="text-slate-700">{t.correo || "—"}</p>
                                                <p className="text-xs text-slate-400">{t.telefono || "—"}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{formatDate(t.fecha_ingreso)}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-bold text-blue-600">{t.entregas_count ?? 0}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge className={`text-xs border ${ESTADO_CONFIG[t.estado]?.cls}`}>
                                                    {ESTADO_CONFIG[t.estado]?.label ?? t.estado}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50"
                                                        onClick={() => openDetail(t)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                                                        onClick={() => openEdit(t)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50"
                                                        onClick={() => handleDelete(t)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={8} className="py-14 text-center text-slate-400">
                                                <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                                <p>No hay trabajadores para mostrar</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        {trabajadores.links?.length > 0 && (
                            <div className="flex items-center justify-between border-t px-6 py-4 bg-slate-50/50">
                                <p className="text-sm text-muted-foreground">
                                    Página {trabajadores.current_page} de {trabajadores.last_page}
                                    {trabajadores.from ? ` · ${trabajadores.from}–${trabajadores.to}` : ""}
                                </p>
                                <div className="flex gap-1.5">
                                    {trabajadores.links.map((link, i) => (
                                        <Button key={i} size="sm" variant={link.active ? "default" : "outline"}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* ═══ MODAL CREAR / EDITAR ═══ */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

                        {/* Header */}
                        <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {isEditing ? "Editar trabajador" : "Nuevo trabajador"}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {isEditing
                                        ? `Editando: ${editingTrabajador?.nombres} ${editingTrabajador?.apellidos}`
                                        : "Completa los datos del trabajador"}
                                </p>
                            </div>
                            <button onClick={closeModal}
                                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors">
                                <X className="w-4 h-4 text-slate-600" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-6">
                            <form id="trabajador-form" onSubmit={submitTrabajador} className="space-y-5">

                                {/* Foto */}
                                <div className="flex items-center gap-4 rounded-xl border border-slate-100 p-4 bg-slate-50">
                                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center bg-white shrink-0">
                                        {previewUrl
                                            ? <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                                            : <Camera className="w-7 h-7 text-slate-300" />
                                        }
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-700 mb-1">Foto del trabajador</p>
                                        <p className="text-xs text-slate-400 mb-2">JPG, PNG · Máx 2 MB</p>
                                        <Input type="file" accept="image/*" onChange={handleFotoChange}
                                            className="h-9 text-xs file:mr-3 file:px-3 file:py-1 file:rounded-md file:border-0 file:bg-slate-900 file:text-white file:text-xs cursor-pointer" />
                                        {errors.foto && <p className="text-xs text-red-500 mt-1">{errors.foto}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Nombres *</Label>
                                        <Input value={data.nombres} onChange={e => setData("nombres", e.target.value)} className="h-10" />
                                        {errors.nombres && <p className="text-xs text-red-500">{errors.nombres}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Apellidos *</Label>
                                        <Input value={data.apellidos} onChange={e => setData("apellidos", e.target.value)} className="h-10" />
                                        {errors.apellidos && <p className="text-xs text-red-500">{errors.apellidos}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">DNI *</Label>
                                        <Input value={data.dni} onChange={e => setData("dni", e.target.value)} className="h-10" />
                                        {errors.dni && <p className="text-xs text-red-500">{errors.dni}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Fotocheck *</Label>
                                        <Input value={data.codigo_fotocheck} onChange={e => setData("codigo_fotocheck", e.target.value)} className="h-10" />
                                        {errors.codigo_fotocheck && <p className="text-xs text-red-500">{errors.codigo_fotocheck}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Correo</Label>
                                        <Input type="email" value={data.correo} onChange={e => setData("correo", e.target.value)} className="h-10" />
                                        {errors.correo && <p className="text-xs text-red-500">{errors.correo}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Teléfono</Label>
                                        <Input value={data.telefono} onChange={e => setData("telefono", e.target.value)} className="h-10" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Proyecto *</Label>
                                        <select value={data.proyecto_id} onChange={e => setData("proyecto_id", e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                                            <option value="">Seleccionar proyecto...</option>
                                            {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                        </select>
                                        {errors.proyecto_id && <p className="text-xs text-red-500">{errors.proyecto_id}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Cargo laboral *</Label>
                                            <button type="button" onClick={() => setShowCargoModal(true)}
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                                <Plus className="h-3 w-3" /> Nuevo cargo
                                            </button>
                                        </div>
                                        <select value={data.cargo_laboral_id} onChange={e => setData("cargo_laboral_id", e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                                            <option value="">Seleccionar cargo...</option>
                                            {cargos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                        </select>
                                        {errors.cargo_laboral_id && <p className="text-xs text-red-500">{errors.cargo_laboral_id}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Fecha de ingreso *</Label>
                                        <Input type="date" value={data.fecha_ingreso} onChange={e => setData("fecha_ingreso", e.target.value)} className="h-10" />
                                        {errors.fecha_ingreso && <p className="text-xs text-red-500">{errors.fecha_ingreso}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Fecha de cumpleaños</Label>
                                        <Input type="date" value={data.happy_birthday} onChange={e => setData("happy_birthday", e.target.value)} className="h-10" />
                                    </div>

                                    {isEditing && (
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Fecha de cese</Label>
                                            <Input type="date" value={data.fecha_cese} onChange={e => setData("fecha_cese", e.target.value)} className="h-10" />
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Estado *</Label>
                                        <select value={data.estado} onChange={e => setData("estado", e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                                            <option value="ACTIVO">Activo</option>
                                            <option value="CESADO">Cesado</option>
                                            <option value="SUSPENDIDO">Suspendido</option>
                                        </select>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={closeModal} disabled={processing}>Cancelar</Button>
                            <Button type="submit" form="trabajador-form" disabled={processing}
                                className="bg-slate-900 hover:bg-slate-700 text-white">
                                {processing ? "Guardando..." : isEditing ? "Actualizar" : "Guardar trabajador"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ MODAL DETALLE ═══ */}
            {showDetailModal && detailTrabajador && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">

                        {/* Banner */}
                        <div className="bg-gradient-to-br from-slate-700 to-slate-900 px-6 py-5 flex items-center gap-4 relative">
                            <Avatar src={detailTrabajador.foto_url} trabajador={detailTrabajador} size="lg" />
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white text-lg font-bold truncate">
                                    {detailTrabajador.nombres} {detailTrabajador.apellidos}
                                </h3>
                                <p className="text-slate-300 text-sm">{detailTrabajador.cargo_laboral?.nombre ?? "Sin cargo"}</p>
                                <Badge className={`mt-2 text-xs border ${ESTADO_CONFIG[detailTrabajador.estado]?.cls}`}>
                                    {ESTADO_CONFIG[detailTrabajador.estado]?.label}
                                </Badge>
                            </div>
                            <button onClick={closeDetail}
                                className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { icon: BadgeCheck,  label: "Fotocheck",   value: detailTrabajador.codigo_fotocheck },
                                    { icon: BadgeCheck,  label: "DNI",         value: detailTrabajador.dni },
                                    { icon: Mail,        label: "Correo",      value: detailTrabajador.correo || "—" },
                                    { icon: Phone,       label: "Teléfono",    value: detailTrabajador.telefono || "—" },
                                    { icon: Briefcase,   label: "Proyecto",    value: detailTrabajador.proyecto?.nombre || "—" },
                                    { icon: CalendarDays,label: "Ingreso",     value: formatDate(detailTrabajador.fecha_ingreso) },
                                    { icon: CalendarDays,label: "Cumpleaños",  value: formatDate(detailTrabajador.happy_birthday) },
                                    { icon: CalendarDays,label: "Cese",        value: formatDate(detailTrabajador.fecha_cese) },
                                ].map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-start gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                                            <Icon className="h-3.5 w-3.5 text-slate-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
                                            <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                                    <BadgeCheck className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs text-blue-600">Entregas EPP registradas</p>
                                    <p className="text-2xl font-bold text-blue-800">{detailTrabajador.entregas_count ?? 0}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <Button variant="outline" className="flex-1" onClick={closeDetail}>Cerrar</Button>
                                <Button className="flex-1 bg-slate-900 hover:bg-slate-700 text-white"
                                    onClick={() => { closeDetail(); openEdit(detailTrabajador); }}>
                                    <Edit className="h-4 w-4 mr-1.5" /> Editar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ MODAL CARGO RÁPIDO ═══ */}
            <Dialog open={showCargoModal} onOpenChange={open => !open && setShowCargoModal(false)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Nuevo cargo laboral</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCargo} className="space-y-4 pt-1">
                        <div className="space-y-1.5">
                            <Label>Nombre del cargo *</Label>
                            <Input value={cargoData.nombre}
                                onChange={e => setCargoData("nombre", e.target.value)}
                                placeholder="Ej: Operador, Supervisor..." autoFocus />
                            {cargoErrors.nombre && <p className="text-xs text-red-500">{cargoErrors.nombre}</p>}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowCargoModal(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processingCargo}>
                                {processingCargo ? "Guardando..." : "Crear cargo"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}