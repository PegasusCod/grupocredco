import { useCallback, useRef, useState, useEffect } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import {
    Calendar, Package, Plus, Search, TrendingUp, User, X,
    ChevronDown, ChevronUp, CheckCircle2, AlertTriangle,
    ArrowRight, HardHat, FileText, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (v) => {
    if (!v) return "—";
    const [y, m, d] = String(v).slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
};

// ── Fila de talla compacta ────────────────────────────────────────────────────

function TallaRow({ fila, filaIndex, grupoIndex, epItem, almacenId, onUpdate, onRemove, canRemove }) {
    // NUEVO: stock actual del SKU en el almacén seleccionado
    const stockActual = (() => {
        if (!fila.epp_sku_id || !almacenId) return null;
        const sku = epItem.skus.find(s => String(s.id) === String(fila.epp_sku_id));
        if (!sku) return null;
        return sku.stocks.find(s => String(s.almacen_id) === String(almacenId))?.cantidad_actual ?? 0;
    })();

    return (
        <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg px-3 py-2.5">
            {/* Selector de talla */}
            <div className="flex-1 min-w-0">
                {epItem.usa_tallas ? (
                    <select
                        value={fila.epp_sku_id}
                        onChange={e => onUpdate(grupoIndex, filaIndex, "epp_sku_id", e.target.value)}
                        className="w-full h-8 rounded-md border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                    >
                        <option value="">Seleccione talla...</option>
                        {epItem.skus.map(s => {
                            const st = almacenId
                                ? (s.stocks.find(x => String(x.almacen_id) === String(almacenId))?.cantidad_actual ?? 0)
                                : null;
                            return (
                                <option key={s.id} value={s.id}>
                                    {s.talla_nombre} ({s.talla_codigo}){st !== null ? ` — stock: ${st}` : ""}
                                </option>
                            );
                        })}
                    </select>
                ) : (
                    <div className="h-8 flex items-center rounded-md border border-slate-100 bg-slate-50 px-2 text-xs text-slate-400 font-medium">
                        Talla Única
                    </div>
                )}
            </div>

            {/* Indicador de stock actual */}
            {stockActual !== null && (
                <div className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-md ${
                    stockActual === 0
                        ? "bg-red-50 text-red-500 border border-red-100"
                        : stockActual <= 5
                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                        : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                }`}>
                    Stock: {stockActual}
                </div>
            )}

            {/* Cantidad */}
            <div className="w-16 shrink-0">
                <Input
                    type="number" min={1}
                    value={fila.cantidad}
                    onChange={e => onUpdate(grupoIndex, filaIndex, "cantidad", Number(e.target.value))}
                    className="h-8 text-center text-xs font-bold px-1"
                    required
                />
            </div>

            {/* Quitar */}
            {canRemove && (
                <button
                    type="button"
                    onClick={() => onRemove(grupoIndex, filaIndex)}
                    className="h-7 w-7 flex items-center justify-center rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                >
                    <X size={13} />
                </button>
            )}
        </div>
    );
}

// ── Grupo de EPP ──────────────────────────────────────────────────────────────

function GrupoEpp({
    grupo, grupoIndex, items, almacenId,
    onUpdateEpp, onUpdateFila, onAddFila, onRemoveFila, onRemoveGrupo,
    canRemove, lastFilaRef,
}) {
    const selectedItem = items.find(i => String(i.id) === String(grupo.epp_item_id));

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 overflow-hidden">
            {/* Header compacto */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100/70 border-b border-slate-200">
                <HardHat className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-600">EPP #{grupoIndex + 1}</span>
                {selectedItem && (
                    <span className="text-xs text-slate-400 truncate flex-1">— {selectedItem.nombre}</span>
                )}
                {canRemove && (
                    <button type="button" onClick={() => onRemoveGrupo(grupoIndex)}
                        className="ml-auto text-red-400 hover:text-red-600 shrink-0">
                        <X size={14} />
                    </button>
                )}
            </div>

            <div className="p-3 space-y-2.5">
                {/* Selector de EPP compacto */}
                <select
                    value={grupo.epp_item_id}
                    onChange={e => onUpdateEpp(grupoIndex, e.target.value)}
                    className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                >
                    <option value="">Seleccione un EPP...</option>
                    {items.map(item => (
                        <option key={item.id} value={item.id}>{item.nombre}</option>
                    ))}
                </select>

                {/* Tallas */}
                {selectedItem && (
                    <div className="space-y-1.5">
                        {/* Cabecera de columnas */}
                        <div className="flex items-center gap-2 px-1">
                            <span className="flex-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                {selectedItem.usa_tallas ? "Talla" : "Presentación"}
                            </span>
                            {almacenId && (
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                    Stock
                                </span>
                            )}
                            <span className="w-16 text-[10px] font-bold text-slate-400 uppercase tracking-wide text-center">
                                Cant.
                            </span>
                            <span className="w-7" />
                        </div>

                        {/* Filas de tallas */}
                        {grupo.filas.map((fila, fi) => (
                            <div
                                key={fi}
                                ref={fi === grupo.filas.length - 1 ? lastFilaRef : null}
                            >
                                <TallaRow
                                    fila={fila}
                                    filaIndex={fi}
                                    grupoIndex={grupoIndex}
                                    epItem={selectedItem}
                                    almacenId={almacenId}
                                    onUpdate={onUpdateFila}
                                    onRemove={onRemoveFila}
                                    canRemove={grupo.filas.length > 1}
                                />
                            </div>
                        ))}

                        {/* Añadir talla — solo si usa tallas */}
                        {selectedItem.usa_tallas && (
                            <button
                                type="button"
                                onClick={() => onAddFila(grupoIndex)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors pl-1 pt-0.5"
                            >
                                <Plus size={12} /> Añadir talla
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Fila del historial (expandible) ──────────────────────────────────────────

function IngresoRow({ ing }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="border border-slate-100 rounded-xl overflow-hidden bg-white hover:border-slate-200 transition-colors">
            {/* Fila resumen */}
            <button
                onClick={() => setExpanded(p => !p)}
                className="w-full text-left px-4 sm:px-5 py-3.5 hover:bg-slate-50/80 transition-colors"
            >
                <div className="flex items-center gap-3 flex-wrap">

                    {/* Fecha */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">{formatDate(ing.fecha)}</span>
                    </div>

                    {/* Guía */}
                    <span className="font-mono text-[11px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md font-bold shrink-0">
                        {ing.guia ?? "S/N"}
                    </span>

                    {/* EPPs resumidos */}
                    <div className="flex-1 min-w-0 hidden sm:block">
                        <p className="text-xs text-slate-500 truncate">
                            {ing.detalles.map(d =>
                                d.talla && d.talla !== "UNICA"
                                    ? `${d.epp_nombre} T.${d.talla}`
                                    : d.epp_nombre
                            ).join(" · ")}
                        </p>
                    </div>

                    {/* Total */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                            <TrendingUp className="w-3 h-3" />
                            +{ing.total_unidades} und.
                        </span>
                    </div>

                    {/* Almacén */}
                    <span className="hidden lg:block text-xs text-slate-400 shrink-0 max-w-[120px] truncate">
                        {ing.almacen ?? "—"}
                    </span>

                    {/* Responsable */}
                    <div className="hidden xl:flex items-center gap-1 text-xs text-slate-400 shrink-0">
                        <User className="w-3 h-3" />
                        {ing.responsable ?? "—"}
                    </div>

                    {/* Toggle */}
                    <div className="ml-auto shrink-0 text-slate-400">
                        {expanded
                            ? <ChevronUp className="w-4 h-4" />
                            : <ChevronDown className="w-4 h-4" />
                        }
                    </div>
                </div>
            </button>

            {/* Detalles expandidos */}
            {expanded && (
                <div className="border-t border-slate-100 bg-slate-50/60 px-4 sm:px-5 py-3 space-y-2">

                    {/* Cabecera detalles */}
                    <div className="grid grid-cols-[1fr_60px_180px_80px] gap-3 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        <span>EPP</span>
                        <span className="text-center">Talla</span>
                        <span className="text-center">Stock anterior → nuevo</span>
                        <span className="text-right">Cant.</span>
                    </div>

                    {ing.detalles.map((det, i) => (
                        <div key={i}
                            className="grid grid-cols-[1fr_60px_180px_80px] gap-3 items-center bg-white border border-slate-100 rounded-lg px-3 py-2.5">

                            {/* EPP nombre */}
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                                    <HardHat className="w-3.5 h-3.5 text-blue-500" />
                                </div>
                                <span className="text-sm font-medium text-slate-800 truncate">{det.epp_nombre}</span>
                            </div>

                            {/* Talla */}
                            <div className="text-center">
                                {det.talla && det.talla !== "UNICA" ? (
                                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                        {det.talla}
                                    </span>
                                ) : (
                                    <span className="text-xs text-slate-300">—</span>
                                )}
                            </div>

                            {/* Saldo anterior → nuevo (NUEVO) */}
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-sm font-bold text-slate-500 tabular-nums">
                                    {det.saldo_anterior ?? "—"}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="text-sm font-black text-emerald-600 tabular-nums">
                                    {det.saldo_nuevo ?? "—"}
                                </span>
                            </div>

                            {/* Cantidad */}
                            <div className="text-right">
                                <span className="inline-flex items-center text-xs font-black text-emerald-600">
                                    +{det.cantidad}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Observaciones */}
                    {ing.observaciones && (
                        <div className="flex items-start gap-2 pt-1 px-2">
                            <FileText className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-400">{ing.observaciones}</p>
                        </div>
                    )}

                    {/* Info en móvil que no cabe en la fila principal */}
                    <div className="sm:hidden flex flex-wrap gap-x-4 gap-y-1 pt-1 px-2 text-xs text-slate-400">
                        {ing.almacen && <span>📦 {ing.almacen}</span>}
                        {ing.responsable && <span>👤 {ing.responsable}</span>}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function InventarioIndex({
    items    = [],
    ingresos,
    stats,
    filters  = {},
    almacenes = [],
    authUser,
}) {
    const { flash = {} } = usePage().props;
    const [open, setOpen]     = useState(false);
    const [search, setSearch] = useState(filters?.search || "");
    const firstLoad           = useRef(true);

    // Refs para auto-scroll
    const gruposBottomRef = useRef(null);
    const lastFilaRef     = useRef(null);

    // ── Debounce búsqueda ─────────────────────────────────────────────────────
    useEffect(() => {
        if (firstLoad.current) { firstLoad.current = false; return; }
        const timer = setTimeout(() => {
            router.get("/inventario", { search },
                { preserveState: true, preserveScroll: true, replace: true });
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    // ── Formulario ────────────────────────────────────────────────────────────

    const emptyFila  = useCallback(() => ({ epp_sku_id: "", cantidad: 1 }), []);
    const emptyGrupo = useCallback(() => ({ epp_item_id: "", filas: [emptyFila()] }), [emptyFila]);

    const { data, setData, reset, errors } = useForm({
        fecha_ingreso: "",
        numero_guia:   "",
        observaciones: "",
        almacen_id:    "",
        grupos:        [emptyGrupo()],
    });

    const [processing, setProcessing] = useState(false);

    const handleUpdateEpp = useCallback((grupoIdx, itemId) => {
        const item = items.find(i => String(i.id) === String(itemId));
        const arr  = data.grupos.map((g, gi) => {
            if (gi !== grupoIdx) return g;
            return {
                epp_item_id: itemId,
                filas: [{
                    epp_sku_id: (!item?.usa_tallas && item?.skus?.length > 0)
                        ? String(item.skus[0].id)
                        : "",
                    cantidad: 1,
                }],
            };
        });
        setData("grupos", arr);
    }, [data.grupos, items, setData]);

    const handleUpdateFila = useCallback((grupoIdx, filaIdx, field, value) => {
        const arr = data.grupos.map((g, gi) => {
            if (gi !== grupoIdx) return g;
            return { ...g, filas: g.filas.map((f, fi) => fi !== filaIdx ? f : { ...f, [field]: value }) };
        });
        setData("grupos", arr);
    }, [data.grupos, setData]);

    // Añadir talla con auto-scroll
    const handleAddFila = useCallback((grupoIdx) => {
        const arr = data.grupos.map((g, gi) =>
            gi !== grupoIdx ? g : { ...g, filas: [...g.filas, emptyFila()] }
        );
        setData("grupos", arr);
        setTimeout(() => lastFilaRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
    }, [data.grupos, emptyFila, setData]);

    const handleRemoveFila = useCallback((grupoIdx, filaIdx) => {
        const arr = data.grupos.map((g, gi) =>
            gi !== grupoIdx ? g : { ...g, filas: g.filas.filter((_, fi) => fi !== filaIdx) }
        );
        setData("grupos", arr);
    }, [data.grupos, setData]);

    // Añadir grupo con auto-scroll
    const handleAddGrupo = useCallback(() => {
        setData("grupos", [...data.grupos, emptyGrupo()]);
        setTimeout(() => gruposBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
    }, [data.grupos, emptyGrupo, setData]);

    const handleRemoveGrupo = useCallback((grupoIdx) => {
        if (data.grupos.length === 1) return;
        setData("grupos", data.grupos.filter((_, gi) => gi !== grupoIdx));
    }, [data.grupos, setData]);

    // Submit
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        const detalles = data.grupos.flatMap(g =>
            g.filas
                .filter(f => f.epp_sku_id && f.cantidad > 0)
                .map(f => ({ epp_sku_id: f.epp_sku_id, cantidad: f.cantidad }))
        );
        if (detalles.length === 0) {
            alert("Selecciona al menos un EPP con talla y cantidad.");
            return;
        }
        setProcessing(true);
        router.post(route("inventario.store"), {
            fecha_ingreso: data.fecha_ingreso,
            numero_guia:   data.numero_guia,
            observaciones: data.observaciones,
            almacen_id:    data.almacen_id,
            detalles,
        }, {
            preserveScroll: true,
            onSuccess: () => { reset(); setOpen(false); setProcessing(false); },
            onError:   () => setProcessing(false),
        });
    }, [data, reset]);

    const closeModal = useCallback(() => { setOpen(false); reset(); }, [reset]);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <Head title="Ingresos de EPP" />

            <div className="flex-1 overflow-auto bg-slate-50/60">

                {/* Header */}
                <div className="bg-white border-b px-6 lg:px-10 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ingresos de EPP</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Control de guías de remisión · Kardex de entradas</p>
                    </div>
                    <Button onClick={() => setOpen(true)}
                        className="gap-2 bg-slate-900 hover:bg-slate-700 text-white shadow shrink-0">
                        <Plus className="h-4 w-4" /> Registrar Ingreso
                    </Button>
                </div>

                <div className="p-6 lg:p-10 space-y-6">

                    {/* Flash */}
                    {flash.success && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" /> {flash.success}
                        </div>
                    )}
                    {flash.error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" /> {flash.error}
                        </div>
                    )}

                    {/* KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: "Total ingresos",      value: stats?.total_ingresos ?? 0,       sub: "Guías registradas",   icon: Layers,      color: "text-slate-700",   bg: "bg-white",         iconBg: "bg-slate-100" },
                            { label: "Unidades ingresadas", value: stats?.unidades_ingresadas ?? 0,  sub: "EPP en stock total",  icon: TrendingUp,  color: "text-white",       bg: "bg-emerald-600",   iconBg: "bg-white/20", highlight: true },
                            { label: "Último ingreso",      value: stats?.ultimo_ingreso ? formatDate(stats.ultimo_ingreso) : "—", sub: "Fecha más reciente", icon: Calendar, color: "text-blue-700", bg: "bg-white", iconBg: "bg-blue-50", small: true },
                        ].map(({ label, value, sub, icon: Icon, color, bg, iconBg, highlight, small }) => (
                            <Card key={label} className={`rounded-2xl border-0 shadow-sm ${bg}`}>
                                <CardContent className="p-5 flex items-start justify-between gap-4">
                                    <div>
                                        <p className={`text-sm ${highlight ? "text-white/80" : "text-slate-500"}`}>{label}</p>
                                        <p className={`mt-1.5 font-black ${small ? "text-2xl" : "text-3xl"} ${color}`}>{value}</p>
                                        <p className={`mt-1 text-xs ${highlight ? "text-white/60" : "text-slate-400"}`}>{sub}</p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                                        <Icon className={`h-5 w-5 ${highlight ? "text-white" : color}`} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Búsqueda */}
                    <Card className="rounded-2xl border shadow-sm">
                        <CardContent className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar por EPP, N° de guía o responsable..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-9 h-10"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Tabla historial mejorada ── */}
                    <Card className="rounded-2xl border shadow-sm overflow-hidden">

                        {/* Header */}
                        <div className="px-5 sm:px-6 py-4 border-b bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Historial de Ingresos</h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {ingresos?.meta?.total ?? 0} guía{(ingresos?.meta?.total ?? 0) !== 1 ? "s" : ""} registrada{(ingresos?.meta?.total ?? 0) !== 1 ? "s" : ""}
                                    · Expande cada fila para ver el detalle de stock
                                </p>
                            </div>
                        </div>

                        {/* Cabecera de columnas — solo desktop */}
                        <div className="hidden sm:grid grid-cols-[130px_150px_1fr_110px_140px_140px_36px] gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
                            {["Fecha", "N° Guía", "EPP ingresados", "Unidades", "Almacén", "Responsable", ""].map(h => (
                                <span key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{h}</span>
                            ))}
                        </div>

                        {/* Filas */}
                        <div className="px-4 sm:px-5 py-3 space-y-2">
                            {ingresos?.data?.length > 0 ? (
                                ingresos.data.map(ing => <IngresoRow key={ing.id} ing={ing} />)
                            ) : (
                                <div className="py-16 text-center text-slate-400">
                                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="font-semibold">Sin ingresos registrados</p>
                                    <p className="text-sm mt-1">Registra el primer ingreso de EPP al almacén</p>
                                </div>
                            )}
                        </div>

                        {/* Paginación */}
                        {ingresos?.meta && ingresos.meta.last_page > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t px-5 py-4 bg-slate-50/50">
                                <p className="text-sm text-slate-400">
                                    Mostrando {ingresos.meta.from ?? 0}–{ingresos.meta.to ?? 0} de {ingresos.meta.total}
                                </p>
                                <div className="flex items-center gap-2">
                                    {ingresos.meta.prev_page_url
                                        ? <Button variant="outline" size="sm" asChild>
                                            <Link href={ingresos.meta.prev_page_url} preserveScroll>← Anterior</Link>
                                          </Button>
                                        : <Button variant="outline" size="sm" disabled>← Anterior</Button>
                                    }
                                    <span className="text-sm text-slate-500 font-medium">
                                        {ingresos.meta.current_page} / {ingresos.meta.last_page}
                                    </span>
                                    {ingresos.meta.next_page_url
                                        ? <Button variant="outline" size="sm" asChild>
                                            <Link href={ingresos.meta.next_page_url} preserveScroll>Siguiente →</Link>
                                          </Button>
                                        : <Button variant="outline" size="sm" disabled>Siguiente →</Button>
                                    }
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* ── Modal Registrar Ingreso ── */}
            {open && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-xl w-full shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]">

                        {/* Header modal */}
                        <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between shrink-0 rounded-t-3xl sm:rounded-t-2xl">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Registrar Ingreso</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Datos de la guía de remisión</p>
                            </div>
                            <button onClick={closeModal}
                                className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors">
                                <X className="w-3.5 h-3.5 text-slate-600" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 px-5 py-4">
                            <form id="ingreso-form" onSubmit={handleSubmit} className="space-y-4">

                                {/* Campos compactos en grid */}
                                <div className="grid grid-cols-2 gap-3">

                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                            Fecha *
                                        </Label>
                                        <Input type="date" value={data.fecha_ingreso}
                                            onChange={e => setData("fecha_ingreso", e.target.value)}
                                            className="h-9 text-sm" />
                                        {errors.fecha_ingreso && <p className="text-[10px] text-red-500">{errors.fecha_ingreso}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                            N° Guía *
                                        </Label>
                                        <Input placeholder="GR-001-000001" value={data.numero_guia}
                                            onChange={e => setData("numero_guia", e.target.value)}
                                            className="h-9 text-sm font-mono" />
                                        {errors.numero_guia && <p className="text-[10px] text-red-500">{errors.numero_guia}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                            Almacén destino *
                                        </Label>
                                        <select value={data.almacen_id}
                                            onChange={e => setData("almacen_id", e.target.value)}
                                            className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                                            <option value="">Seleccionar...</option>
                                            {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                        </select>
                                        {errors.almacen_id && <p className="text-[10px] text-red-500">{errors.almacen_id}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                            Responsable
                                        </Label>
                                        <div className="h-9 flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-2.5 text-sm text-slate-500">
                                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span className="truncate">{authUser?.name ?? "—"}</span>
                                        </div>
                                    </div>

                                    <div className="col-span-2 space-y-1">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                            Observaciones
                                        </Label>
                                        <Textarea rows={2} placeholder="Opcional..."
                                            value={data.observaciones}
                                            onChange={e => setData("observaciones", e.target.value)}
                                            className="text-sm resize-none" />
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100" />

                                {/* EPP a ingresar */}
                                <div>
                                    <div className="flex items-center justify-between mb-2.5">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800">EPP a ingresar</h3>
                                            <p className="text-[11px] text-slate-400">Selecciona EPP, talla y cantidad</p>
                                        </div>
                                    </div>

                                    {/* Grupos */}
                                    <div className="space-y-2.5">
                                        {data.grupos.map((grupo, gi) => (
                                            <GrupoEpp
                                                key={gi}
                                                grupo={grupo}
                                                grupoIndex={gi}
                                                items={items}
                                                almacenId={data.almacen_id}
                                                onUpdateEpp={handleUpdateEpp}
                                                onUpdateFila={handleUpdateFila}
                                                onAddFila={handleAddFila}
                                                onRemoveFila={handleRemoveFila}
                                                onRemoveGrupo={handleRemoveGrupo}
                                                canRemove={data.grupos.length > 1}
                                                lastFilaRef={gi === data.grupos.length - 1 ? lastFilaRef : null}
                                            />
                                        ))}
                                    </div>

                                    {/* Botón añadir EPP AL PIE de los grupos */}
                                    <button
                                        type="button"
                                        onClick={handleAddGrupo}
                                        className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 border border-dashed border-blue-200 hover:border-blue-400 rounded-xl py-2.5 transition-colors"
                                    >
                                        <Plus size={14} /> Añadir otro EPP
                                    </button>

                                    {/* Anchor para auto-scroll al añadir grupo */}
                                    <div ref={gruposBottomRef} className="h-1" />
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 border-t bg-slate-50 flex justify-end gap-2 shrink-0">
                            <Button type="button" variant="outline" onClick={closeModal} className="px-5 h-9 text-sm">
                                Cancelar
                            </Button>
                            <Button type="submit" form="ingreso-form" disabled={processing}
                                className="px-5 h-9 text-sm bg-slate-900 hover:bg-slate-700 text-white">
                                {processing ? "Guardando..." : "Registrar Ingreso"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}