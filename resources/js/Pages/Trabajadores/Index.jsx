import { useMemo, useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm, router } from "@inertiajs/react";
import {
    Search, Plus, Edit, Trash2, Users, UserCheck, UserX,
    ImageIcon, AlertTriangle, Eye, Briefcase, Mail, Phone,
    CalendarDays, BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// ── Helpers ──────────────────────────────────────────────────────────────────

const ESTADO_CONFIG = {
    ACTIVO:     { label: "Activo",     cls: "bg-green-100 text-green-700 hover:bg-green-100" },
    CESADO:     { label: "Cesado",     cls: "bg-slate-100 text-slate-700 hover:bg-slate-100" },
    SUSPENDIDO: { label: "Suspendido", cls: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
};

function ResumenCard({ title, value, icon: Icon, valueClassName = "" }) {
    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className={`text-2xl font-bold ${valueClassName}`}>{value}</p>
                    </div>
                    <div className="rounded-xl bg-muted p-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function TrabajadoresIndex({
    trabajadores = { data: [], links: [], total: 0, current_page: 1, last_page: 1, from: null, to: null },
    cargos   = [],   // CargoLaboral[]
    proyectos = [],  // Proyecto[]
    filters  = {},
}) {
    const [searchTerm,     setSearchTerm]     = useState(filters.search      || "");
    const [selectedProyecto, setSelectedProyecto] = useState(filters.proyecto_id || "todos");
    const [selectedEstado, setSelectedEstado] = useState(filters.estado      || "todos");

    const [showTrabajadorModal, setShowTrabajadorModal] = useState(false);
    const [showCargoModal,      setShowCargoModal]      = useState(false);
    const [showDetailModal,     setShowDetailModal]     = useState(false);
    const [isEditing,           setIsEditing]           = useState(false);
    const [previewUrl,          setPreviewUrl]          = useState(null);
    const [selectedTrabajador,  setSelectedTrabajador]  = useState(null);

    const trabajadoresData = trabajadores?.data || [];
    const canCreate = cargos.length > 0 && proyectos.length > 0;

    // ── Formulario trabajador ────────────────────────────────────────────────

    const emptyForm = {
        codigo_fotocheck:  "",
        nombres:           "",
        apellidos:         "",
        dni:               "",
        telefono:          "",
        correo:            "",
        cargo_laboral_id:  "",   // ← nuevo nombre
        proyecto_id:       "",   // ← reemplaza "area"
        fecha_ingreso:     "",
        fecha_cese:        "",
        estado:            "ACTIVO",  // ← enum nuevo
        foto:              null,
        _method:           undefined,
    };

    const { data, setData, post, delete: destroy, processing, errors, reset } = useForm(emptyForm);

    const resetForm = () => { reset(); setPreviewUrl(null); setIsEditing(false); };
    const closeModal = () => { setShowTrabajadorModal(false); resetForm(); };

    const openCreate = () => { resetForm(); setShowTrabajadorModal(true); };

    const openEdit = (t) => {
        setData({
            codigo_fotocheck:  t.codigo_fotocheck ?? "",
            nombres:           t.nombres ?? "",
            apellidos:         t.apellidos ?? "",
            dni:               t.dni ?? "",
            telefono:          t.telefono ?? "",
            correo:            t.correo ?? "",
            cargo_laboral_id:  t.cargo_laboral_id ? String(t.cargo_laboral_id) : "",
            proyecto_id:       t.proyecto_id      ? String(t.proyecto_id)      : "",
            fecha_ingreso:     t.fecha_ingreso    ? String(t.fecha_ingreso).slice(0, 10) : "",
            fecha_cese:        t.fecha_cese       ? String(t.fecha_cese).slice(0, 10)   : "",
            estado:            t.estado ?? "ACTIVO",
            foto:              null,
            _method:           "put",
        });
        setPreviewUrl(t.foto_url ?? null);
        setIsEditing(true);
        setShowTrabajadorModal(true);
    };

    const openDetail = (t) => { setSelectedTrabajador(t); setShowDetailModal(true); };
    const closeDetail = () => { setSelectedTrabajador(null); setShowDetailModal(false); };

    const submitTrabajador = (e) => {
        e.preventDefault();
        const url = isEditing
            ? route("trabajadores.update", selectedTrabajador?.id ?? data.id)
            : route("trabajadores.store");
        post(url, { forceFormData: true, preserveScroll: true, onSuccess: closeModal });
    };

    const handleDelete = (t) => {
        if (!confirm(`¿Eliminar a ${t.nombres} ${t.apellidos}?`)) return;
        destroy(route("trabajadores.destroy", t.id), { preserveScroll: true });
    };

    const handleFotoChange = (e) => {
        const file = e.target.files?.[0] || null;
        setData("foto", file);
        if (file) setPreviewUrl(URL.createObjectURL(file));
    };

    // ── Formulario cargo ─────────────────────────────────────────────────────

    const { data: cargoData, setData: setCargoData, post: postCargo,
            processing: processingCargo, errors: cargoErrors, reset: resetCargo } = useForm({ nombre: "" });

    const submitCargo = (e) => {
        e.preventDefault();
        postCargo(route("cargos.storeQuick"), {
            preserveScroll: true,
            onSuccess: () => { setShowCargoModal(false); resetCargo(); },
        });
    };

    // ── Filtros backend ──────────────────────────────────────────────────────

    const applyFilters = (params = {}) => {
        router.get(route("trabajadores.index"), {
            search:      params.search      ?? searchTerm,
            proyecto_id: params.proyecto_id ?? selectedProyecto,
            estado:      params.estado      ?? selectedEstado,
        }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        setSearchTerm(""); setSelectedProyecto("todos"); setSelectedEstado("todos");
        router.get(route("trabajadores.index"), {}, { preserveState: true, replace: true });
    };

    // ── Stats ────────────────────────────────────────────────────────────────

    const stats = useMemo(() => ({
        total:      trabajadores?.total || 0,
        activos:    trabajadoresData.filter(t => t.estado === "ACTIVO").length,
        cesados:    trabajadoresData.filter(t => t.estado === "CESADO").length,
        conFoto:    trabajadoresData.filter(t => !!t.foto_url).length,
    }), [trabajadores, trabajadoresData]);

    const formatDate = (d) => {
        if (!d) return "—";
        const [y, m, day] = String(d).slice(0, 10).split("-");
        return `${day}/${m}/${y}`;
    };

    const getInitials = (t) =>
        `${t?.nombres?.[0] ?? ""}${t?.apellidos?.[0] ?? ""}`.toUpperCase() || "?";

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <Head title="Trabajadores" />

            <div className="space-y-6 p-4 md:p-6">

                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Trabajadores</h1>
                        <p className="text-sm text-muted-foreground">
                            Gestión de personal para control y trazabilidad de EPP
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={openCreate} disabled={!canCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo trabajador
                        </Button>
                    </div>
                </div>

                {/* Aviso sin cargos o proyectos */}
                {!canCreate && (
                    <Card className="border-amber-200 bg-amber-50">
                        <CardContent className="flex items-start gap-3 p-4">
                            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                            <p className="text-sm text-amber-900">
                                {cargos.length === 0
                                    ? "Primero crea al menos un cargo laboral."
                                    : "Primero registra al menos un proyecto activo."}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* KPIs */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <ResumenCard title="Total"      value={stats.total}   icon={Users} />
                    <ResumenCard title="Activos"    value={stats.activos} icon={UserCheck} valueClassName="text-green-600" />
                    <ResumenCard title="Cesados"    value={stats.cesados} icon={UserX}    valueClassName="text-slate-500" />
                    <ResumenCard title="Con foto"   value={stats.conFoto} icon={ImageIcon} valueClassName="text-blue-600" />
                </div>

                {/* Filtros */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Filtros</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-6">
                            <div className="relative md:col-span-2">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && applyFilters()}
                                    placeholder="Nombre, DNI, fotocheck..."
                                    className="pl-9"
                                />
                            </div>

                            {/* Proyecto (reemplaza Área) */}
                            <select
                                value={selectedProyecto}
                                onChange={e => { setSelectedProyecto(e.target.value); applyFilters({ proyecto_id: e.target.value }); }}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="todos">Todos los proyectos</option>
                                {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>

                            {/* Estado */}
                            <select
                                value={selectedEstado}
                                onChange={e => { setSelectedEstado(e.target.value); applyFilters({ estado: e.target.value }); }}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="todos">Todos los estados</option>
                                <option value="ACTIVO">Activo</option>
                                <option value="CESADO">Cesado</option>
                                <option value="SUSPENDIDO">Suspendido</option>
                            </select>

                            <Button onClick={() => applyFilters()}>Buscar</Button>
                            <Button variant="outline" onClick={clearFilters}>Limpiar</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla desktop */}
                <Card className="hidden overflow-hidden md:block">
                    <CardHeader className="border-b bg-muted/30">
                        <CardTitle className="text-base">Listado</CardTitle>
                        <CardDescription>
                            Mostrando {trabajadoresData.length} de {trabajadores.total} resultado(s)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="min-w-[1100px] w-full">
                                <thead className="bg-muted/40">
                                    <tr className="border-b">
                                        {["Trabajador","Fotocheck","Proyecto / Cargo","Contacto","Ingreso","EPP","Estado","Acciones"].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {trabajadoresData.length > 0 ? trabajadoresData.map(t => (
                                        <tr key={t.id} className="border-b transition-colors hover:bg-muted/30">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    {t.foto_url
                                                        ? <img src={t.foto_url} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-border" />
                                                        : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 text-sm">{getInitials(t)}</div>
                                                    }
                                                    <div>
                                                        <p className="font-medium">{t.nombres} {t.apellidos}</p>
                                                        <p className="text-xs text-muted-foreground">DNI: {t.dni}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="rounded-md bg-muted px-2 py-1 font-mono text-sm">{t.codigo_fotocheck}</span>
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                <p className="font-medium">{t.proyecto?.nombre ?? "—"}</p>
                                                <p className="text-muted-foreground">{t.cargo_laboral?.nombre ?? "Sin cargo"}</p>
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                <p>{t.correo || "—"}</p>
                                                <p className="text-muted-foreground">{t.telefono || "—"}</p>
                                            </td>
                                            <td className="px-4 py-4 text-sm">{formatDate(t.fecha_ingreso)}</td>
                                            <td className="px-4 py-4 text-sm font-medium">{t.entregas_count ?? 0}</td>
                                            <td className="px-4 py-4">
                                                <Badge className={ESTADO_CONFIG[t.estado]?.cls}>
                                                    {ESTADO_CONFIG[t.estado]?.label ?? t.estado}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openDetail(t)}><Eye className="h-4 w-4 text-blue-600" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Edit className="h-4 w-4 text-emerald-600" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={8} className="py-14 text-center text-muted-foreground">No hay trabajadores para mostrar</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        {trabajadores.links?.length > 0 && (
                            <div className="flex items-center justify-between border-t px-4 py-4">
                                <p className="text-sm text-muted-foreground">
                                    Página {trabajadores.current_page} de {trabajadores.last_page}
                                    {trabajadores.from ? ` · ${trabajadores.from}–${trabajadores.to}` : ""}
                                </p>
                                <div className="flex gap-2">
                                    {trabajadores.links.map((link, i) => (
                                        <Button key={i} size="sm" variant={link.active ? "default" : "outline"}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url, { preserveState: true, preserveScroll: true })}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Modal Crear / Editar Trabajador ── */}
            <Dialog open={showTrabajadorModal} onOpenChange={open => !open && closeModal()}>
                <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Editar trabajador" : "Nuevo trabajador"}</DialogTitle>
                        <DialogDescription>Completa los datos del trabajador.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitTrabajador} className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-2">
                            {[
                                { id: "nombres",    label: "Nombres *",   field: "nombres" },
                                { id: "apellidos",  label: "Apellidos *",  field: "apellidos" },
                                { id: "dni",        label: "DNI *",        field: "dni" },
                                { id: "codigo_fotocheck", label: "Fotocheck *", field: "codigo_fotocheck" },
                                { id: "correo",     label: "Correo",       field: "correo", type: "email" },
                                { id: "telefono",   label: "Teléfono",     field: "telefono" },
                            ].map(({ id, label, field, type = "text" }) => (
                                <div key={id} className="space-y-1.5">
                                    <Label htmlFor={id}>{label}</Label>
                                    <Input id={id} type={type} value={data[field]}
                                        onChange={e => setData(field, e.target.value)} />
                                    {errors[field] && <p className="text-xs text-red-500">{errors[field]}</p>}
                                </div>
                            ))}

                            {/* Proyecto */}
                            <div className="space-y-1.5">
                                <Label>Proyecto *</Label>
                                <select value={data.proyecto_id}
                                    onChange={e => setData("proyecto_id", e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="">Seleccionar proyecto</option>
                                    {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                                {errors.proyecto_id && <p className="text-xs text-red-500">{errors.proyecto_id}</p>}
                            </div>

                            {/* Cargo laboral */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label>Cargo laboral *</Label>
                                    <Button type="button" variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs"
                                        onClick={() => setShowCargoModal(true)}>
                                        <Plus className="mr-1 h-3 w-3" /> Crear cargo
                                    </Button>
                                </div>
                                <select value={data.cargo_laboral_id}
                                    onChange={e => setData("cargo_laboral_id", e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="">Seleccionar cargo</option>
                                    {cargos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                                {errors.cargo_laboral_id && <p className="text-xs text-red-500">{errors.cargo_laboral_id}</p>}
                            </div>

                            {/* Fecha ingreso */}
                            <div className="space-y-1.5">
                                <Label>Fecha de ingreso *</Label>
                                <Input type="date" value={data.fecha_ingreso}
                                    onChange={e => setData("fecha_ingreso", e.target.value)} />
                                {errors.fecha_ingreso && <p className="text-xs text-red-500">{errors.fecha_ingreso}</p>}
                            </div>

                            {/* Fecha cese — solo en edición */}
                            {isEditing && (
                                <div className="space-y-1.5">
                                    <Label>Fecha de cese</Label>
                                    <Input type="date" value={data.fecha_cese}
                                        onChange={e => setData("fecha_cese", e.target.value)} />
                                </div>
                            )}

                            {/* Estado */}
                            <div className="space-y-1.5">
                                <Label>Estado *</Label>
                                <select value={data.estado}
                                    onChange={e => setData("estado", e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="ACTIVO">Activo</option>
                                    <option value="CESADO">Cesado</option>
                                    <option value="SUSPENDIDO">Suspendido</option>
                                </select>
                            </div>

                            {/* Foto */}
                            <div className="space-y-2 md:col-span-2">
                                <Label>Foto del trabajador</Label>
                                <div className="grid gap-4 rounded-xl border border-dashed p-4 md:grid-cols-[100px_1fr]">
                                    <div className="flex items-center justify-center">
                                        {previewUrl
                                            ? <img src={previewUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
                                            : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                              </div>
                                        }
                                    </div>
                                    <div className="space-y-2">
                                        <Input type="file" accept="image/*" onChange={handleFotoChange} />
                                        <p className="text-xs text-muted-foreground">JPG, PNG o WEBP · Máx 2 MB</p>
                                        {errors.foto && <p className="text-xs text-red-500">{errors.foto}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t pt-4">
                            <Button type="button" variant="outline" onClick={closeModal} disabled={processing}>Cancelar</Button>
                            <Button type="submit" disabled={processing || !canCreate}>
                                {processing ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Modal Detalle Trabajador ── */}
            <Dialog open={showDetailModal} onOpenChange={open => !open && closeDetail()}>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalle del trabajador</DialogTitle>
                    </DialogHeader>
                    {selectedTrabajador && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-4 rounded-xl border bg-blue-50 p-4">
                                {selectedTrabajador.foto_url
                                    ? <img src={selectedTrabajador.foto_url} alt="" className="h-16 w-16 rounded-full object-cover" />
                                    : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-200 font-bold text-blue-700">{getInitials(selectedTrabajador)}</div>
                                }
                                <div>
                                    <h3 className="text-lg font-bold">{selectedTrabajador.nombres} {selectedTrabajador.apellidos}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedTrabajador.cargo_laboral?.nombre ?? "Sin cargo"}</p>
                                    <Badge className={`mt-1 ${ESTADO_CONFIG[selectedTrabajador.estado]?.cls}`}>
                                        {ESTADO_CONFIG[selectedTrabajador.estado]?.label}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                {[
                                    { icon: BadgeCheck, label: "Fotocheck", value: selectedTrabajador.codigo_fotocheck },
                                    { icon: BadgeCheck, label: "DNI",       value: selectedTrabajador.dni },
                                    { icon: Mail,       label: "Correo",    value: selectedTrabajador.correo || "—" },
                                    { icon: Phone,      label: "Teléfono",  value: selectedTrabajador.telefono || "—" },
                                    { icon: Briefcase,  label: "Proyecto",  value: selectedTrabajador.proyecto?.nombre || "—" },
                                    { icon: CalendarDays, label: "Ingreso", value: formatDate(selectedTrabajador.fecha_ingreso) },
                                ].map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="flex items-start gap-2 rounded-lg border p-3">
                                        <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">{label}</p>
                                            <p className="font-medium text-sm">{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Card>
                                <CardContent className="p-4 flex items-center gap-3">
                                    <BadgeCheck className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Entregas EPP registradas</p>
                                        <p className="text-2xl font-bold">{selectedTrabajador.entregas_count ?? 0}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end gap-2 border-t pt-4">
                                <Button variant="outline" onClick={closeDetail}>Cerrar</Button>
                                <Button onClick={() => { closeDetail(); openEdit(selectedTrabajador); }}>
                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}