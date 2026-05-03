import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import {
    Search, Plus, X, HardHat, Trash2, User, CalendarDays, Eye,
    FileText, UserCheck, Warehouse, ChevronRight, ChevronDown, ChevronUp,
    CheckCircle2, AlertTriangle, Package, TrendingUp, Clock,
} from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOTIVO_LABEL = {
    INICIAL:             "Nuevo ingreso",
    REPOSICION_DESGASTE: "Desgaste",
    REPOSICION_PERDIDA:  "Pérdida",
};

const MOTIVO_COLOR = {
    INICIAL:             "bg-blue-100 text-blue-700 border-blue-200",
    REPOSICION_DESGASTE: "bg-amber-100 text-amber-700 border-amber-200",
    REPOSICION_PERDIDA:  "bg-red-100 text-red-700 border-red-200",
};

const MOTIVO_DOT = {
    INICIAL:             "bg-blue-500",
    REPOSICION_DESGASTE: "bg-amber-500",
    REPOSICION_PERDIDA:  "bg-red-500",
};

const VISIBLE_COUNT = 3;

// ── Modal detalle cambio ──────────────────────────────────────────────────────

function DetalleCambioModal({ cambio, eppNombre, onClose }) {
    if (!cambio) return null;
    return (
        <Dialog open={!!cambio} onOpenChange={open => !open && onClose()}>
            <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="text-xl font-bold">Detalle del cambio</DialogTitle>
                </DialogHeader>
                <div className="px-6 py-5 space-y-4">
                    <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                            <HardHat className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">{eppNombre}</p>
                            {cambio.talla && cambio.talla !== "UNICA" && (
                                <p className="text-xs text-slate-500">Talla: {cambio.talla}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm">
                                <CalendarDays className="w-4 h-4" /> {cambio.fecha}
                            </div>
                        </div>
                    </div>
                    {[
                        { label: "Motivo", value: (
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold border ${MOTIVO_COLOR[cambio.motivo] ?? "bg-slate-100 text-slate-700"}`}>
                                {MOTIVO_LABEL[cambio.motivo] ?? cambio.motivo}
                            </span>
                        )},
                        { label: "Cantidad", value: `${cambio.cantidad} unidad${cambio.cantidad !== 1 ? "es" : ""}` },
                        cambio.observaciones && { label: "Observaciones", value: cambio.observaciones, icon: FileText },
                        cambio.registrado_por && { label: "Registrado por", value: cambio.registrado_por, icon: UserCheck },
                    ].filter(Boolean).map(({ label, value, icon: Icon }) => (
                        <div key={label} className="space-y-1">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                {Icon && <Icon className="w-3.5 h-3.5" />} {label}
                            </p>
                            <div className="bg-slate-50 border rounded-xl px-4 py-3 text-sm">{value}</div>
                        </div>
                    ))}
                </div>
                <DialogFooter className="px-6 py-4 border-t bg-slate-50">
                    <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Fila EPP en modal ─────────────────────────────────────────────────────────

function EppRow({ row, index, eppItemsDisponibles, almacenOrigenId, onUpdate, onRemove, errors }) {
    const eppItem = useMemo(
        () => eppItemsDisponibles.find(e => String(e.epp_item_id) === String(row.epp_item_id)),
        [eppItemsDisponibles, row.epp_item_id]
    );
    const skuSeleccionado = useMemo(
        () => eppItem?.skus.find(s => String(s.sku_id) === String(row.epp_sku_id)),
        [eppItem, row.epp_sku_id]
    );
    const stockEnAlmacen = useMemo(() => {
        if (!skuSeleccionado || !almacenOrigenId) return null;
        return skuSeleccionado.stocks.find(
            s => String(s.almacen_id) === String(almacenOrigenId)
        )?.cantidad_actual ?? 0;
    }, [skuSeleccionado, almacenOrigenId]);

    return (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Paso 1 — EPP</label>
                <select
                    className="mt-1 w-full border border-gray-200 rounded-lg text-sm h-10 px-3 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={row.epp_item_id}
                    onChange={e => onUpdate(index, "epp_item_id", e.target.value)}
                    required
                >
                    <option value="">Seleccione EPP...</option>
                    {eppItemsDisponibles.map(item => (
                        <option key={item.epp_item_id} value={item.epp_item_id}>
                            {item.nombre}{item.categoria ? ` (${item.categoria})` : ""}
                        </option>
                    ))}
                </select>
                {errors[`items.${index}.epp_sku_id`] && (
                    <p className="text-xs text-red-500 mt-1">{errors[`items.${index}.epp_sku_id`]}</p>
                )}
            </div>

            {row.epp_item_id && (
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Paso 2 — Talla</label>
                    {eppItem?.usa_tallas ? (
                        <select
                            className="mt-1 w-full border border-gray-200 rounded-lg text-sm h-10 px-3 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={row.epp_sku_id}
                            onChange={e => onUpdate(index, "epp_sku_id", e.target.value)}
                            required
                        >
                            <option value="">Seleccione talla...</option>
                            {eppItem.skus.map(sku => (
                                <option key={sku.sku_id} value={sku.sku_id}>
                                    {sku.talla_nombre} — stock: {sku.stock_total}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="mt-1 h-10 px-3 flex items-center rounded-lg border border-gray-100 bg-gray-100 text-sm text-gray-400 font-medium cursor-not-allowed">
                            Talla Única (automático)
                        </div>
                    )}
                </div>
            )}

            {row.epp_sku_id && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Cantidad</label>
                        <input
                            type="number" min={1} max={stockEnAlmacen ?? undefined}
                            className="mt-1 w-full border border-gray-200 rounded-lg text-sm h-10 px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={row.cantidad}
                            onChange={e => onUpdate(index, "cantidad", Number(e.target.value))}
                        />
                        {stockEnAlmacen !== null && (
                            <p className={`text-xs mt-1 font-medium ${stockEnAlmacen === 0 ? "text-red-500" : stockEnAlmacen <= 3 ? "text-amber-500" : "text-emerald-600"}`}>
                                {stockEnAlmacen === 0 ? "⚠ Sin stock" : `Disponible: ${stockEnAlmacen}`}
                            </p>
                        )}
                        {errors[`items.${index}.cantidad`] && (
                            <p className="text-xs text-red-500 mt-1">{errors[`items.${index}.cantidad`]}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Motivo</label>
                        <select
                            className="mt-1 w-full border border-gray-200 rounded-lg text-sm h-10 px-3 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={row.motivo_entrega}
                            onChange={e => onUpdate(index, "motivo_entrega", e.target.value)}
                        >
                            <option value="INICIAL">Nuevo ingreso</option>
                            <option value="REPOSICION_DESGASTE">Desgaste</option>
                            <option value="REPOSICION_PERDIDA">Pérdida</option>
                        </select>
                    </div>
                </div>
            )}

            {index > 0 && (
                <button type="button" onClick={() => onRemove(index)}
                    className="flex items-center gap-1 text-sm text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={14} /> Quitar
                </button>
            )}
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function EntregasIndex({
    trabajador           = null,
    candidatos           = [],
    eppItemsDisponibles  = [],
    historial            = [],
    years                = [],
    filters              = {},
}) {
    const { flash = {} }  = usePage().props;
    const currentYear     = new Date().getFullYear().toString();

    const [searchTerm,      setSearchTerm]      = useState(filters.search || "");
    const [selectedYear,    setSelectedYear]    = useState(String(filters.year || currentYear));
    const [showModal,       setShowModal]       = useState(false);
    const [detalleCambio,   setDetalleCambio]   = useState(null);
    const [detalleEpp,      setDetalleEpp]      = useState("");
    const [expandedGroups,  setExpandedGroups]  = useState({});

    // ── Stats del historial ───────────────────────────────────────────────────
    const historialStats = useMemo(() => {
        if (!historial.length) return null;
        const totalUnidades  = historial.reduce((s, g) => s + g.total, 0);
        const totalEpps      = historial.length;
        const ultimaFecha    = historial
            .flatMap(g => g.cambios)
            .map(c => c.fecha)
            .sort()
            .at(-1) ?? "—";
        return { totalUnidades, totalEpps, ultimaFecha };
    }, [historial]);

    // ── Expand / collapse por grupo ───────────────────────────────────────────
    const toggleGroup = useCallback((key) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    // ── Formulario ────────────────────────────────────────────────────────────
    const emptyRow = useCallback(() => ({
        epp_item_id: "", epp_sku_id: "", cantidad: 1, motivo_entrega: "INICIAL",
    }), []);

    const { data, setData, post, processing, reset, errors } = useForm({
        trabajador_id:     trabajador?.id        || "",
        almacen_origen_id: trabajador?.almacen_id || "",
        observaciones:     "",
        items:             [emptyRow()],
    });

    useEffect(() => {
        if (trabajador) {
            setData(prev => ({
                ...prev,
                trabajador_id:     trabajador.id,
                almacen_origen_id: trabajador.almacen_id || "",
            }));
        }
    }, [trabajador?.id]);

    const updateItemCompat = useCallback((index, field, value) => {
        const arr = [...data.items];
        arr[index] = { ...arr[index], [field]: value };
        if (field === "epp_item_id") {
            arr[index].epp_sku_id = "";
            const eppItem = eppItemsDisponibles.find(
                e => String(e.epp_item_id) === String(value)
            );
            if (eppItem && !eppItem.usa_tallas && eppItem.skus.length > 0) {
                arr[index].epp_sku_id = String(eppItem.skus[0].sku_id);
            }
        }
        setData("items", arr);
    }, [data.items, eppItemsDisponibles, setData]);

    const addRow    = useCallback(() => setData("items", [...data.items, emptyRow()]), [data.items, emptyRow]);
    const removeRow = useCallback((i) => setData("items", data.items.filter((_, idx) => idx !== i)), [data.items]);

    const handleBuscar  = useCallback(() =>
        router.get(route("entregas.index"), { search: searchTerm, year: selectedYear },
            { preserveState: true, replace: true }), [searchTerm, selectedYear]);

    const handleLimpiar = useCallback(() => {
        setSearchTerm(""); setSelectedYear(currentYear);
        router.get(route("entregas.index"), {}, { replace: true });
    }, [currentYear]);

    const selectCandidato = useCallback((c) =>
        router.get(route("entregas.index"),
            { search: c.codigo_fotocheck, year: selectedYear },
            { preserveState: true, replace: true }
        ), [selectedYear]);

    const handleSave = useCallback((e) => {
        e.preventDefault();
        post(route("entregas.store"), {
            onSuccess: () => { setShowModal(false); reset(); },
            onError:   () => setShowModal(true),
        });
    }, [post, reset]);

    const closeModal = useCallback(() => { setShowModal(false); reset(); }, [reset]);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <Head title="Entregas de EPP" />

            <div className="flex-1 overflow-auto bg-slate-50/60">

                {/* Header */}
                <div className="bg-white border-b px-6 lg:px-10 py-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Entregas de EPP</h2>
                        <p className="text-slate-500 mt-0.5 text-sm">Historial de asignaciones por trabajador</p>
                    </div>
                    <Button onClick={() => setShowModal(true)}
                        className="gap-2 bg-blue-600 hover:bg-blue-700 shrink-0 shadow">
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Nueva entrega</span>
                        <span className="sm:hidden">Nueva</span>
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

                    {/* Layout principal: sidebar izquierdo + historial derecho */}
                    <div className="flex flex-col xl:flex-row gap-6">

                        {/* ── Columna izquierda: búsqueda + trabajador ── */}
                        <div className="xl:w-80 shrink-0 space-y-4">

                            {/* Búsqueda */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-700 mb-3">Buscar trabajador</h3>
                                <p className="text-xs text-slate-400 mb-3">
                                    Por fotocheck (exacto) o nombre/apellido (parcial)
                                </p>
                                <div className="relative mb-3">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && handleBuscar()}
                                        placeholder="Ej: GC0289 ó Castrejón"
                                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedYear}
                                        onChange={e => setSelectedYear(e.target.value)}
                                        className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <button onClick={handleBuscar}
                                        className="bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-semibold text-sm flex items-center gap-1.5">
                                        <Search className="w-3.5 h-3.5" /> Buscar
                                    </button>
                                </div>
                                {searchTerm && (
                                    <button onClick={handleLimpiar}
                                        className="w-full mt-2 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors">
                                        Limpiar búsqueda
                                    </button>
                                )}
                            </div>

                            {/* Lista de candidatos */}
                            {candidatos.length > 0 && !trabajador && (
                                <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                                        <p className="font-bold text-slate-800 text-sm">
                                            {candidatos.length} resultado{candidatos.length !== 1 ? "s" : ""}
                                        </p>
                                        <p className="text-xs text-slate-500">Selecciona uno</p>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {candidatos.map(c => (
                                            <button key={c.id} onClick={() => selectCandidato(c)}
                                                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 group">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                    {c.nombres?.[0]}{c.apellidos?.[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-900 text-sm truncate">
                                                        {c.nombres} {c.apellidos}
                                                    </p>
                                                    <p className="text-xs text-slate-400 truncate">
                                                        {c.codigo_fotocheck} · {c.proyecto}
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tarjeta trabajador */}
                            {trabajador && (
                                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg shrink-0">
                                            {trabajador.nombres?.[0]}{trabajador.apellidos?.[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-white text-base leading-tight truncate">
                                                {trabajador.nombres} {trabajador.apellidos}
                                            </p>
                                            <p className="text-blue-200 text-xs mt-0.5">
                                                {trabajador.cargo_laboral?.nombre ?? "Sin cargo"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-blue-100">
                                            <span className="font-mono text-xs bg-white/10 px-2 py-1 rounded-lg font-bold">
                                                {trabajador.codigo_fotocheck}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-blue-100 text-xs">
                                            <span>📁</span>
                                            <span>{trabajador.proyecto?.nombre ?? "Sin proyecto"}</span>
                                        </div>
                                        {trabajador.almacen_nombre && (
                                            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 mt-2">
                                                <Warehouse className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                                                <div>
                                                    <p className="text-[10px] text-blue-300 uppercase tracking-wide font-semibold">
                                                        Almacén de entrega
                                                    </p>
                                                    <p className="text-white text-xs font-bold">
                                                        {trabajador.almacen_nombre}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* KPIs del historial */}
                            {historialStats && (
                                <div className="grid grid-cols-3 xl:grid-cols-1 gap-3">
                                    {[
                                        {
                                            icon: Package,
                                            label: "Unidades entregadas",
                                            value: historialStats.totalUnidades,
                                            color: "text-blue-600",
                                            bg: "bg-blue-50",
                                        },
                                        {
                                            icon: HardHat,
                                            label: "Tipos de EPP",
                                            value: historialStats.totalEpps,
                                            color: "text-emerald-600",
                                            bg: "bg-emerald-50",
                                        },
                                        {
                                            icon: Clock,
                                            label: "Última entrega",
                                            value: historialStats.ultimaFecha,
                                            color: "text-slate-700",
                                            bg: "bg-slate-50",
                                            small: true,
                                        },
                                    ].map(({ icon: Icon, label, value, color, bg, small }) => (
                                        <div key={label} className={`${bg} rounded-xl p-3 xl:p-4 border border-white`}>
                                            <div className="flex items-center gap-2 xl:gap-3">
                                                <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0`}>
                                                    <Icon className={`w-4 h-4 ${color}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide leading-tight">
                                                        {label}
                                                    </p>
                                                    <p className={`${small ? "text-sm" : "text-xl"} font-bold ${color} truncate`}>
                                                        {value}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Columna derecha: historial ── */}
                        <div className="flex-1 min-w-0">

                            {/* Estado vacío */}
                            {!trabajador && candidatos.length === 0 && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 h-full flex flex-col items-center justify-center min-h-[400px]">
                                    <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                        <HardHat className="w-10 h-10 opacity-30" />
                                    </div>
                                    <p className="font-semibold text-slate-500 text-lg">Sin trabajador seleccionado</p>
                                    <p className="text-sm mt-2 max-w-xs">
                                        Busca por código de fotocheck o nombre para ver el historial de entregas
                                    </p>
                                </div>
                            )}

                            {/* Historial */}
                            {trabajador && (
                                <div className="space-y-4">
                                    {/* Header del historial */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">
                                                Historial — {selectedYear}
                                            </h3>
                                            <p className="text-sm text-slate-500 mt-0.5">
                                                {historial.length > 0
                                                    ? `${historial.length} tipo${historial.length !== 1 ? "s" : ""} de EPP entregado${historial.length !== 1 ? "s" : ""}`
                                                    : "Sin entregas registradas este año"}
                                            </p>
                                        </div>
                                    </div>

                                    {historial.length === 0 && (
                                        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                                            <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                            <p className="font-medium">No hay entregas en {selectedYear}</p>
                                        </div>
                                    )}

                                    {/* Tarjetas por EPP */}
                                    {historial.map((grupo, i) => {
                                        const isExpanded  = !!expandedGroups[grupo.epp];
                                        const visible     = isExpanded
                                            ? grupo.cambios
                                            : grupo.cambios.slice(0, VISIBLE_COUNT);
                                        const hiddenCount = grupo.cambios.length - VISIBLE_COUNT;

                                        return (
                                            <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

                                                {/* Header tarjeta */}
                                                <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                                        <HardHat className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-slate-900 truncate">{grupo.epp}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {grupo.cambios.length} entrega{grupo.cambios.length !== 1 ? "s" : ""} registrada{grupo.cambios.length !== 1 ? "s" : ""}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-sm font-black text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-1">
                                                            {grupo.total} {grupo.total === 1 ? "unidad" : "unidades"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Cabecera de columnas */}
                                                <div className="hidden sm:grid grid-cols-[120px_1fr_140px_60px_36px] gap-3 px-5 py-2 bg-slate-50/50 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                                    <span>Fecha</span>
                                                    <span>Motivo</span>
                                                    <span>Registrado por</span>
                                                    <span className="text-center">Cant.</span>
                                                    <span></span>
                                                </div>

                                                {/* Filas de cambios */}
                                                <div className="divide-y divide-slate-50">
                                                    {visible.map((cambio, j) => (
                                                        <button
                                                            key={j}
                                                            onClick={() => { setDetalleCambio(cambio); setDetalleEpp(grupo.epp); }}
                                                            className="w-full text-left px-5 py-3.5 hover:bg-blue-50/60 transition-colors group
                                                                       flex flex-wrap sm:grid sm:grid-cols-[120px_1fr_140px_60px_36px] sm:gap-3 items-center gap-2"
                                                        >
                                                            {/* Fecha */}
                                                            <div className="flex items-center gap-1.5 text-slate-600 text-sm shrink-0">
                                                                <div className={`w-2 h-2 rounded-full ${MOTIVO_DOT[cambio.motivo] ?? "bg-slate-400"} shrink-0`} />
                                                                {cambio.fecha}
                                                            </div>

                                                            {/* Motivo + talla */}
                                                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${MOTIVO_COLOR[cambio.motivo] ?? "bg-slate-100 text-slate-700"}`}>
                                                                    {MOTIVO_LABEL[cambio.motivo] ?? cambio.motivo}
                                                                </span>
                                                                {cambio.talla && cambio.talla !== "UNICA" && (
                                                                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg font-medium">
                                                                        Talla {cambio.talla}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Registrado por */}
                                                            <span className="hidden sm:block text-xs text-slate-400 truncate">
                                                                {cambio.registrado_por ?? "—"}
                                                            </span>

                                                            {/* Cantidad */}
                                                            <span className="text-sm font-bold text-slate-700 sm:text-center">
                                                                {cambio.cantidad}
                                                            </span>

                                                            {/* Acción */}
                                                            <div className="ml-auto sm:ml-0 flex justify-center">
                                                                <Eye className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Ver más / Ver menos */}
                                                {grupo.cambios.length > VISIBLE_COUNT && (
                                                    <button
                                                        onClick={() => toggleGroup(grupo.epp)}
                                                        className="w-full py-3 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50 border-t border-slate-100 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        {isExpanded ? (
                                                            <><ChevronUp className="w-4 h-4" /> Ver menos</>
                                                        ) : (
                                                            <><ChevronDown className="w-4 h-4" /> Ver {hiddenCount} cambio{hiddenCount !== 1 ? "s" : ""} más</>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Modal Nueva Entrega ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                        <div className="p-5 sm:p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-3xl sm:rounded-t-2xl shrink-0">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <HardHat className="text-blue-600 w-5 h-5" /> Nueva Entrega
                            </h3>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                            {!trabajador && (
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm mb-4">
                                    Primero busca un trabajador para registrar una entrega.
                                </div>
                            )}

                            {trabajador && (
                                <>
                                    <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3">
                                        <div className="flex-1">
                                            <p className="font-semibold text-blue-800">
                                                {trabajador.nombres} {trabajador.apellidos}
                                            </p>
                                            <p className="text-sm text-blue-600">Fotocheck: {trabajador.codigo_fotocheck}</p>
                                        </div>
                                        {trabajador.almacen_nombre && (
                                            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 shrink-0">
                                                <Warehouse className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <div>
                                                    <p className="text-[10px] text-emerald-600 font-semibold uppercase">Almacén</p>
                                                    <p className="text-sm font-bold text-emerald-800">{trabajador.almacen_nombre}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <form onSubmit={handleSave} className="space-y-4">
                                        <div className="space-y-3">
                                            {data.items.map((row, index) => (
                                                <EppRow
                                                    key={index}
                                                    row={row}
                                                    index={index}
                                                    eppItemsDisponibles={eppItemsDisponibles}
                                                    almacenOrigenId={data.almacen_origen_id}
                                                    onUpdate={updateItemCompat}
                                                    onRemove={removeRow}
                                                    errors={errors}
                                                />
                                            ))}
                                            <button type="button" onClick={addRow}
                                                className="flex items-center gap-2 text-blue-600 text-sm font-bold hover:text-blue-800 transition-colors py-1">
                                                <Plus size={15} /> Añadir otro EPP
                                            </button>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                                                Observaciones
                                            </label>
                                            <textarea rows={2}
                                                className="mt-1 w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                                value={data.observaciones}
                                                onChange={e => setData("observaciones", e.target.value)}
                                                placeholder="Opcional..." />
                                        </div>

                                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                                            <button type="button" onClick={closeModal}
                                                className="order-2 sm:order-1 px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors">
                                                Cancelar
                                            </button>
                                            <button type="submit"
                                                disabled={processing || !data.almacen_origen_id}
                                                className="order-1 sm:order-2 px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                                {processing ? "Procesando..." : "Confirmar entrega"}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal detalle */}
            <DetalleCambioModal
                cambio={detalleCambio}
                eppNombre={detalleEpp}
                onClose={() => { setDetalleCambio(null); setDetalleEpp(""); }}
            />
        </AdminLayout>
    );
}