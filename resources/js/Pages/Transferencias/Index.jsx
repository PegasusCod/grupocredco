// resources/js/Pages/Transferencias/Index.jsx

import { useState, useMemo, useCallback, Fragment } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import {
    Plus, ArrowRight, CheckCircle2, AlertTriangle,
    Package, ChevronDown, ChevronUp, Ban, Warehouse,
    ArrowLeftRight, ShieldAlert, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ESTADO_CONFIG = {
    CONFIRMADO: { label: "Confirmado", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    BORRADOR:   { label: "Borrador",   cls: "bg-slate-100 text-slate-600 border-slate-200" },
    ANULADO:    { label: "Anulado",    cls: "bg-red-100 text-red-700 border-red-200" },
};

// ── Confirm dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({ open, onConfirm, onCancel, title, message, confirmLabel = "Confirmar", danger = false }) {
    return (
        <Dialog open={open} onOpenChange={o => !o && onCancel()}>
            <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
                <div className={`px-6 py-5 flex items-center gap-3 ${danger ? "bg-red-600" : "bg-blue-600"}`}>
                    <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                        {danger ? <ShieldAlert className="h-5 w-5 text-white" /> : <ArrowLeftRight className="h-5 w-5 text-white" />}
                    </div>
                    <DialogTitle className="text-white font-semibold text-base m-0">{title}</DialogTitle>
                </div>
                <div className="px-6 py-5">
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{message}</p>
                </div>
                <DialogFooter className="px-6 pb-5 flex gap-3">
                    <Button variant="outline" onClick={onCancel} className="flex-1 rounded-xl h-10">Cancelar</Button>
                    <Button onClick={onConfirm} className={`flex-1 rounded-xl h-10 border-0 text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── DetalleRow ────────────────────────────────────────────────────────────────
//
// Layout de dos columnas:
//   ORIGEN  →  DESTINO
// El usuario elige explícitamente el EPP de cada lado.
// El auto-match intenta preseleccionar el destino cuando el sku_id coincide.
//
function DetalleRow({
    row, index,
    eppItemsOrigen,      // EPPs con stock > 0 en el almacén origen
    todosEppItems,       // TODOS los EPPs activos del sistema (para selector destino)
    stockPorAlmacen,     // { almacen_id: [{epp_item_id, skus:[{sku_id, stock_disponible, stock_danado}]}] }
    almacenDestinoId,
    almacenDestinoNombre,
    onUpdate, onRemove, canRemove,
}) {
    // ── Origen ────────────────────────────────────────────────────────────────
    const eppItemOrigen = useMemo(
        () => eppItemsOrigen.find(e => String(e.epp_item_id) === String(row.epp_item_id)),
        [eppItemsOrigen, row.epp_item_id]
    );
    const skuOrigen = useMemo(
        () => eppItemOrigen?.skus.find(s => String(s.sku_id) === String(row.epp_sku_id)),
        [eppItemOrigen, row.epp_sku_id]
    );
    const stockOrigenActual = row.estado_stock === "DANADO"
        ? (skuOrigen?.stock_danado ?? 0)
        : (skuOrigen?.stock_disponible ?? 0);

    // ── Destino ───────────────────────────────────────────────────────────────
    const eppItemDestino = useMemo(
        () => todosEppItems.find(e => String(e.epp_item_id) === String(row.dest_epp_item_id)),
        [todosEppItems, row.dest_epp_item_id]
    );
    // Consultar stock actual del SKU destino en stockPorAlmacen
    const stockSkuDestino = useMemo(() => {
        if (!almacenDestinoId || !row.dest_epp_sku_id) return null;
        for (const item of stockPorAlmacen[almacenDestinoId] ?? []) {
            const sku = item.skus.find(s => String(s.sku_id) === String(row.dest_epp_sku_id));
            if (sku) return sku;
        }
        return null;
    }, [stockPorAlmacen, almacenDestinoId, row.dest_epp_sku_id]);

    const stockDestinoActual = row.estado_stock === "DANADO"
        ? (stockSkuDestino?.stock_danado ?? 0)
        : (stockSkuDestino?.stock_disponible ?? 0);

    const skuMismatch = !!(
        row.epp_sku_id && row.dest_epp_sku_id &&
        String(row.epp_sku_id) !== String(row.dest_epp_sku_id)
    );

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">

            {/* Selector EPP origen */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 space-y-3">
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                        EPP a transferir *
                    </label>
                    <select
                        className="mt-1 w-full border border-slate-200 rounded-lg text-sm h-10 px-3 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={row.epp_item_id}
                        onChange={e => onUpdate(index, "epp_item_id", e.target.value)}
                    >
                        <option value="">— Seleccionar EPP del origen —</option>
                        {eppItemsOrigen.map(item => (
                            <option key={item.epp_item_id} value={item.epp_item_id}>
                                {item.nombre}{item.categoria ? ` · ${item.categoria}` : ""}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Talla origen solo si usa tallas */}
                {row.epp_item_id && eppItemOrigen?.usa_tallas && (
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Talla origen</label>
                        <select
                            className="mt-1 w-full border border-slate-200 rounded-lg text-sm h-10 px-3 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={row.epp_sku_id}
                            onChange={e => onUpdate(index, "epp_sku_id", e.target.value)}
                        >
                            <option value="">— Seleccionar talla —</option>
                            {eppItemOrigen.skus.map(sku => (
                                <option key={sku.sku_id} value={sku.sku_id}
                                    disabled={sku.stock_disponible === 0 && sku.stock_danado === 0}>
                                    {sku.talla_nombre} — Disp: {sku.stock_disponible}, Dañado: {sku.stock_danado}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Columnas Origen | → | Destino (visible solo tras seleccionar SKU) */}
            {row.epp_sku_id && (
                <div className="p-4 space-y-4">

                    <div className="grid grid-cols-[1fr,32px,1fr] gap-2 items-start">

                        {/* ── Card ORIGEN ── */}
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-2">
                            <p className="text-xs font-bold text-blue-500 uppercase tracking-wide">Origen</p>
                            <p className="text-sm font-semibold text-slate-700 leading-snug">{eppItemOrigen?.nombre}</p>
                            <p className="text-xs text-slate-400">
                                {eppItemOrigen?.usa_tallas ? (skuOrigen?.talla_nombre ?? "—") : "Talla Única"}
                            </p>
                            <div className="pt-1 border-t border-blue-100">
                                <p className={`text-xl font-bold ${stockOrigenActual === 0 ? "text-red-500" : "text-blue-700"}`}>
                                    {stockOrigenActual}
                                    <span className="text-xs font-normal text-slate-400 ml-1">uds</span>
                                </p>
                                <p className="text-xs text-slate-400">Stock actual</p>
                            </div>
                        </div>

                        {/* Flecha */}
                        <div className="flex items-center justify-center pt-10">
                            <ArrowRight className="h-5 w-5 text-slate-300" />
                        </div>

                        {/* ── Card DESTINO ── */}
                        <div className={`rounded-xl border p-3 space-y-2 ${
                            skuMismatch        ? "border-amber-300 bg-amber-50"
                            : row.dest_epp_sku_id ? "border-emerald-200 bg-emerald-50"
                            : "border-slate-200 bg-slate-50"
                        }`}>
                            <p className={`text-xs font-bold uppercase tracking-wide ${
                                skuMismatch          ? "text-amber-600"
                                : row.dest_epp_sku_id ? "text-emerald-600"
                                : "text-slate-400"
                            }`}>
                                {almacenDestinoNombre ?? "Destino"}
                            </p>

                            {/* Selector EPP destino */}
                            <select
                                className={`w-full border rounded-lg text-xs h-9 px-2 focus:ring-2 focus:outline-none ${
                                    skuMismatch
                                        ? "border-amber-300 bg-white focus:ring-amber-400"
                                        : "border-slate-200 bg-white focus:ring-emerald-400"
                                }`}
                                value={row.dest_epp_item_id}
                                onChange={e => onUpdate(index, "dest_epp_item_id", e.target.value)}
                            >
                                <option value="">— Seleccionar EPP destino —</option>
                                {todosEppItems.map(item => (
                                    <option key={item.epp_item_id} value={item.epp_item_id}>
                                        {item.nombre}
                                    </option>
                                ))}
                            </select>

                            {/* Selector talla destino */}
                            {row.dest_epp_item_id && eppItemDestino?.usa_tallas && (
                                <select
                                    className="w-full border border-slate-200 rounded-lg text-xs h-9 px-2 bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                                    value={row.dest_epp_sku_id}
                                    onChange={e => onUpdate(index, "dest_epp_sku_id", e.target.value)}
                                >
                                    <option value="">— Talla destino —</option>
                                    {eppItemDestino.skus.map(sku => (
                                        <option key={sku.sku_id} value={sku.sku_id}>
                                            {sku.talla_nombre}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {/* Info de stock en destino */}
                            {row.dest_epp_sku_id ? (
                                <div className="pt-1 border-t border-slate-100">
                                    {skuMismatch ? (
                                        <p className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3 shrink-0" />
                                            SKU distinto — verifica que sea el mismo EPP
                                        </p>
                                    ) : (
                                        <>
                                            <p className="text-xl font-bold text-emerald-700">
                                                {stockDestinoActual + (row.cantidad || 0)}
                                                <span className="text-xs font-normal text-slate-400 ml-1">uds</span>
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {stockSkuDestino
                                                    ? `${stockDestinoActual} + ${row.cantidad} uds`
                                                    : `Nuevo registro · ${row.cantidad} uds`}
                                            </p>
                                        </>
                                    )}
                                </div>
                            ) : row.dest_epp_item_id ? (
                                <p className="text-xs text-slate-400 pt-1">Selecciona la talla...</p>
                            ) : (
                                <div className="pt-1">
                                    <p className="text-xl font-bold text-slate-300">—</p>
                                    <p className="text-xs text-slate-400">Sin seleccionar</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cantidad + Estado */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Cantidad *</label>
                            <Input type="number" min={1} max={stockOrigenActual}
                                value={row.cantidad}
                                onChange={e => onUpdate(index, "cantidad", Math.max(1, Number(e.target.value)))}
                                className="mt-1 rounded-lg h-9" />
                            <p className={`text-xs mt-1 font-medium ${
                                stockOrigenActual === 0 ? "text-red-500"
                                    : stockOrigenActual <= 3 ? "text-amber-500"
                                    : "text-emerald-600"
                            }`}>
                                {stockOrigenActual === 0 ? "⚠ Sin stock" : `Máx: ${stockOrigenActual} uds`}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Estado stock</label>
                            <select value={row.estado_stock}
                                onChange={e => onUpdate(index, "estado_stock", e.target.value)}
                                className="mt-1 w-full border border-slate-200 rounded-lg text-sm h-9 px-3 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                <option value="DISPONIBLE">Disponible ({skuOrigen?.stock_disponible ?? 0})</option>
                                {(skuOrigen?.stock_danado ?? 0) > 0 && (
                                    <option value="DANADO">Dañado ({skuOrigen?.stock_danado ?? 0})</option>
                                )}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {canRemove && (
                <div className="px-4 pb-3 border-t border-slate-100 pt-3">
                    <button type="button" onClick={() => onRemove(index)}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 size={12} /> Quitar este EPP
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function TransferenciasIndex({
    transferencias      = { data: [], links: {}, meta: {} },
    stockPorAlmacen     = {},
    eppItemsPorAlmacen  = {},   // EPPs por almacén (incluye 0 stock) para selector destino
    almacenes           = [],
    stats               = {},
    filters             = {},
}) {
    const { flash = {} } = usePage().props;

    const [showModal,    setShowModal]    = useState(false);
    const [expandedId,   setExpandedId]   = useState(null);
    const [estadoFilter, setEstadoFilter] = useState(filters.estado ?? "");
    const [confirmData,  setConfirmData]  = useState(null);

    // ── Formulario ────────────────────────────────────────────────────────────

    const emptyDetalle = () => ({
        epp_item_id:      "",
        epp_sku_id:       "",
        dest_epp_item_id: "",
        dest_epp_sku_id:  "",
        cantidad:         1,
        estado_stock:     "DISPONIBLE",
    });

    const { data, setData, post, processing, errors, reset } = useForm({
        fecha_transferencia: new Date().toISOString().slice(0, 10),
        almacen_origen_id:   "",
        almacen_destino_id:  "",
        motivo:              "",
        observaciones:       "",
        detalles:            [emptyDetalle()],
    });

    const eppItemsOrigen = useMemo(
        () => stockPorAlmacen[data.almacen_origen_id] ?? [],
        [stockPorAlmacen, data.almacen_origen_id]
    );

    // EPPs del almacén destino (con o sin stock) — solo los de ESE almacén
    const eppItemsDestino = useMemo(
        () => eppItemsPorAlmacen[data.almacen_destino_id] ?? [],
        [eppItemsPorAlmacen, data.almacen_destino_id]
    );

    const almacenesDestino = useMemo(
        () => almacenes.filter(a => String(a.id) !== String(data.almacen_origen_id)),
        [almacenes, data.almacen_origen_id]
    );

    const almacenDestinoNombre = useMemo(
        () => almacenes.find(a => String(a.id) === String(data.almacen_destino_id))?.nombre,
        [almacenes, data.almacen_destino_id]
    );

    const addDetalle = useCallback(
        () => setData("detalles", [...data.detalles, emptyDetalle()]),
        [data.detalles]
    );

    const removeDetalle = useCallback(
        (i) => setData("detalles", data.detalles.filter((_, idx) => idx !== i)),
        [data.detalles]
    );

    const updateDetalle = useCallback((i, field, value) => {
        const arr = [...data.detalles];
        arr[i] = { ...arr[i], [field]: value };

        if (field === "epp_item_id") {
            arr[i].epp_sku_id       = "";
            arr[i].dest_epp_item_id = "";
            arr[i].dest_epp_sku_id  = "";
            const item = (stockPorAlmacen[data.almacen_origen_id] ?? [])
                .find(e => String(e.epp_item_id) === String(value));
            if (item && !item.usa_tallas && item.skus.length > 0) {
                arr[i].epp_sku_id = String(item.skus[0].sku_id);
                autoMatchDest(arr[i], String(item.skus[0].sku_id));
            }
        }

        if (field === "epp_sku_id") {
            arr[i].dest_epp_item_id = "";
            arr[i].dest_epp_sku_id  = "";
            if (value) autoMatchDest(arr[i], value);
        }

        if (field === "dest_epp_item_id") {
            arr[i].dest_epp_sku_id = "";
            const destItem = eppItemsDestino.find(e => String(e.epp_item_id) === String(value));
            if (destItem && !destItem.usa_tallas && destItem.skus.length > 0) {
                arr[i].dest_epp_sku_id = String(destItem.skus[0].sku_id);
            }
        }

        setData("detalles", arr);

        function autoMatchDest(row, origenSkuId) {
            const destId = data.almacen_destino_id;
            if (!destId) return;
            // Buscar en eppItemsDestino (EPPs del almacén destino, con o sin stock)
            const destItems = eppItemsPorAlmacen[destId] ?? [];
            for (const dItem of destItems) {
                const s = dItem.skus.find(s => String(s.sku_id) === String(origenSkuId));
                if (s) {
                    row.dest_epp_item_id = String(dItem.epp_item_id);
                    row.dest_epp_sku_id  = String(s.sku_id);
                    return;
                }
            }
            // Sin match exacto por sku_id → el usuario elige manualmente
        }
    }, [data.detalles, data.almacen_origen_id, data.almacen_destino_id,
        stockPorAlmacen, eppItemsPorAlmacen, eppItemsDestino, setData]);

    const handleOrigenChange = (e) => {
        setData(prev => ({
            ...prev,
            almacen_origen_id:  e.target.value,
            almacen_destino_id: "",
            detalles:           [emptyDetalle()],
        }));
    };

    const handleSubmitClick = (e) => {
        e.preventDefault();
        // Validar SKUs origen duplicados
        const skusOrigen = data.detalles.filter(d => d.epp_sku_id).map(d => d.epp_sku_id);
        if (skusOrigen.length !== new Set(skusOrigen).size) {
            alert("Hay EPP duplicados en el formulario. Combínalos en una sola fila.");
            return;
        }
        // Validar EPP destino seleccionado en cada fila
        if (data.detalles.filter(d => d.epp_sku_id && !d.dest_epp_sku_id).length > 0) {
            alert("Selecciona el EPP destino en cada fila antes de continuar.");
            return;
        }
        const origen  = almacenes.find(a => String(a.id) === String(data.almacen_origen_id));
        const destino = almacenes.find(a => String(a.id) === String(data.almacen_destino_id));
        const total   = data.detalles.filter(d => d.epp_sku_id).length;
        setConfirmData({
            type: "transfer",
            message: `¿Confirmas la transferencia de ${total} tipo(s) de EPP desde "${origen?.nombre}" hacia "${destino?.nombre}"?\n\nEsta operación actualizará el stock de ambos almacenes inmediatamente.`,
        });
    };

    const handleConfirmTransfer = () => {
        setConfirmData(null);
        post(route("transferencias.store"), {
            preserveScroll: true,
            onSuccess: () => { reset(); setShowModal(false); },
        });
    };

    const handleAnularClick = (id, origen, destino) => {
        setConfirmData({ type: "anular", id, message: `¿Seguro que deseas anular la transferencia de "${origen}" a "${destino}"?\n\nEl stock se revertirá automáticamente.` });
    };

    const handleConfirmAnular = () => {
        const id = confirmData.id;
        setConfirmData(null);
        router.patch(route("transferencias.anular", id), {}, { preserveScroll: true });
    };

    const applyFiltros = (estado) => {
        setEstadoFilter(estado);
        router.get(route("transferencias.index"), { estado }, { preserveState: true, replace: true });
    };

    const closeModal = () => { reset(); setShowModal(false); };

    const prevUrl = transferencias?.links?.prev ?? null;
    const nextUrl = transferencias?.links?.next ?? null;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <Head title="Transferencias" />

            <div className="flex-1 space-y-6 bg-slate-50/60 p-6">

                {/* Header */}
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                    <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                <ArrowLeftRight className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white tracking-tight">Transferencias de EPP</h1>
                                <p className="text-blue-200 text-sm mt-0.5">Movimientos de stock entre almacenes</p>
                            </div>
                        </div>
                        <Button onClick={() => setShowModal(true)}
                            className="gap-2 bg-white text-blue-700 hover:bg-blue-50 border-0 rounded-xl shadow-sm font-semibold">
                            <Plus className="h-4 w-4" /> Nueva transferencia
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
                    {[
                        { label: "Total transferencias", value: stats.total       ?? 0, cls: "text-slate-700",   bg: "bg-white" },
                        { label: "Confirmadas",          value: stats.confirmadas ?? 0, cls: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
                        { label: "Borradores",           value: stats.borradores  ?? 0, cls: "text-amber-600",   bg: "bg-amber-50 border-amber-200" },
                    ].map(({ label, value, cls, bg }) => (
                        <Card key={label} className={`border shadow-sm rounded-2xl ${bg}`}>
                            <CardContent className="p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">{label}</p>
                                    <p className={`text-3xl font-bold mt-1 ${cls}`}>{value}</p>
                                </div>
                                <ArrowLeftRight className={`h-7 w-7 ${cls} opacity-40`} />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Aviso */}
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                    <span>
                        <strong>Regla de negocio:</strong> Los préstamos entre almacenes operativos no generan cargos al trabajador.
                        Los EPP devueltos por desgaste se transfieren al Almacén de Segregación mediante el flujo de Custodia EPP.
                    </span>
                </div>

                {/* Filtros */}
                <div className="flex gap-2 flex-wrap">
                    {[["", "Todas"], ["CONFIRMADO", "Confirmadas"], ["BORRADOR", "Borradores"], ["ANULADO", "Anuladas"]].map(([val, label]) => (
                        <button key={val} onClick={() => applyFiltros(val)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                                estadoFilter === val
                                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                            }`}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Tabla */}
                <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <div className="border-b bg-slate-50 px-6 py-4">
                        <h2 className="text-sm font-semibold text-slate-800">Historial de transferencias</h2>
                        <p className="text-xs text-slate-400 mt-0.5">{transferencias?.meta?.total ?? 0} registros</p>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                    <TableHead className="w-8" />
                                    {["Fecha", "Origen", "", "Destino", "Motivo", "Responsable", "Estado", "Acciones"].map(h => (
                                        <TableHead key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(transferencias?.data ?? []).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <ArrowLeftRight className="h-10 w-10 opacity-20" />
                                                <p className="text-sm font-medium">No hay transferencias registradas</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (transferencias?.data ?? []).map(t => (
                                    <Fragment key={t.id}>
                                        <TableRow className="cursor-pointer hover:bg-blue-50/30 transition-colors"
                                            onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                                            <TableCell>
                                                {expandedId === t.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600 whitespace-nowrap">{t.fecha_transferencia}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                                        <Warehouse className="h-3.5 w-3.5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm text-slate-800">{t.almacen_origen}</p>
                                                        {t.proyecto_origen && <p className="text-xs text-slate-400">{t.proyecto_origen}</p>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell><ArrowRight className="h-4 w-4 text-slate-400" /></TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                                        <Warehouse className="h-3.5 w-3.5 text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm text-slate-800">{t.almacen_destino}</p>
                                                        {t.proyecto_destino && <p className="text-xs text-slate-400">{t.proyecto_destino}</p>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500 max-w-[150px] truncate">{t.motivo ?? "—"}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{t.responsable}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ESTADO_CONFIG[t.estado]?.cls ?? "bg-slate-100 text-slate-600"}`}>
                                                    {ESTADO_CONFIG[t.estado]?.label ?? t.estado}
                                                </span>
                                            </TableCell>
                                            <TableCell onClick={e => e.stopPropagation()}>
                                                {t.estado === "CONFIRMADO" && (
                                                    <Button size="sm" variant="outline"
                                                        className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 rounded-lg text-xs"
                                                        onClick={() => handleAnularClick(t.id, t.almacen_origen, t.almacen_destino)}>
                                                        <Ban className="h-3.5 w-3.5" /> Anular
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>

                                        {expandedId === t.id && (
                                            <TableRow>
                                                <TableCell colSpan={9} className="bg-blue-50/30 px-8 py-4">
                                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">EPP transferidos</p>
                                                    {(t.detalles ?? []).length === 0 ? (
                                                        <p className="text-sm text-slate-400">Sin detalle disponible</p>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-2">
                                                            {(t.detalles ?? []).map((d, i) => (
                                                                <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                                                                    <Package className="h-3 w-3 text-slate-400" />
                                                                    {d.epp}{d.talla && d.talla !== "ÚNICA" && ` — T.${d.talla}`}
                                                                    <span className="font-bold text-blue-700">×{d.cantidad}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {t.observaciones && (
                                                        <p className="mt-3 text-xs text-slate-500"><strong>Observaciones:</strong> {t.observaciones}</p>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {(transferencias?.meta?.last_page ?? 1) > 1 && (
                        <div className="flex items-center justify-between border-t px-6 py-4">
                            <p className="text-sm text-slate-500">
                                {transferencias?.meta?.from}–{transferencias?.meta?.to} de {transferencias?.meta?.total}
                            </p>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" disabled={!prevUrl}
                                    onClick={() => prevUrl && router.visit(prevUrl, { preserveState: true })}>Anterior</Button>
                                <Button size="sm" variant="outline" disabled={!nextUrl}
                                    onClick={() => nextUrl && router.visit(nextUrl, { preserveState: true })}>Siguiente</Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* ── Modal ── */}
            <Dialog open={showModal} onOpenChange={open => !open && closeModal()}>
                <DialogContent className="p-0 overflow-hidden rounded-2xl border-0 shadow-2xl sm:max-w-2xl max-h-[92vh] flex flex-col">
                    <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-5 flex items-center gap-3 shrink-0">
                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <ArrowLeftRight className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-white font-bold text-base m-0">Nueva transferencia de EPP</DialogTitle>
                            <p className="text-blue-200 text-xs mt-0.5">Traspaso de stock entre almacenes</p>
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 p-6 space-y-5">

                        {/* Fecha + Almacenes */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Fecha *</Label>
                                <Input type="date" value={data.fecha_transferencia}
                                    onChange={e => setData("fecha_transferencia", e.target.value)}
                                    className="rounded-xl h-10" />
                                {errors.fecha_transferencia && <p className="text-xs text-red-500">{errors.fecha_transferencia}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Almacén origen *</Label>
                                <select value={data.almacen_origen_id} onChange={handleOrigenChange}
                                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                                    <option value="">Seleccionar...</option>
                                    {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                </select>
                                {errors.almacen_origen_id && <p className="text-xs text-red-500">{errors.almacen_origen_id}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Almacén destino *</Label>
                                <select value={data.almacen_destino_id}
                                    onChange={e => setData("almacen_destino_id", e.target.value)}
                                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    disabled={!data.almacen_origen_id}>
                                    <option value="">Seleccionar...</option>
                                    {almacenesDestino.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                </select>
                                {errors.almacen_destino_id && <p className="text-xs text-red-500">{errors.almacen_destino_id}</p>}
                            </div>
                        </div>

                        {/* Motivo + Observaciones */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Motivo</Label>
                                <Input placeholder="Ej: Préstamo por desabasto..." value={data.motivo}
                                    onChange={e => setData("motivo", e.target.value)} className="rounded-xl h-10" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Observaciones</Label>
                                <Input placeholder="Notas adicionales..." value={data.observaciones}
                                    onChange={e => setData("observaciones", e.target.value)} className="rounded-xl h-10" />
                            </div>
                        </div>

                        {/* Avisos de estado */}
                        {!data.almacen_origen_id && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                Selecciona primero el almacén origen para ver los EPP disponibles.
                            </div>
                        )}
                        {data.almacen_origen_id && !data.almacen_destino_id && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                Selecciona el almacén destino para poder elegir el EPP receptor.
                            </div>
                        )}
                        {data.almacen_origen_id && eppItemsOrigen.length === 0 && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                                <Package className="h-4 w-4 shrink-0" />
                                No hay EPP con stock disponible en el almacén seleccionado.
                            </div>
                        )}
                        {errors.detalles && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0" /> {errors.detalles}
                            </div>
                        )}

                        {/* EPP a transferir — visible solo cuando ambos almacenes están seleccionados */}
                        {data.almacen_origen_id && data.almacen_destino_id && eppItemsOrigen.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-700">EPP a transferir *</h3>
                                    <button type="button" onClick={addDetalle}
                                        className="flex items-center gap-1.5 text-blue-600 text-xs font-bold hover:text-blue-800 transition-colors">
                                        <Plus size={14} /> Añadir otro EPP
                                    </button>
                                </div>

                                {data.detalles.map((det, i) => (
                                    <DetalleRow
                                        key={i}
                                        row={det}
                                        index={i}
                                        eppItemsOrigen={eppItemsOrigen}
                                        todosEppItems={eppItemsDestino}
                                        stockPorAlmacen={stockPorAlmacen}
                                        almacenDestinoId={data.almacen_destino_id}
                                        almacenDestinoNombre={almacenDestinoNombre}
                                        onUpdate={updateDetalle}
                                        onRemove={removeDetalle}
                                        canRemove={data.detalles.length > 1}
                                    />
                                ))}

                                {Object.keys(errors)
                                    .filter(k => k.startsWith("detalles.") && k !== "detalles")
                                    .map(k => <p key={k} className="text-xs text-red-500">{errors[k]}</p>)}
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t bg-slate-50 flex gap-3 shrink-0">
                        <Button type="button" variant="outline" onClick={closeModal}
                            disabled={processing} className="flex-1 rounded-xl h-10">Cancelar</Button>
                        <Button type="button" onClick={handleSubmitClick}
                            disabled={
                                processing ||
                                !data.almacen_origen_id ||
                                !data.almacen_destino_id ||
                                !data.fecha_transferencia ||
                                data.detalles.every(d => !d.epp_sku_id)
                            }
                            className="flex-1 rounded-xl h-10 bg-blue-600 hover:bg-blue-700 text-white border-0">
                            {processing ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Procesando...
                                </span>
                            ) : "Revisar y confirmar"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={confirmData?.type === "transfer"} title="Confirmar transferencia"
                message={confirmData?.message ?? ""} confirmLabel="Sí, transferir EPP"
                onConfirm={handleConfirmTransfer} onCancel={() => setConfirmData(null)} />
            <ConfirmDialog open={confirmData?.type === "anular"} title="Anular transferencia"
                message={confirmData?.message ?? ""} confirmLabel="Sí, anular" danger
                onConfirm={handleConfirmAnular} onCancel={() => setConfirmData(null)} />
        </AdminLayout>
    );
}