// resources/js/Pages/Configuracion/Index.jsx

import { useState, useCallback } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import {
    Plus, Edit, Trash2, Briefcase, Building2,
    Warehouse, CheckCircle2, AlertTriangle, X,
    HardHat, ShieldCheck, PackageOpen, Settings2,
    ChevronRight, ToggleLeft, ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ── Tabs disponibles ──────────────────────────────────────────────────────────

const TABS = [
    {
        key: "cargos",
        label: "Cargos laborales",
        icon: Briefcase,
        description: "Roles y posiciones del personal",
        color: "text-sky-600",
        bg: "bg-sky-50",
        border: "border-sky-200",
        activeBg: "bg-sky-600",
    },
    {
        key: "proyectos",
        label: "Proyectos",
        icon: Building2,
        description: "Obras y operaciones activas",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        activeBg: "bg-emerald-600",
    },
    {
        key: "almacenes",
        label: "Almacenes",
        icon: Warehouse,
        description: "Depósitos de EPP y segregación",
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        activeBg: "bg-amber-600",
    },
];

// ── Modal genérico ────────────────────────────────────────────────────────────

function FormModal({ open, onClose, title, icon: Icon, children, onSubmit, processing, accentColor = "bg-slate-800" }) {
    return (
        <Dialog open={open} onOpenChange={o => !o && onClose()}>
            <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
                {/* Header con color */}
                <div className={`${accentColor} px-6 py-5 flex items-center gap-3`}>
                    {Icon && (
                        <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-white" />
                        </div>
                    )}
                    <DialogTitle className="text-white font-semibold text-base m-0">{title}</DialogTitle>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    {children}
                    <div className="flex gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={processing}
                            className="flex-1 rounded-xl h-10"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className={`flex-1 rounded-xl h-10 ${accentColor} text-white hover:opacity-90 border-0`}
                        >
                            {processing ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Guardando...
                                </span>
                            ) : "Guardar cambios"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ── Stat Card pequeño ─────────────────────────────────────────────────────────

function StatChip({ count, label, icon: Icon, colorClass }) {
    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${colorClass}`}>
            <Icon className="h-3.5 w-3.5" />
            <span>{count} {label}</span>
        </div>
    );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, error, children }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</Label>
            {children}
            {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{error}</p>}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// PESTAÑA: CARGOS
// ════════════════════════════════════════════════════════════════════════════

function TabCargos({ cargos = [] }) {
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const { data, setData, post, put, processing, errors, reset } = useForm({ nombre: "" });

    const openCreate = useCallback(() => { reset(); setEditing(null); setModal(true); }, []);
    const openEdit   = useCallback((c) => { setData("nombre", c.nombre); setEditing(c); setModal(true); }, []);
    const closeModal = useCallback(() => { setModal(false); setEditing(null); reset(); }, []);

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: closeModal };
        editing
            ? put(route("cargos.update", editing.id), opts)
            : post(route("cargos.storeQuick"), opts);
    };

    const handleDelete = (c) => {
        if (!confirm(`¿Eliminar el cargo "${c.nombre}"?`)) return;
        router.delete(route("cargos.destroy", c.id), { preserveScroll: true });
    };

    return (
        <>
            <div className="space-y-4">
                {/* Summary Card */}
                <div className="grid grid-cols-1 gap-4">
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-sky-500 to-sky-700 text-white rounded-2xl overflow-hidden">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-sky-100 text-sm font-medium">Total de cargos</p>
                                <p className="text-4xl font-bold mt-1">{cargos.length}</p>
                                <p className="text-sky-200 text-xs mt-1">registrados en el sistema</p>
                            </div>
                            <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
                                <Briefcase className="h-8 w-8 text-white" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Table Card */}
                <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-sky-100 flex items-center justify-center">
                                <Briefcase className="h-4 w-4 text-sky-600" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-semibold text-slate-800">Cargos laborales</CardTitle>
                                <CardDescription className="text-xs">{cargos.length} registros</CardDescription>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            onClick={openCreate}
                            className="gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white border-0 h-8 px-3 text-xs"
                        >
                            <Plus className="h-3.5 w-3.5" /> Nuevo cargo
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-12">#</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre del cargo</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cargos.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <Briefcase className="h-10 w-10 opacity-30" />
                                                <p className="text-sm font-medium">Sin cargos registrados</p>
                                                <p className="text-xs">Crea el primer cargo laboral</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : cargos.map((c, i) => (
                                    <TableRow key={c.id} className="hover:bg-sky-50/30 transition-colors group">
                                        <TableCell className="text-slate-400 text-xs font-mono">{String(i + 1).padStart(2, "0")}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-lg bg-sky-100 flex items-center justify-center">
                                                    <HardHat className="h-3.5 w-3.5 text-sky-600" />
                                                </div>
                                                <span className="font-medium text-slate-800 text-sm">{c.nombre}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEdit(c)}
                                                    className="h-7 w-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors"
                                                >
                                                    <Edit className="h-3.5 w-3.5 text-emerald-700" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c)}
                                                    className="h-7 w-7 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <FormModal
                open={modal}
                onClose={closeModal}
                title={editing ? "Editar cargo" : "Nuevo cargo laboral"}
                icon={Briefcase}
                onSubmit={submit}
                processing={processing}
                accentColor="bg-sky-600"
            >
                <Field label="Nombre del cargo *" error={errors.nombre}>
                    <Input
                        value={data.nombre}
                        onChange={e => setData("nombre", e.target.value)}
                        placeholder="Ej: Operador, Supervisor, Vigía..."
                        autoFocus
                        className="rounded-xl h-10"
                    />
                </Field>
            </FormModal>
        </>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// PESTAÑA: PROYECTOS
// ════════════════════════════════════════════════════════════════════════════

function TabProyectos({ proyectos = [] }) {
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const { data, setData, post, put, processing, errors, reset } = useForm({ nombre: "", activo: true });

    const openCreate = useCallback(() => { reset(); setEditing(null); setModal(true); }, []);
    const openEdit   = useCallback((p) => { setData({ nombre: p.nombre, activo: !!p.activo }); setEditing(p); setModal(true); }, []);
    const closeModal = useCallback(() => { setModal(false); setEditing(null); reset(); }, []);

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: closeModal };
        editing
            ? put(route("proyectos.update", editing.id), opts)
            : post(route("proyectos.store"), opts);
    };

    const handleDelete = (p) => {
        if (!confirm(`¿Eliminar el proyecto "${p.nombre}"? Esto afectará a los trabajadores y almacenes asociados.`)) return;
        router.delete(route("proyectos.destroy", p.id), { preserveScroll: true });
    };

    const activos   = proyectos.filter(p => p.activo).length;
    const inactivos = proyectos.length - activos;

    return (
        <>
            <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl overflow-hidden">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-emerald-100 text-sm font-medium">Proyectos activos</p>
                                <p className="text-4xl font-bold mt-1">{activos}</p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
                                <ShieldCheck className="h-7 w-7 text-white" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Inactivos</p>
                                <p className="text-4xl font-bold mt-1 text-slate-700">{inactivos}</p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                                <Building2 className="h-7 w-7 text-slate-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Table Card */}
                <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-semibold text-slate-800">Proyectos</CardTitle>
                                <CardDescription className="text-xs">{proyectos.length} registros</CardDescription>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            onClick={openCreate}
                            className="gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-0 h-8 px-3 text-xs"
                        >
                            <Plus className="h-3.5 w-3.5" /> Nuevo proyecto
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-12">#</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Proyecto</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {proyectos.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <Building2 className="h-10 w-10 opacity-30" />
                                                <p className="text-sm font-medium">Sin proyectos registrados</p>
                                                <p className="text-xs">Crea el primer proyecto</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : proyectos.map((p, i) => (
                                    <TableRow key={p.id} className="hover:bg-emerald-50/30 transition-colors group">
                                        <TableCell className="text-slate-400 text-xs font-mono">{String(i + 1).padStart(2, "0")}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${p.activo ? "bg-emerald-100" : "bg-slate-100"}`}>
                                                    <Building2 className={`h-3.5 w-3.5 ${p.activo ? "text-emerald-600" : "text-slate-400"}`} />
                                                </div>
                                                <span className="font-medium text-slate-800 text-sm">{p.nombre}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {p.activo ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                                    Inactivo
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEdit(p)}
                                                    className="h-7 w-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors"
                                                >
                                                    <Edit className="h-3.5 w-3.5 text-emerald-700" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(p)}
                                                    className="h-7 w-7 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <FormModal
                open={modal}
                onClose={closeModal}
                title={editing ? "Editar proyecto" : "Nuevo proyecto"}
                icon={Building2}
                onSubmit={submit}
                processing={processing}
                accentColor="bg-emerald-600"
            >
                <Field label="Nombre del proyecto *" error={errors.nombre}>
                    <Input
                        value={data.nombre}
                        onChange={e => setData("nombre", e.target.value)}
                        placeholder="Ej: Relavera, Obras Civiles..."
                        autoFocus
                        className="rounded-xl h-10"
                    />
                </Field>

                <button
                    type="button"
                    onClick={() => setData("activo", !data.activo)}
                    className={`w-full flex items-center justify-between rounded-xl border p-4 transition-colors ${
                        data.activo ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
                    }`}
                >
                    <div className="text-left">
                        <p className="text-sm font-semibold text-slate-800">Proyecto activo</p>
                        <p className="text-xs text-slate-500 mt-0.5">Los inactivos no aparecen en formularios</p>
                    </div>
                    {data.activo
                        ? <ToggleRight className="h-7 w-7 text-emerald-600" />
                        : <ToggleLeft className="h-7 w-7 text-slate-400" />
                    }
                </button>
            </FormModal>
        </>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// PESTAÑA: ALMACENES
// ════════════════════════════════════════════════════════════════════════════

function TabAlmacenes({ almacenes = [], proyectos = [] }) {
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const { data, setData, post, put, processing, errors, reset } = useForm({
        nombre:       "",
        proyecto_id:  "",
        tipo_almacen: "OPERATIVO",
        compartido:   false,
        activo:       true,
    });

    const openCreate = useCallback(() => { reset(); setEditing(null); setModal(true); }, []);
    const openEdit   = useCallback((a) => {
        setData({
            nombre:       a.nombre,
            proyecto_id:  a.proyecto_id ? String(a.proyecto_id) : "",
            tipo_almacen: a.tipo_almacen,
            compartido:   !!a.compartido,
            activo:       !!a.activo,
        });
        setEditing(a);
        setModal(true);
    }, []);
    const closeModal = useCallback(() => { setModal(false); setEditing(null); reset(); }, []);

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: closeModal };
        editing
            ? put(route("almacenes.update", editing.id), opts)
            : post(route("almacenes.store"), opts);
    };

    const handleDelete = (a) => {
        if (!confirm(`¿Eliminar el almacén "${a.nombre}"?`)) return;
        router.delete(route("almacenes.destroy", a.id), { preserveScroll: true });
    };

    // ✅ FIX: Al cambiar tipo, limpiamos proyecto_id si es SEGREGACION
    const handleTipoChange = (e) => {
        const tipo = e.target.value;
        setData(prev => ({
            ...prev,
            tipo_almacen: tipo,
            proyecto_id: tipo === "SEGREGACION" ? "" : prev.proyecto_id,
        }));
    };

    const TIPO_CONFIG = {
        OPERATIVO:   { label: "Operativo",   cls: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500"   },
        SEGREGACION: { label: "Segregación", cls: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
    };

    const operativos   = almacenes.filter(a => a.tipo_almacen === "OPERATIVO").length;
    const segregacion  = almacenes.filter(a => a.tipo_almacen === "SEGREGACION").length;

    return (
        <>
            <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-2xl overflow-hidden">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-amber-100 text-sm font-medium">Total almacenes</p>
                                <p className="text-4xl font-bold mt-1">{almacenes.length}</p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
                                <Warehouse className="h-7 w-7 text-white" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border border-blue-200 shadow-sm rounded-2xl overflow-hidden bg-blue-50">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-blue-500 text-sm font-medium">Operativos</p>
                                <p className="text-4xl font-bold mt-1 text-blue-700">{operativos}</p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                                <PackageOpen className="h-7 w-7 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border border-amber-200 shadow-sm rounded-2xl overflow-hidden bg-amber-50">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-amber-500 text-sm font-medium">Segregación</p>
                                <p className="text-4xl font-bold mt-1 text-amber-700">{segregacion}</p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center">
                                <AlertTriangle className="h-7 w-7 text-amber-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Table Card */}
                <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                <Warehouse className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-semibold text-slate-800">Almacenes</CardTitle>
                                <CardDescription className="text-xs">{almacenes.length} registros</CardDescription>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            onClick={openCreate}
                            className="gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white border-0 h-8 px-3 text-xs"
                        >
                            <Plus className="h-3.5 w-3.5" /> Nuevo almacén
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-12">#</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Almacén</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Proyecto</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Compartido</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {almacenes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <Warehouse className="h-10 w-10 opacity-30" />
                                                <p className="text-sm font-medium">Sin almacenes registrados</p>
                                                <p className="text-xs">Crea el primer almacén</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : almacenes.map((a, i) => {
                                    const tipo = TIPO_CONFIG[a.tipo_almacen];
                                    return (
                                        <TableRow key={a.id} className="hover:bg-amber-50/20 transition-colors group">
                                            <TableCell className="text-slate-400 text-xs font-mono">{String(i + 1).padStart(2, "0")}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${a.tipo_almacen === "SEGREGACION" ? "bg-amber-100" : "bg-blue-100"}`}>
                                                        <Warehouse className={`h-3.5 w-3.5 ${a.tipo_almacen === "SEGREGACION" ? "text-amber-600" : "text-blue-600"}`} />
                                                    </div>
                                                    <span className="font-medium text-slate-800 text-sm">{a.nombre}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600">{a.proyecto?.nombre ?? <span className="text-slate-400 italic text-xs">Sin proyecto</span>}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${tipo?.cls}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${tipo?.dot}`} />
                                                    {tipo?.label ?? a.tipo_almacen}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {a.compartido
                                                    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200">Sí</span>
                                                    : <span className="text-xs text-slate-400">No</span>
                                                }
                                            </TableCell>
                                            <TableCell>
                                                {a.activo ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        Activo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                                        Inactivo
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEdit(a)}
                                                        className="h-7 w-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors"
                                                    >
                                                        <Edit className="h-3.5 w-3.5 text-emerald-700" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(a)}
                                                        className="h-7 w-7 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <FormModal
                open={modal}
                onClose={closeModal}
                title={editing ? "Editar almacén" : "Nuevo almacén"}
                icon={Warehouse}
                onSubmit={submit}
                processing={processing}
                accentColor="bg-amber-600"
            >
                <Field label="Nombre del almacén *" error={errors.nombre}>
                    <Input
                        value={data.nombre}
                        onChange={e => setData("nombre", e.target.value)}
                        placeholder="Ej: Almacén Relavera, Almacén Segregación..."
                        autoFocus
                        className="rounded-xl h-10"
                    />
                </Field>

                {/* Selector de tipo como tarjetas */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tipo de almacén *</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { value: "OPERATIVO",   label: "Operativo",   desc: "Stock disponible",  icon: PackageOpen,    color: "border-blue-400 bg-blue-50 text-blue-700"   },
                            { value: "SEGREGACION", label: "Segregación", desc: "EPP dañados / baja", icon: AlertTriangle,  color: "border-amber-400 bg-amber-50 text-amber-700" },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleTipoChange({ target: { value: opt.value } })}
                                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                                    data.tipo_almacen === opt.value
                                        ? opt.color
                                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                                }`}
                            >
                                <opt.icon className="h-5 w-5" />
                                <p className="text-xs font-semibold">{opt.label}</p>
                                <p className="text-xs opacity-70">{opt.desc}</p>
                            </button>
                        ))}
                    </div>
                    {errors.tipo_almacen && <p className="text-xs text-red-500">{errors.tipo_almacen}</p>}
                </div>

                {/* Proyecto — solo si es OPERATIVO */}
                {data.tipo_almacen === "OPERATIVO" && (
                    <Field label="Proyecto asociado" error={errors.proyecto_id}>
                        <select
                            value={data.proyecto_id}
                            onChange={e => setData("proyecto_id", e.target.value)}
                            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            <option value="">Sin proyecto (compartido)</option>
                            {proyectos.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </Field>
                )}

                {/* Toggles */}
                <div className="space-y-2">
                    {[
                        { key: "compartido", label: "Almacén compartido", desc: "Visible desde todos los proyectos" },
                        { key: "activo",     label: "Almacén activo",     desc: "Los inactivos no aparecen en formularios" },
                    ].map(({ key, label, desc }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setData(key, !data[key])}
                            className={`w-full flex items-center justify-between rounded-xl border p-3 transition-colors ${
                                data[key] ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
                            }`}
                        >
                            <div className="text-left">
                                <p className="text-sm font-semibold text-slate-800">{label}</p>
                                <p className="text-xs text-slate-500">{desc}</p>
                            </div>
                            {data[key]
                                ? <ToggleRight className="h-6 w-6 text-emerald-600 shrink-0" />
                                : <ToggleLeft  className="h-6 w-6 text-slate-400 shrink-0" />
                            }
                        </button>
                    ))}
                </div>
            </FormModal>
        </>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default function ConfiguracionIndex({
    cargos    = [],
    proyectos = [],
    almacenes = [],
}) {
    const { flash = {} } = usePage().props;
    const [tab, setTab] = useState("cargos");

    const activeTab = TABS.find(t => t.key === tab);

    return (
        <AdminLayout>
            <Head title="Configuración" />

            <div className="flex-1 space-y-6 bg-slate-50/60 p-6">

                {/* ── Header ──────────────────────────────────────────── */}
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center">
                            <Settings2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">Configuración</h1>
                            <p className="text-slate-400 text-sm mt-0.5">Gestión de tablas maestras del sistema</p>
                        </div>
                        <div className="ml-auto flex gap-2">
                            <StatChip count={cargos.length}    label="cargos"    icon={Briefcase} colorClass="bg-sky-900/50 text-sky-300 border-sky-700" />
                            <StatChip count={proyectos.length} label="proyectos" icon={Building2} colorClass="bg-emerald-900/50 text-emerald-300 border-emerald-700" />
                            <StatChip count={almacenes.length} label="almacenes" icon={Warehouse}  colorClass="bg-amber-900/50 text-amber-300 border-amber-700" />
                        </div>
                    </div>
                </div>

                {/* ── Flash Messages ───────────────────────────────────── */}
                {flash.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 flex items-center gap-2 text-sm shadow-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 flex items-center gap-2 text-sm shadow-sm">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* ── Tabs ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-3">
                    {TABS.map(({ key, label, icon: Icon, description, bg, border, activeBg }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                                tab === key
                                    ? `${bg} ${border} shadow-sm`
                                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                            }`}
                        >
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                                tab === key ? `${activeBg}` : "bg-slate-100"
                            }`}>
                                <Icon className={`h-4.5 w-4.5 ${tab === key ? "text-white" : "text-slate-500"}`} />
                            </div>
                            <div className="min-w-0">
                                <p className={`text-sm font-semibold truncate ${tab === key ? "text-slate-800" : "text-slate-600"}`}>
                                    {label}
                                </p>
                                <p className="text-xs text-slate-400 truncate">{description}</p>
                            </div>
                            {tab === key && <ChevronRight className="h-4 w-4 text-slate-400 ml-auto shrink-0" />}
                        </button>
                    ))}
                </div>

                {/* ── Contenido ────────────────────────────────────────── */}
                {tab === "cargos"    && <TabCargos    cargos={cargos} />}
                {tab === "proyectos" && <TabProyectos proyectos={proyectos} />}
                {tab === "almacenes" && <TabAlmacenes almacenes={almacenes} proyectos={proyectos} />}
            </div>
        </AdminLayout>
    );
}