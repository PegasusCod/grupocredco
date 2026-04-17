import { useEffect, useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from "@inertiajs/react";
import {
    Search, Plus, X, HardHat, Trash2, User, CalendarDays, Eye,
    FileText, UserCheck,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOTIVO_LABEL = {
    INICIAL:              "Nuevo ingreso",
    REPOSICION_DESGASTE:  "Desgaste",
    REPOSICION_PERDIDA:   "Pérdida",
};

const MOTIVO_COLOR = {
    INICIAL:              "bg-blue-100 text-blue-700 border-blue-200",
    REPOSICION_DESGASTE:  "bg-amber-100 text-amber-700 border-amber-200",
    REPOSICION_PERDIDA:   "bg-red-100 text-red-700 border-red-200",
};

// ── Modales ───────────────────────────────────────────────────────────────────

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
                                <p className="text-xs text-muted-foreground">Talla: {cambio.talla}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm">
                                <CalendarDays className="w-4 h-4" />
                                {cambio.fecha}
                            </div>
                        </div>
                    </div>

                    {[
                        { label: "Motivo", value: <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold border ${MOTIVO_COLOR[cambio.motivo] ?? "bg-slate-100 text-slate-700"}`}>{MOTIVO_LABEL[cambio.motivo] ?? cambio.motivo}</span> },
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
                    <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl">Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function EntregasIndex({
    trabajador    = null,
    skusDisponibles = [],   // ← antes "items"
    historial     = [],
    years         = [],
    filters       = {},
}) {
    const currentYear = new Date().getFullYear().toString();

    const [searchTerm,    setSearchTerm]    = useState(filters.search || "");
    const [selectedYear,  setSelectedYear]  = useState(String(filters.year || currentYear));
    const [showModal,     setShowModal]     = useState(false);
    const [detalleCambio, setDetalleCambio] = useState(null);
    const [detalleEpp,    setDetalleEpp]    = useState("");

    // ── Formulario ────────────────────────────────────────────────────────────

    // Cada fila: epp_sku_id + cantidad + motivo_entrega
    // El almacén se elige por fila según los stocks disponibles del SKU
    const emptyRow = () => ({
        epp_sku_id:      "",
        almacen_origen_id: "",
        cantidad:        1,
        motivo_entrega:  "INICIAL",
    });

    const { data, setData, post, processing, reset, errors } = useForm({
        trabajador_id:    trabajador?.id || "",
        observaciones:    "",
        items:            [emptyRow()],
    });

    useEffect(() => {
        if (trabajador) setData("trabajador_id", trabajador.id);
    }, [trabajador]);

    const handleBuscar = () => {
        router.get(route("entregas.index"), { search: searchTerm, year: selectedYear },
            { preserveState: true, replace: true });
    };

    const handleLimpiar = () => {
        setSearchTerm(""); setSelectedYear(currentYear);
        router.get(route("entregas.index"), {}, { replace: true });
    };

    const handleSave = (e) => {
        e.preventDefault();
        post(route("entregas.store"), {
            onSuccess: () => { setShowModal(false); reset(); },
            onError:   () => setShowModal(true),
        });
    };

    const updateItem = (index, field, value) => {
        const arr = [...data.items];
        arr[index] = { ...arr[index], [field]: value };
        // Si cambia el SKU, limpiar almacén
        if (field === "epp_sku_id") arr[index].almacen_origen_id = "";
        setData("items", arr);
    };

    // Obtener stocks disponibles para un SKU
    const getStocksForSku = (skuId) => {
        const sku = skusDisponibles.find(s => String(s.sku_id) === String(skuId));
        return sku?.stocks ?? [];
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <Head title="Entregas de EPP" />

            <div className="flex-1 overflow-auto bg-gray-50 pb-10">
                {/* Header */}
                <div className="bg-white border-b px-4 sm:px-8 py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Entregas de EPP</h2>
                            <p className="text-slate-500 mt-1 text-sm">Historial de asignaciones por trabajador</p>
                        </div>
                        <Button onClick={() => setShowModal(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Nueva entrega</span>
                            <span className="sm:hidden">Nueva</span>
                        </Button>
                    </div>
                </div>

                <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">

                    {/* Filtros */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Código de Fotocheck
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && handleBuscar()}
                                        placeholder="Ej: GC0289"
                                        className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Año</label>
                                <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button onClick={handleBuscar}
                                className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 font-semibold flex items-center gap-2">
                                <Search className="w-4 h-4" /> Buscar
                            </button>
                            <button onClick={handleLimpiar}
                                className="bg-slate-100 text-slate-700 px-6 py-3 rounded-2xl hover:bg-slate-200 font-semibold">
                                Limpiar
                            </button>
                        </div>
                    </div>

                    {/* Tarjeta trabajador */}
                    {trabajador && (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-6 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
                                <User className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">
                                    {trabajador.nombres} {trabajador.apellidos}
                                </h3>
                                <div className="mt-1 text-slate-600 flex flex-wrap gap-x-4 text-sm">
                                    <span><strong>Fotocheck:</strong> {trabajador.codigo_fotocheck}</span>
                                    <span><strong>Cargo:</strong> {trabajador.cargo_laboral?.nombre ?? "—"}</span>
                                    <span><strong>Proyecto:</strong> {trabajador.proyecto?.nombre ?? "—"}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Historial */}
                    {trabajador && (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                            <div className="px-6 py-5 border-b">
                                <h3 className="text-xl font-bold text-slate-900">Historial — {selectedYear}</h3>
                                <p className="text-slate-500 mt-1 text-sm">Toca una fila para ver el detalle</p>
                            </div>

                            {historial.length > 0 ? (
                                <div className="divide-y">
                                    {historial.map((grupo, i) => (
                                        <div key={i} className="px-6 py-5">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                                    <HardHat className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="font-semibold text-slate-900">{grupo.epp}</span>
                                                </div>
                                                <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full px-3 py-1">
                                                    {grupo.total} {grupo.total === 1 ? "entrega" : "entregas"}
                                                </span>
                                            </div>

                                            <div className="space-y-2 pl-12">
                                                {grupo.cambios.map((cambio, j) => (
                                                    <button key={j} onClick={() => { setDetalleCambio(cambio); setDetalleEpp(grupo.epp); }}
                                                        className="w-full text-left bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5
                                                                   flex flex-wrap items-center gap-3 hover:bg-blue-50 hover:border-blue-200 transition-colors group">
                                                        <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                                                            <CalendarDays className="w-4 h-4" /> {cambio.fecha}
                                                        </div>
                                                        {cambio.talla && cambio.talla !== "UNICA" && (
                                                            <span className="text-xs text-slate-500">Talla: {cambio.talla}</span>
                                                        )}
                                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${MOTIVO_COLOR[cambio.motivo] ?? "bg-slate-100 text-slate-700"}`}>
                                                            {MOTIVO_LABEL[cambio.motivo] ?? cambio.motivo}
                                                        </span>
                                                        <span className="text-slate-400 text-xs">Cant: {cambio.cantidad}</span>
                                                        <Eye className="w-4 h-4 text-slate-300 group-hover:text-blue-500 ml-auto transition-colors" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 text-center text-slate-500">
                                    No hay entregas registradas para {selectedYear}.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Estado vacío */}
                    {!trabajador && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                            <HardHat className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>Busca un trabajador por fotocheck para ver su historial de entregas.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modal Nueva Entrega ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[92vh]">
                        <div className="p-5 sm:p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-3xl sm:rounded-t-2xl">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <HardHat className="text-blue-600 w-5 h-5" /> Nueva Entrega
                            </h3>
                            <button onClick={() => { setShowModal(false); reset(); }}
                                className="p-2 hover:bg-gray-200 rounded-full"><X size={18} /></button>
                        </div>

                        <div className="p-5 sm:p-8 overflow-y-auto flex-1">
                            {!trabajador && (
                                <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                                    Primero busca un trabajador para registrar una entrega.
                                </div>
                            )}

                            {trabajador && (
                                <>
                                    <div className="mb-5 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                        <p className="font-semibold text-blue-800">{trabajador.nombres} {trabajador.apellidos}</p>
                                        <p className="text-sm text-blue-600">Fotocheck: {trabajador.codigo_fotocheck}</p>
                                    </div>

                                    <form onSubmit={handleSave} className="space-y-5">
                                        <div className="space-y-3">
                                            {data.items.map((row, index) => {
                                                const stocks = getStocksForSku(row.epp_sku_id);
                                                return (
                                                    <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                                                        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
                                                            {/* EPP (SKU) */}
                                                            <div>
                                                                <label className="text-xs font-bold text-gray-400 uppercase">EPP + Talla</label>
                                                                <select className="mt-1 w-full border-gray-200 rounded-lg text-sm h-10 px-2"
                                                                    value={row.epp_sku_id}
                                                                    onChange={e => updateItem(index, "epp_sku_id", e.target.value)} required>
                                                                    <option value="">Seleccione EPP...</option>
                                                                    {skusDisponibles.map(s => (
                                                                        <option key={s.sku_id} value={s.sku_id}>
                                                                            {s.nombre}{s.usa_tallas ? ` — ${s.talla_nombre}` : ""}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {errors[`items.${index}.epp_sku_id`] && (
                                                                    <p className="text-xs text-red-500 mt-1">{errors[`items.${index}.epp_sku_id`]}</p>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <label className="text-xs font-bold text-gray-400 uppercase">Cantidad</label>
                                                                <input type="number" min={1}
                                                                    className="mt-1 w-full border border-gray-200 rounded-lg text-sm h-10 px-3"
                                                                    value={row.cantidad}
                                                                    onChange={e => updateItem(index, "cantidad", Number(e.target.value))} />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {/* Almacén de origen */}
                                                            <div>
                                                                <label className="text-xs font-bold text-gray-400 uppercase">Almacén origen</label>
                                                                <select className="mt-1 w-full border-gray-200 rounded-lg text-sm h-10 px-2"
                                                                    value={row.almacen_origen_id}
                                                                    onChange={e => updateItem(index, "almacen_origen_id", e.target.value)}
                                                                    disabled={!row.epp_sku_id} required>
                                                                    <option value="">Seleccione almacén...</option>
                                                                    {stocks.map(s => (
                                                                        <option key={s.almacen_id} value={s.almacen_id}>
                                                                            {s.almacen_nombre} (stock: {s.cantidad_actual})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            {/* Motivo */}
                                                            <div>
                                                                <label className="text-xs font-bold text-gray-400 uppercase">Motivo</label>
                                                                <select className="mt-1 w-full border-gray-200 rounded-lg text-sm h-10 px-2"
                                                                    value={row.motivo_entrega}
                                                                    onChange={e => updateItem(index, "motivo_entrega", e.target.value)}>
                                                                    <option value="INICIAL">Nuevo ingreso</option>
                                                                    <option value="REPOSICION_DESGASTE">Desgaste</option>
                                                                    <option value="REPOSICION_PERDIDA">Pérdida</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {index > 0 && (
                                                            <button type="button"
                                                                onClick={() => setData("items", data.items.filter((_, i) => i !== index))}
                                                                className="text-red-400 hover:text-red-600 flex items-center gap-1 text-sm">
                                                                <Trash2 size={14} /> Quitar
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            <button type="button"
                                                onClick={() => setData("items", [...data.items, emptyRow()])}
                                                className="flex items-center gap-2 text-blue-600 text-sm font-bold">
                                                <Plus size={15} /> Añadir otro EPP
                                            </button>
                                        </div>

                                        {/* Observaciones */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase">Observaciones</label>
                                            <textarea rows={2}
                                                className="mt-1 w-full border border-gray-200 rounded-lg text-sm px-3 py-2"
                                                value={data.observaciones}
                                                onChange={e => setData("observaciones", e.target.value)}
                                                placeholder="Opcional..." />
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t">
                                            <button type="button" onClick={() => setShowModal(false)}
                                                className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">
                                                Cancelar
                                            </button>
                                            <button type="submit" disabled={processing}
                                                className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
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
            <DetalleCambioModal cambio={detalleCambio} eppNombre={detalleEpp}
                onClose={() => { setDetalleCambio(null); setDetalleEpp(""); }} />
        </AdminLayout>
    );
}