// resources/js/Pages/Segregacion/Index.jsx

import { useState, useMemo } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import {
    Search, Trash2, AlertTriangle, CheckCircle2,
    Package, ArrowDownToLine, Plus, X, FileText,
    ChevronLeft, ChevronRight, History, TriangleAlert,
    ShieldX, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOTIVOS_BAJA = [
    { value: "EPP_DETERIORADO",        label: "EPP deteriorado"         },
    { value: "EPP_CONTAMINADO",        label: "EPP contaminado"         },
    { value: "FIN_VIDA_UTIL",          label: "Fin de vida útil"        },
    { value: "DANO_IRREVERSIBLE",      label: "Daño irreversible"       },
    { value: "DISPOSICION_SEGURIDAD",  label: "Disposición por seguridad" },
    { value: "OTRO",                   label: "Otro"                    },
];

const ESTADO_ACTA = {
    BORRADOR:   { label: "Borrador",   cls: "bg-slate-100 text-slate-600 border-slate-200"    },
    CONFIRMADO: { label: "Confirmado", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

// ── Paginación ────────────────────────────────────────────────────────────────

function Pagination({ meta }) {
    if (!meta || meta.last_page <= 1) return null;
    return (
        <div className="flex items-center justify-between border-t px-6 py-4 bg-white">
            <p className="text-sm text-muted-foreground">
                {meta.from ?? 0}–{meta.to ?? 0} de {meta.total ?? 0}
            </p>
            <div className="flex gap-2 items-center">
                <Button size="sm" variant="outline" disabled={!meta.prev_page_url}
                    onClick={() => meta.prev_page_url && router.visit(meta.prev_page_url, { preserveState: true })}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-slate-600 px-1">{meta.current_page} / {meta.last_page}</span>
                <Button size="sm" variant="outline" disabled={!meta.next_page_url}
                    onClick={() => meta.next_page_url && router.visit(meta.next_page_url, { preserveState: true })}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// ── Selector de items para el modal de baja ───────────────────────────────────

function ItemBajaRow({ row, index, stockDisponible, onUpdate, onRemove }) {
    const seleccionado = useMemo(
        () => stockDisponible.find(s => String(s.id) === String(row.stock_almacen_id)),
        [stockDisponible, row.stock_almacen_id]
    );

    // IDs ya usados en otras filas (para evitar duplicados)
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="grid grid-cols-[1fr_90px_32px] gap-2 items-start">
                {/* EPP selector */}
                <div>
                    <select
                        className="w-full border border-slate-200 rounded-lg text-sm h-9 px-3 bg-white focus:ring-2 focus:ring-red-400 focus:outline-none"
                        value={row.stock_almacen_id}
                        onChange={e => onUpdate(index, "stock_almacen_id", e.target.value)}
                        required
                    >
                        <option value="">Seleccionar EPP...</option>
                        {stockDisponible.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.epp}
                                {s.talla && s.talla !== "ÚNICA" ? ` — T: ${s.talla}` : ""}
                                {` (Disp: ${s.cantidad_actual})`}
                            </option>
                        ))}
                    </select>
                    {seleccionado && (
                        <p className="text-xs text-slate-500 mt-0.5 pl-1">
                            Categoría: {seleccionado.categoria ?? "—"} · Disponible: <strong className="text-amber-600">{seleccionado.cantidad_actual}</strong>
                        </p>
                    )}
                </div>
                {/* Cantidad */}
                <div>
                    <Input
                        type="number" min={1} max={seleccionado?.cantidad_actual ?? 1}
                        value={row.cantidad}
                        onChange={e => onUpdate(index, "cantidad", Math.max(1, Number(e.target.value)))}
                        className="h-9 rounded-lg text-center"
                        placeholder="Cant."
                    />
                </div>
                {/* Quitar */}
                {index > 0 && (
                    <button type="button" onClick={() => onRemove(index)}
                        className="h-9 w-9 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors mt-0">
                        <X className="h-3.5 w-3.5 text-red-600" />
                    </button>
                )}
                {index === 0 && <div />}
            </div>
        </div>
    );
}

// ── Modal Baja y Disposición Final ────────────────────────────────────────────

function ModalBajaDefinitiva({ open, onClose, stockSegregacion, almacenSegregacionId }) {
    const emptyItem = () => ({ stock_almacen_id: "", cantidad: 1 });

    const { data, setData, post, processing, errors, reset } = useForm({
        fecha_baja:           new Date().toISOString().slice(0, 16),
        almacen_origen_id:    almacenSegregacionId ?? "",
        acta_numero:          "",
        motivo:               "",
        items:                [emptyItem()],
        observaciones:        "",
        responsable:          "",
        confirmado:           false,
        accion:               "CONFIRMAR", // BORRADOR | CONFIRMAR
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("segregacion.darBajaDefinitiva"), {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    };

    const updateItem = (i, field, val) => {
        const arr = [...data.items];
        arr[i] = { ...arr[i], [field]: val };
        setData("items", arr);
    };
    const addItem    = () => setData("items", [...data.items, emptyItem()]);
    const removeItem = (i) => setData("items", data.items.filter((_, idx) => idx !== i));

    const puedeConfirmar = data.confirmado && data.acta_numero && data.motivo && data.observaciones
        && data.items.every(it => it.stock_almacen_id && it.cantidad > 0);

    return (
        <Dialog open={open} onOpenChange={o => !o && onClose()}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-700 to-red-600 px-6 py-5 flex items-center gap-3 shrink-0">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <ShieldX className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <DialogTitle className="text-white font-bold text-base m-0">
                            Baja y Disposición Final
                        </DialogTitle>
                        <p className="text-red-200 text-xs mt-0.5">Disposición Final de EPP</p>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-5">
                    {/* Aviso */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                        <TriangleAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800 space-y-0.5">
                            <p className="font-semibold">Las bajas solo pueden realizarse desde el almacén de Segregación.</p>
                            <p className="text-amber-700">Asegúrese de documentar correctamente con su respectiva acta de baja.</p>
                        </div>
                    </div>

                    <form id="form-baja" onSubmit={handleSubmit} className="space-y-5">
                        {/* Grid fecha + almacén */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                    Fecha de baja *
                                </Label>
                                <Input
                                    type="datetime-local"
                                    value={data.fecha_baja}
                                    onChange={e => setData("fecha_baja", e.target.value)}
                                    className="rounded-xl h-10"
                                    required
                                />
                                {errors.fecha_baja && <p className="text-xs text-red-500">{errors.fecha_baja}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                    Almacén origen *
                                </Label>
                                <div className="h-10 px-3 flex items-center rounded-xl border border-amber-200 bg-amber-50 text-sm font-medium text-amber-800">
                                    🔒 Segregación (Único permitido)
                                </div>
                            </div>
                        </div>

                        {/* Número de acta */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                Número de acta *
                            </Label>
                            <Input
                                value={data.acta_numero}
                                onChange={e => setData("acta_numero", e.target.value.toUpperCase())}
                                placeholder="Ej: ACTA-2026-004"
                                className="rounded-xl h-10 font-mono"
                                required
                            />
                            {errors.acta_numero && <p className="text-xs text-red-500">{errors.acta_numero}</p>}
                        </div>

                        {/* Motivo */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                Motivo de baja *
                            </Label>
                            <select
                                value={data.motivo}
                                onChange={e => setData("motivo", e.target.value)}
                                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                                required
                            >
                                <option value="">Seleccionar motivo...</option>
                                {MOTIVOS_BAJA.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            {errors.motivo && <p className="text-xs text-red-500">{errors.motivo}</p>}
                        </div>

                        {/* Items */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                    Items de EPP para baja *
                                </Label>
                                <span className="text-xs text-slate-400">
                                    Solo EPP en Segregación
                                </span>
                            </div>

                            {stockSegregacion.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400">
                                    <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No hay EPP disponibles en segregación.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {data.items.map((row, i) => (
                                        <ItemBajaRow
                                            key={i}
                                            row={row}
                                            index={i}
                                            stockDisponible={stockSegregacion}
                                            onUpdate={updateItem}
                                            onRemove={removeItem}
                                        />
                                    ))}
                                    <button type="button" onClick={addItem}
                                        className="flex items-center gap-2 text-red-600 text-sm font-semibold hover:text-red-800 transition-colors py-1">
                                        <Plus size={14} /> Añadir otro item
                                    </button>
                                </div>
                            )}
                            {errors.items && <p className="text-xs text-red-500">{errors.items}</p>}
                        </div>

                        {/* Observaciones */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                Observaciones *
                            </Label>
                            <textarea
                                rows={3}
                                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                                placeholder="Describa en detalle el motivo de la baja, estado de los EPP, método de disposición final, etc..."
                                value={data.observaciones}
                                onChange={e => setData("observaciones", e.target.value)}
                                required
                            />
                            {errors.observaciones && <p className="text-xs text-red-500">{errors.observaciones}</p>}
                        </div>

                        {/* Responsable */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                Responsable de la baja
                            </Label>
                            <Input
                                value={data.responsable}
                                onChange={e => setData("responsable", e.target.value)}
                                placeholder="Nombre del responsable que autoriza la baja"
                                className="rounded-xl h-10"
                            />
                        </div>

                        {/* Checkbox confirmación */}
                        <button
                            type="button"
                            onClick={() => setData("confirmado", !data.confirmado)}
                            className={`w-full flex items-start gap-3 rounded-xl border-2 p-4 transition-all text-left ${
                                data.confirmado
                                    ? "border-red-400 bg-red-50"
                                    : "border-slate-200 bg-slate-50 hover:border-slate-300"
                            }`}
                        >
                            <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                data.confirmado ? "border-red-600 bg-red-600" : "border-slate-300 bg-white"
                            }`}>
                                {data.confirmado && <CheckCircle2 className="h-3 w-3 text-white" />}
                            </div>
                            <p className={`text-sm font-medium ${data.confirmado ? "text-red-800" : "text-slate-600"}`}>
                                Confirmo que he verificado el estado de los EPP y que esta baja es definitiva
                            </p>
                        </button>

                        {/* Advertencia */}
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                            <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                            <span>
                                Los items dados de baja <strong>no podrán recuperarse</strong> y se eliminarán permanentemente del inventario.
                            </span>
                        </div>
                    </form>
                </div>

                {/* Footer fijo */}
                <div className="px-6 py-4 border-t bg-slate-50 flex gap-2 shrink-0">
                    <Button type="button" variant="outline" onClick={onClose}
                        disabled={processing} className="flex-1 rounded-xl h-10">
                        Cancelar
                    </Button>
                    <Button
                        type="submit" form="form-baja"
                        disabled={processing || !data.acta_numero || !data.motivo || !data.observaciones}
                        onClick={() => setData("accion", "BORRADOR")}
                        variant="outline"
                        className="rounded-xl h-10 border-slate-300 text-slate-700 hover:bg-slate-100"
                    >
                        {processing && data.accion === "BORRADOR" ? "Guardando..." : "Guardar borrador"}
                    </Button>
                    <Button
                        type="submit" form="form-baja"
                        disabled={processing || !puedeConfirmar}
                        onClick={() => setData("accion", "CONFIRMAR")}
                        className="flex-1 rounded-xl h-10 bg-red-600 hover:bg-red-700 text-white border-0"
                        title={!data.confirmado ? "Debes marcar la confirmación" : undefined}
                    >
                        {processing && data.accion === "CONFIRMAR" ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Procesando...
                            </span>
                        ) : "Confirmar baja"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function SegregacionIndex({
    stockSegregacion      = { data: [], links: [], meta: {} },
    historialBajas        = { data: [], meta: {} },
    stats                 = {},
    almacenesSegregacion  = [],
    filters               = {},
}) {
    const { flash = {} } = usePage().props;

    const [tab,          setTab]          = useState(filters.tab ?? "stock");
    const [search,       setSearch]       = useState(filters.search       ?? "");
    const [almacenId,    setAlmacenId]    = useState(filters.almacen_id   ?? "");
    const [estadoStock,  setEstadoStock]  = useState(filters.estado_stock ?? "");
    const [modalBaja,    setModalBaja]    = useState(false);

    // El almacén de segregación por defecto (para el modal)
    const almacenSegDefault = almacenesSegregacion[0]?.id ?? null;

    // Stock con estado DANADO para el modal de baja (solo esos pueden darse de baja)
    const stockParaBaja = useMemo(
        () => (stockSegregacion?.data ?? []).filter(s => s.estado_stock === "DANADO"),
        [stockSegregacion?.data]
    );

    const applyFilters = (params = {}) => {
        router.get(route("segregacion.index"), {
            tab:          params.tab          ?? tab,
            search:       params.search       ?? search,
            almacen_id:   params.almacen_id   ?? almacenId,
            estado_stock: params.estado_stock ?? estadoStock,
        }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setSearch(""); setAlmacenId(""); setEstadoStock("");
        router.get(route("segregacion.index"), { tab }, { preserveState: true, replace: true });
    };

    return (
        <AdminLayout>
            <Head title="Segregación / Baja" />

            <div className="flex-1 space-y-6 bg-slate-50/60 p-6">

                {/* Header */}
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                    <div className="bg-gradient-to-r from-amber-700 to-amber-600 px-6 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white tracking-tight">Segregación / Baja</h1>
                                <p className="text-amber-200 text-sm mt-0.5">EPP dañados y disposición final</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setModalBaja(true)}
                            className="gap-2 bg-red-600 hover:bg-red-700 text-white border-0 rounded-xl shadow-sm"
                        >
                            <ShieldX className="w-4 h-4" />
                            Baja definitiva
                        </Button>
                    </div>
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 flex items-center gap-2 text-sm shadow-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 flex items-center gap-2 text-sm shadow-sm">
                        <AlertTriangle className="h-4 w-4 shrink-0" /> {flash.error}
                    </div>
                )}

                {/* KPIs */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border border-amber-200 bg-amber-50 shadow-sm rounded-2xl">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-amber-600 text-sm font-medium">EPP Dañados</p>
                                <p className="text-4xl font-bold text-amber-700 mt-1">{stats.total_danado ?? 0}</p>
                                <p className="text-amber-500 text-xs mt-1">unidades en segregación</p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center">
                                <AlertTriangle className="h-7 w-7 text-amber-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border border-red-200 bg-red-50 shadow-sm rounded-2xl">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-red-600 text-sm font-medium">Dados de baja</p>
                                <p className="text-4xl font-bold text-red-700 mt-1">{stats.total_baja ?? 0}</p>
                                <p className="text-red-400 text-xs mt-1">baja definitiva histórico</p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center">
                                <Trash2 className="h-7 w-7 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Tipos distintos</p>
                                <p className="text-4xl font-bold text-slate-700 mt-1">{stats.tipos_distintos ?? 0}</p>
                                <p className="text-slate-400 text-xs mt-1">EPP en segregación</p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                                <Package className="h-7 w-7 text-slate-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Pestañas */}
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
                    {[
                        { key: "stock",    label: "Stock en segregación", icon: Package },
                        { key: "historial", label: "Historial de bajas",  icon: History },
                    ].map(({ key, label, icon: Icon }) => (
                        <button key={key} onClick={() => { setTab(key); applyFilters({ tab: key }); }}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                                tab === key
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}>
                            <Icon className="h-4 w-4" /> {label}
                        </button>
                    ))}
                </div>

                {/* Filtros */}
                <Card className="rounded-2xl border border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto_auto]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder={tab === "stock" ? "Buscar por EPP..." : "Buscar por acta o motivo..."}
                                    value={search} onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && applyFilters()}
                                    className="pl-9 rounded-xl" />
                            </div>
                            <select value={almacenId}
                                onChange={e => { setAlmacenId(e.target.value); applyFilters({ almacen_id: e.target.value }); }}
                                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                                <option value="">Todos los almacenes</option>
                                {almacenesSegregacion.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                            </select>
                            {tab === "stock" && (
                                <select value={estadoStock}
                                    onChange={e => { setEstadoStock(e.target.value); applyFilters({ estado_stock: e.target.value }); }}
                                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                                    <option value="">Todos los estados</option>
                                    <option value="DANADO">Dañado</option>
                                    <option value="BAJA">Baja definitiva</option>
                                </select>
                            )}
                            <Button onClick={() => applyFilters()} className="rounded-xl bg-slate-800 hover:bg-slate-700">
                                Buscar
                            </Button>
                            <Button variant="outline" onClick={clearFilters} className="rounded-xl">
                                Limpiar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Tabla STOCK ── */}
                {tab === "stock" && (
                    <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                        <div className="border-b bg-slate-50 px-6 py-4">
                            <h2 className="text-sm font-semibold text-slate-800">Stock en segregación</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">{stockSegregacion?.meta?.total ?? 0} registros</p>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                        {["EPP", "Categoría", "Talla", "Almacén", "Proyecto", "Estado", "Cantidad", "Acción"].map(h => (
                                            <TableHead key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(stockSegregacion?.data ?? []).length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-16 text-center">
                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                    <Package className="h-10 w-10 opacity-20" />
                                                    <p className="text-sm font-medium">No hay EPP en segregación</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (stockSegregacion?.data ?? []).map(s => (
                                        <TableRow key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="font-medium text-slate-800">{s.epp}</TableCell>
                                            <TableCell>
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                                                    {s.categoria ?? "—"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600">
                                                {s.talla && s.talla !== "ÚNICA" ? (
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-xs font-medium">{s.talla}</span>
                                                ) : "—"}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600">{s.almacen}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{s.proyecto ?? "—"}</TableCell>
                                            <TableCell>
                                                {s.estado_stock === "DANADO" ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                        Dañado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                        Baja definitiva
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`text-2xl font-bold ${s.estado_stock === "DANADO" ? "text-amber-600" : "text-red-400"}`}>
                                                    {s.cantidad_actual}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {s.estado_stock === "DANADO" && (
                                                    <Button size="sm" variant="outline"
                                                        className="gap-1.5 text-red-700 border-red-200 hover:bg-red-50 rounded-lg text-xs"
                                                        onClick={() => setModalBaja(true)}>
                                                        <ArrowDownToLine className="h-3.5 w-3.5" />
                                                        Dar de baja
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <Pagination meta={stockSegregacion?.meta} />
                    </Card>
                )}

                {/* ── Tabla HISTORIAL DE BAJAS ── */}
                {tab === "historial" && (
                    <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                        <div className="border-b bg-slate-50 px-6 py-4">
                            <h2 className="text-sm font-semibold text-slate-800">Historial de bajas definitivas</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">{historialBajas?.meta?.total ?? 0} actas registradas</p>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                        {["N° Acta", "Fecha baja", "Motivo", "Almacén", "Responsable", "Observaciones", "Estado", "Registrado por"].map(h => (
                                            <TableHead key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(historialBajas?.data ?? []).length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-16 text-center">
                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                    <ClipboardList className="h-10 w-10 opacity-20" />
                                                    <p className="text-sm font-medium">No hay bajas registradas</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (historialBajas?.data ?? []).map(b => (
                                        <TableRow key={b.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell>
                                                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                                                    {b.acta_numero}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500 whitespace-nowrap">{b.fecha_baja}</TableCell>
                                            <TableCell className="text-sm text-slate-600">
                                                {MOTIVOS_BAJA.find(m => m.value === b.motivo)?.label ?? b.motivo}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500">{b.almacen_nombre ?? "—"}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{b.responsable ?? "—"}</TableCell>
                                            <TableCell className="max-w-[200px]">
                                                <p className="text-xs text-slate-500 truncate" title={b.observaciones}>{b.observaciones ?? "—"}</p>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ESTADO_ACTA[b.estado]?.cls ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                                    {ESTADO_ACTA[b.estado]?.label ?? b.estado}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-400">{b.user_nombre ?? "—"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <Pagination meta={historialBajas?.meta} />
                    </Card>
                )}
            </div>

            {/* Modal Baja Definitiva */}
            <ModalBajaDefinitiva
                open={modalBaja}
                onClose={() => setModalBaja(false)}
                stockSegregacion={stockParaBaja}
                almacenSegregacionId={almacenSegDefault}
            />
        </AdminLayout>
    );
}