// resources/js/Pages/Custodia/Index.jsx

import { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import {
    Search, HardHat, User, CalendarDays, RotateCcw,
    ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2,
    ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ESTADO_CUSTODIA = {
    ACTIVO:          { label: "En campo",        cls: "bg-green-100  text-green-700  border-green-200"  },
    DEVUELTO_DANADO: { label: "Devuelto dañado", cls: "bg-amber-100  text-amber-700  border-amber-200"  },
    PERDIDO:         { label: "Perdido",          cls: "bg-red-100    text-red-700    border-red-200"    },
    EXTRAVIADO:      { label: "Extraviado",       cls: "bg-red-100    text-red-700    border-red-200"    },
    CERRADO:         { label: "Cerrado",          cls: "bg-slate-100  text-slate-600  border-slate-200"  },
};

const MOTIVO_LABEL = {
    INICIAL:             "Nuevo ingreso",
    REPOSICION_DESGASTE: "Reposición desgaste",
    REPOSICION_PERDIDA:  "Reposición pérdida",
};

// ── Modal devolución ──────────────────────────────────────────────────────────

function ModalDevolucion({ custodia, almacenesSegregacion, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        cantidad_devuelta:  custodia?.cantidad_pendiente ?? 1,
        almacen_destino_id: almacenesSegregacion.length === 1 ? String(almacenesSegregacion[0].id) : "",
        observaciones:      "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("custodia.devolver", custodia.id), {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    };

    if (!custodia) return null;

    return (
        <Dialog open={!!custodia} onOpenChange={open => !open && onClose()}>
            <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
                {/* Header */}
                <div className="bg-amber-600 px-6 py-5 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                        <RotateCcw className="h-5 w-5 text-white" />
                    </div>
                    <DialogTitle className="text-white font-semibold text-base m-0">
                        Registrar devolución
                    </DialogTitle>
                </div>

                <div className="p-6 space-y-4">
                    {/* Info EPP */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm space-y-1.5">
                        <p className="font-bold text-slate-800 text-base">{custodia.epp}</p>
                        {custodia.talla && custodia.talla !== "ÚNICA" && (
                            <p className="text-xs text-slate-500">Talla: {custodia.talla}</p>
                        )}
                        <p className="text-slate-600">
                            Trabajador: <strong>{custodia.trabajador?.nombre_completo}</strong>
                        </p>
                        <p className="text-slate-600 flex items-center gap-1.5">
                            Pendiente:
                            <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-xs">
                                {custodia.cantidad_pendiente} unidad{custodia.cantidad_pendiente !== 1 ? "es" : ""}
                            </span>
                        </p>
                    </div>

                    {/* Aviso segregación */}
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 flex items-start gap-2">
                        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                        El EPP devuelto ingresará al almacén de <strong>Segregación</strong> con estado <strong>DAÑADO</strong>.
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Cantidad */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                Cantidad a devolver *
                            </Label>
                            <Input
                                type="number" min={1} max={custodia.cantidad_pendiente}
                                value={data.cantidad_devuelta}
                                onChange={e => setData("cantidad_devuelta", Math.max(1, Number(e.target.value)))}
                                className="rounded-xl h-10"
                            />
                            {errors.cantidad_devuelta && (
                                <p className="text-xs text-red-500">{errors.cantidad_devuelta}</p>
                            )}
                        </div>

                        {/* Almacén segregación */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                Almacén de segregación *
                            </Label>
                            {almacenesSegregacion.length === 1 ? (
                                <div className="h-10 px-3 flex items-center rounded-xl border border-amber-200 bg-amber-50 text-sm font-medium text-amber-800">
                                    {almacenesSegregacion[0].nombre}
                                </div>
                            ) : (
                                <select
                                    value={data.almacen_destino_id}
                                    onChange={e => setData("almacen_destino_id", e.target.value)}
                                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                >
                                    <option value="">Seleccionar almacén...</option>
                                    {almacenesSegregacion.map(a => (
                                        <option key={a.id} value={a.id}>{a.nombre}</option>
                                    ))}
                                </select>
                            )}
                            {errors.almacen_destino_id && (
                                <p className="text-xs text-red-500">{errors.almacen_destino_id}</p>
                            )}
                        </div>

                        {/* Observaciones */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                Observaciones
                            </Label>
                            <textarea
                                rows={2}
                                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                                placeholder="Estado del EPP devuelto..."
                                value={data.observaciones}
                                onChange={e => setData("observaciones", e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={onClose}
                                disabled={processing} className="flex-1 rounded-xl h-10">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing}
                                className="flex-1 rounded-xl h-10 bg-amber-600 hover:bg-amber-700 text-white border-0">
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Registrando...
                                    </span>
                                ) : "Confirmar devolución"}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Paginación ────────────────────────────────────────────────────────────────

function Pagination({ meta, pageParam }) {
    if (!meta || meta.last_page <= 1) return null;
    return (
        <div className="flex items-center justify-between border-t px-6 py-4 bg-white">
            <p className="text-sm text-muted-foreground">
                {meta.from ?? 0}–{meta.to ?? 0} de {meta.total ?? 0} registros
            </p>
            <div className="flex gap-2">
                <Button size="sm" variant="outline"
                    disabled={!meta.prev_page_url}
                    onClick={() => meta.prev_page_url && router.visit(meta.prev_page_url, { preserveState: true })}>
                    <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
                <span className="px-3 py-1.5 text-sm font-medium text-slate-600">
                    {meta.current_page} / {meta.last_page}
                </span>
                <Button size="sm" variant="outline"
                    disabled={!meta.next_page_url}
                    onClick={() => meta.next_page_url && router.visit(meta.next_page_url, { preserveState: true })}>
                    Siguiente <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CustodiaIndex({
    activos              = { data: [], meta: {} },
    historial            = { data: [], meta: {} },
    stats                = {},
    proyectos            = [],
    filters              = {},
    almacenesSegregacion = [],
}) {
    const { flash = {} } = usePage().props;

    const [tab,              setTab]              = useState(filters.tab || "activos");
    const [search,           setSearch]           = useState(filters.search || "");
    const [proyectoId,       setProyectoId]       = useState(filters.proyecto_id || "todos");
    const [custodiaDevolver, setCustodiaDevolver] = useState(null);

    const applyFilters = (params = {}) => {
        router.get(route("custodia.index"), {
            tab:         params.tab         ?? tab,
            search:      params.search      ?? search,
            proyecto_id: params.proyecto_id ?? proyectoId,
        }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleTabChange = (newTab) => {
        setTab(newTab);
        applyFilters({ tab: newTab });
    };

    const currentData = tab === "activos" ? activos : historial;
    const totalHistorial = (stats.total_devueltos ?? 0) + (stats.total_perdidos ?? 0) + (stats.total_cerrados ?? 0);

    return (
        <AdminLayout>
            <Head title="Custodia de EPP" />

            <div className="flex-1 space-y-6 bg-slate-50/60 p-6">

                {/* Header */}
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">Custodia de EPP</h1>
                            <p className="text-slate-400 text-sm mt-0.5">EPP bajo responsabilidad de cada trabajador</p>
                        </div>
                    </div>
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 shrink-0" /> {flash.error}
                    </div>
                )}

                {/* KPIs */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: "En campo",         value: stats.total_activos   ?? 0, icon: ShieldCheck, cls: "text-green-600",  bg: "bg-green-50",  border: "border-green-200" },
                        { label: "Devueltos dañados", value: stats.total_devueltos ?? 0, icon: RotateCcw,   cls: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200" },
                        { label: "Perdidos",          value: stats.total_perdidos  ?? 0, icon: ShieldAlert,  cls: "text-red-600",    bg: "bg-red-50",    border: "border-red-200"   },
                        { label: "Cerrados",          value: stats.total_cerrados  ?? 0, icon: CheckCircle2, cls: "text-slate-500",  bg: "bg-slate-50",  border: "border-slate-200" },
                    ].map(({ label, value, icon: Icon, cls, bg, border }) => (
                        <Card key={label} className={`border ${border} ${bg} shadow-sm rounded-2xl`}>
                            <CardContent className="p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">{label}</p>
                                    <p className={`text-3xl font-bold mt-1 ${cls}`}>{value}</p>
                                </div>
                                <div className={`h-12 w-12 rounded-2xl bg-white flex items-center justify-center`}>
                                    <Icon className={`h-6 w-6 ${cls}`} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filtros */}
                <Card className="rounded-2xl border border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                        <div className="grid gap-3 md:grid-cols-[1fr_220px_100px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Nombre, DNI, fotocheck..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && applyFilters()}
                                    className="pl-9 rounded-xl"
                                />
                            </div>
                            <select
                                value={proyectoId}
                                onChange={e => { setProyectoId(e.target.value); applyFilters({ proyecto_id: e.target.value }); }}
                                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            >
                                <option value="todos">Todos los proyectos</option>
                                {proyectos.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                ))}
                            </select>
                            <Button onClick={() => applyFilters()} className="rounded-xl bg-slate-800 hover:bg-slate-700">
                                Buscar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Pestañas */}
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
                    {[
                        { key: "activos",   label: `En campo (${stats.total_activos ?? 0})` },
                        { key: "historial", label: `Historial (${totalHistorial})` },
                    ].map(({ key, label }) => (
                        <button key={key} onClick={() => handleTabChange(key)}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                                tab === key
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Tabla */}
                <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <div className="border-b bg-slate-50 px-6 py-4">
                        <h2 className="text-sm font-semibold text-slate-800">
                            {tab === "activos" ? "EPP activos en campo" : "Historial de devoluciones y pérdidas"}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {currentData?.meta?.total ?? 0} registros encontrados
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                    {["Trabajador", "Proyecto", "EPP", "Talla", "Motivo", "Entregado", "Devuelto", "Perdido", "Pendiente", "F. Entrega",
                                      ...(tab === "historial" ? ["F. Cierre"] : []),
                                      "Estado",
                                      ...(tab === "activos" ? ["Acción"] : []),
                                    ].map(h => (
                                        <TableHead key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                                            {h}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(currentData?.data ?? []).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={13} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <HardHat className="h-10 w-10 opacity-20" />
                                                <p className="text-sm font-medium">No hay registros para mostrar</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (currentData?.data ?? []).map(c => (
                                    <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                        {/* Trabajador */}
                                        <TableCell>
                                            <div className="flex items-center gap-2 min-w-[160px]">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                    <User className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-slate-800 leading-tight">
                                                        {c.trabajador?.nombre_completo}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{c.trabajador?.codigo_fotocheck}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        {/* Proyecto */}
                                        <TableCell>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                {c.trabajador?.proyecto ?? "—"}
                                            </span>
                                        </TableCell>
                                        {/* EPP */}
                                        <TableCell className="min-w-[140px]">
                                            <p className="font-medium text-sm text-slate-800">{c.epp}</p>
                                            {c.categoria && (
                                                <p className="text-xs text-slate-400">{c.categoria}</p>
                                            )}
                                        </TableCell>
                                        {/* Talla */}
                                        <TableCell className="text-sm text-slate-600">
                                            {c.talla && c.talla !== "ÚNICA" ? (
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-xs font-medium">
                                                    {c.talla}
                                                </span>
                                            ) : "—"}
                                        </TableCell>
                                        {/* Motivo */}
                                        <TableCell>
                                            <span className="text-xs text-slate-500">
                                                {MOTIVO_LABEL[c.motivo_entrega] ?? c.motivo_entrega ?? "—"}
                                            </span>
                                        </TableCell>
                                        {/* Cantidades */}
                                        <TableCell className="text-center">
                                            <span className="font-semibold text-slate-700">{c.cantidad_entregada}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-semibold text-emerald-600">{c.cantidad_devuelta}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-semibold text-red-500">{c.cantidad_perdida}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`font-bold text-base ${c.cantidad_pendiente > 0 ? "text-amber-600" : "text-slate-300"}`}>
                                                {c.cantidad_pendiente}
                                            </span>
                                        </TableCell>
                                        {/* Fechas */}
                                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                                            {c.fecha_entrega ? (
                                                <span className="flex items-center gap-1">
                                                    <CalendarDays className="h-3 w-3" /> {c.fecha_entrega}
                                                </span>
                                            ) : "—"}
                                        </TableCell>
                                        {tab === "historial" && (
                                            <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                                                {c.fecha_cierre ?? "—"}
                                            </TableCell>
                                        )}
                                        {/* Estado */}
                                        <TableCell>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${ESTADO_CUSTODIA[c.estado]?.cls ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                                {c.estado === "ACTIVO" && (
                                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                                )}
                                                {ESTADO_CUSTODIA[c.estado]?.label ?? c.estado}
                                            </span>
                                        </TableCell>
                                        {/* Acción */}
                                        {tab === "activos" && (
                                            <TableCell>
                                                {c.cantidad_pendiente > 0 && (
                                                    <Button size="sm" variant="outline"
                                                        className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50 rounded-lg text-xs"
                                                        onClick={() => setCustodiaDevolver(c)}>
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                        Devolver
                                                    </Button>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <Pagination meta={currentData?.meta} />
                </Card>
            </div>

            <ModalDevolucion
                custodia={custodiaDevolver}
                almacenesSegregacion={almacenesSegregacion}
                onClose={() => setCustodiaDevolver(null)}
            />
        </AdminLayout>
    );
}