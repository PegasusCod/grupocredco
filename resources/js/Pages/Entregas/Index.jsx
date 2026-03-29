import React, { useEffect, useState } from 'react';
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from '@inertiajs/react';
import {
    Search,
    Plus,
    X,
    HardHat,
    Trash2,
    User,
    CalendarDays,
    Eye,
    FileText,
    UserCheck,
} from 'lucide-react';

// ─── shadcn/ui ────────────────────────────────────────────────────────────────
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const motivoVariant = (motivo) => {
    switch (motivo) {
        case 'Personal Nuevo': return 'default';   // azul
        case 'Desgaste':       return 'secondary'; // gris
        case 'Perdida':        return 'destructive';
        default:               return 'outline';
    }
};

const motivoColor = (motivo) => {
    switch (motivo) {
        case 'Personal Nuevo':
            return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'Desgaste':
            return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'Perdida':
            return 'bg-red-100 text-red-700 border-red-200';
        default:
            return 'bg-slate-100 text-slate-700 border-slate-200';
    }
};

// ─── Modal: Detalle del Cambio ────────────────────────────────────────────────

function DetalleCambioModal({ cambio, eppNombre, onClose }) {
    if (!cambio) return null;

    return (
        <Dialog open={!!cambio} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md w-full rounded-2xl p-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
                    <DialogTitle className="text-xl font-bold text-slate-900">
                        Detalle del Cambio
                    </DialogTitle>
                </DialogHeader>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    {/* EPP + Fecha */}
                    <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                            <HardHat className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 text-base">{eppNombre}</p>
                            <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm">
                                <CalendarDays className="w-4 h-4" />
                                <span>Fecha de cambio: <strong className="text-slate-700">{cambio.fecha}</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Motivo */}
                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            Motivo del Cambio
                        </p>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${motivoColor(cambio.motivo)}`}>
                                {cambio.motivo}
                            </span>
                        </div>
                    </div>

                    {/* Cantidad */}
                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            Cantidad Entregada
                        </p>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-800 font-semibold">
                            {cambio.cantidad} unidad{cambio.cantidad !== 1 ? 'es' : ''}
                        </div>
                    </div>

                    {/* Observaciones */}
                    {cambio.observaciones && (
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" /> Observaciones
                            </p>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-700 text-sm">
                                {cambio.observaciones}
                            </div>
                        </div>
                    )}

                    {/* Registrado por */}
                    {cambio.registrado_por && (
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5" /> Registrado por
                            </p>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-2 text-slate-700 text-sm">
                                <User className="w-4 h-4 text-slate-400" />
                                {cambio.registrado_por}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50">
                    <Button
                        onClick={onClose}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                    >
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Fila del historial (desktop) ────────────────────────────────────────────

function FilaHistorialDesktop({ grupo, onVerDetalle }) {
    return (
        <div className="grid grid-cols-12 gap-4 px-8 py-6 border-b last:border-b-0 border-slate-100 items-start">
            {/* EPP */}
            <div className="col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <HardHat className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-base font-semibold text-slate-900 leading-tight">
                    {grupo.epp}
                </span>
            </div>

            {/* Cambios */}
            <div className="col-span-6 space-y-2">
                {grupo.cambios.map((cambio, i) => (
                    <button
                        key={i}
                        onClick={() => onVerDetalle(cambio, grupo.epp)}
                        className="w-full text-left bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3
                                   flex flex-wrap items-center gap-4
                                   hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                    >
                        <div className="flex items-center gap-2 text-blue-700 font-semibold">
                            <CalendarDays className="w-4 h-4" />
                            {cambio.fecha}
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${motivoColor(cambio.motivo)}`}>
                            {cambio.motivo}
                        </span>
                        <span className="text-slate-400 text-xs">Cant: {cambio.cantidad}</span>
                        <Eye className="w-4 h-4 text-slate-300 group-hover:text-blue-500 ml-auto transition-colors" />
                    </button>
                ))}
            </div>

            {/* Total */}
            <div className="col-span-2 flex justify-start pt-1">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-emerald-800 font-semibold text-sm">
                    {grupo.total} {grupo.total === 1 ? 'cambio' : 'cambios'}
                </span>
            </div>
        </div>
    );
}

// ─── Tarjeta del historial (mobile) ──────────────────────────────────────────

function TarjetaHistorialMobile({ grupo, onVerDetalle }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {/* Encabezado de la tarjeta */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <HardHat className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-bold text-slate-900 text-sm leading-tight">
                        {grupo.epp}
                    </span>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 font-semibold text-xs">
                    {grupo.total} {grupo.total === 1 ? 'cambio' : 'cambios'}
                </span>
            </div>

            {/* Lista de cambios */}
            <div className="divide-y divide-slate-100">
                {grupo.cambios.map((cambio, i) => (
                    <button
                        key={i}
                        onClick={() => onVerDetalle(cambio, grupo.epp)}
                        className="w-full text-left px-4 py-3.5 flex items-center justify-between
                                   hover:bg-blue-50 active:bg-blue-100 transition-colors"
                    >
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                                <CalendarDays className="w-3.5 h-3.5" />
                                {cambio.fecha}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${motivoColor(cambio.motivo)}`}>
                                    {cambio.motivo}
                                </span>
                                <span className="text-xs text-slate-400">Cant: {cambio.cantidad}</span>
                            </div>
                        </div>
                        <Eye className="w-4 h-4 text-slate-300 shrink-0 ml-3" />
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function EntregasIndex({ trabajador, items, historial = [], years = [], filters = {} }) {
    const currentYear = new Date().getFullYear().toString();

    const [searchTerm, setSearchTerm]       = useState(filters.search || '');
    const [selectedYear, setSelectedYear]   = useState(String(filters.year || currentYear));
    const [showModal, setShowModal]         = useState(false);

    // Estado para el modal de detalle
    const [detalleCambio, setDetalleCambio]     = useState(null);
    const [detalleEppNombre, setDetalleEppNombre] = useState('');

    const handleVerDetalle = (cambio, eppNombre) => {
        setDetalleCambio(cambio);
        setDetalleEppNombre(eppNombre);
    };

    const handleCerrarDetalle = () => {
        setDetalleCambio(null);
        setDetalleEppNombre('');
    };

    // ── Formulario ──────────────────────────────────────────────────────────

    const emptyRow = (motivo = 'Personal Nuevo') => ({
        epp_item_id: '',
        epp_talla_id: '',
        cantidad: 1,
        motivo,
    });

    const { data, setData, post, processing, reset, errors } = useForm({
        trabajador_id: trabajador?.id || '',
        observaciones: '',
        items: [emptyRow()],
    });

    const resetFormEntrega = () => {
        setData({
            trabajador_id: trabajador?.id || '',
            observaciones: '',
            items: [emptyRow()],
        });
    };

    useEffect(() => {
        if (trabajador) setData('trabajador_id', trabajador.id);
    }, [trabajador]);

    const handleBuscar = () => {
        router.get(route('entregas.index'), {
            search: searchTerm,
            year: selectedYear,
        }, { preserveState: true, replace: true });
    };

    const handleLimpiar = () => {
        setSearchTerm('');
        setSelectedYear(currentYear);
        router.get(route('entregas.index'), {}, { replace: true });
    };

    const handleSave = (e) => {
        e.preventDefault();
        post(route('entregas.store'), {
            onSuccess: () => { setShowModal(false); resetFormEntrega(); },
            onError:   () => { setShowModal(true); },
        });
    };

    const agregarFila = () => {
        setData('items', [...data.items, emptyRow('Desgaste')]);
    };

    const updateItem = (index, field, value) => {
        const nuevos = [...data.items];

        if (field === 'epp_item_id') {
            const itemId = value === '' ? '' : Number(value);
            const itemSel = items.find(i => Number(i.id) === itemId);
            nuevos[index].epp_item_id = itemId;

            if (!itemSel) {
                nuevos[index].epp_talla_id = '';
            } else if (itemSel.usa_tallas) {
                nuevos[index].epp_talla_id = '';
            } else {
                nuevos[index].epp_talla_id = itemSel.inventario_unico_id
                    ? Number(itemSel.inventario_unico_id) : '';
            }
        } else if (field === 'epp_talla_id') {
            nuevos[index].epp_talla_id = value === '' ? '' : Number(value);
        } else if (field === 'cantidad') {
            nuevos[index].cantidad = Number(value);
        } else {
            nuevos[index][field] = value;
        }

        setData('items', nuevos);
    };

    const getItemSeleccionado   = (id) => !id ? null : items.find(i => String(i.id) === String(id));
    const getTallasDisponibles  = (id) => { const it = getItemSeleccionado(id); return Array.isArray(it?.tallas) ? it.tallas : []; };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <Head title="Asignaciones de EPP" />

            <div className="flex-1 overflow-auto bg-gray-50 pb-10">

                {/* ── HEADER ── */}
                <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-5 sm:py-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                                Asignaciones de EPP
                            </h2>
                            <p className="text-slate-500 mt-1 text-sm sm:text-base">
                                Historial de cambios de equipos por empleado
                            </p>
                        </div>

                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl hover:bg-blue-700 shadow-lg text-sm sm:text-base whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="hidden sm:inline">Nueva Asignación</span>
                            <span className="sm:hidden">Nueva</span>
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">

                    {/* ── FILTROS ── */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-end">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Código de Fotocheck del Trabajador
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                                        placeholder="Ej: GC0289"
                                        className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Año de Cambio
                                </label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {years.map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={handleBuscar}
                                className="bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-2xl hover:bg-blue-700 font-semibold flex items-center gap-2"
                            >
                                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                                Buscar
                            </button>
                            <button
                                onClick={handleLimpiar}
                                className="bg-slate-100 text-slate-700 px-6 sm:px-8 py-3 rounded-2xl hover:bg-slate-200 font-semibold"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>

                    {/* ── TARJETA TRABAJADOR ── */}
                    {trabajador && (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-6 flex items-center gap-4 sm:gap-5">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
                                <User className="w-6 h-6 sm:w-8 sm:h-8" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
                                    {trabajador.nombres} {trabajador.apellidos}
                                </h3>
                                <div className="mt-1 text-slate-600 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                    <span><strong>Fotocheck:</strong> {trabajador.codigo_fotocheck}</span>
                                    <span><strong>Puesto:</strong> {trabajador.cargo?.nombre || 'Sin cargo'}</span>
                                    <span><strong>Área:</strong> {trabajador.area || 'Sin área'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── HISTORIAL ── */}
                    {trabajador && (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                            <div className="px-4 sm:px-8 py-5 sm:py-6 border-b border-slate-200">
                                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                                    Historial de Cambios de EPP — {selectedYear}
                                </h3>
                                <p className="text-slate-500 mt-1 text-sm">
                                    Toca una fecha para ver el detalle del cambio
                                </p>
                            </div>

                            {historial.length > 0 ? (
                                <>
                                    {/* Desktop: tabla grid */}
                                    <div className="hidden md:block">
                                        <div className="grid grid-cols-12 px-8 py-4 border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                            <div className="col-span-4">EPP</div>
                                            <div className="col-span-6">Fechas de Cambio</div>
                                            <div className="col-span-2">Total Cambios</div>
                                        </div>
                                        {historial.map((grupo, index) => (
                                            <FilaHistorialDesktop
                                                key={index}
                                                grupo={grupo}
                                                onVerDetalle={handleVerDetalle}
                                            />
                                        ))}
                                    </div>

                                    {/* Mobile: tarjetas apiladas */}
                                    <div className="md:hidden p-4 space-y-3">
                                        {historial.map((grupo, index) => (
                                            <TarjetaHistorialMobile
                                                key={index}
                                                grupo={grupo}
                                                onVerDetalle={handleVerDetalle}
                                            />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="px-6 sm:px-8 py-10 text-slate-500 text-sm text-center sm:text-left">
                                    No se encontraron cambios de EPP para este trabajador en el año {selectedYear}.
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── ESTADO VACÍO INICIAL ── */}
                    {!trabajador && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-12 text-center text-slate-400">
                            <HardHat className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                            <p className="text-base">
                                Busca un trabajador y selecciona un año para ver su historial de cambios de EPP.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── MODAL NUEVA ASIGNACIÓN ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh]">
                        {/* Header */}
                        <div className="p-5 sm:p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-3xl sm:rounded-t-2xl">
                            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                                <HardHat className="text-blue-600 w-5 h-5" />
                                Nueva Entrega
                            </h3>
                            <button
                                onClick={() => { setShowModal(false); reset(); }}
                                className="p-2 hover:bg-gray-200 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 sm:p-8 overflow-y-auto">
                            {!trabajador && (
                                <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                                    Primero busca un trabajador para poder registrar una asignación.
                                </div>
                            )}

                            {trabajador && (
                                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                    <p className="font-semibold text-blue-800">
                                        {trabajador.nombres} {trabajador.apellidos}
                                    </p>
                                    <p className="text-sm text-blue-600">
                                        Fotocheck: {trabajador.codigo_fotocheck}
                                    </p>
                                </div>
                            )}

                            {trabajador && (
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="space-y-4">
                                        {data.items.map((row, index) => (
                                            <div
                                                key={index}
                                                className="flex flex-col sm:grid sm:grid-cols-12 gap-3 items-end bg-gray-50 p-4 rounded-xl border border-gray-100"
                                            >
                                                {/* Equipo */}
                                                <div className="w-full sm:col-span-5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                                                        Equipo
                                                    </label>
                                                    <select
                                                        className="w-full border-gray-200 rounded-lg text-sm mt-1"
                                                        value={row.epp_item_id}
                                                        onChange={e => updateItem(index, 'epp_item_id', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Seleccione EPP...</option>
                                                        {items.map(i => (
                                                            <option key={i.id} value={i.id}>
                                                                {i.nombre} (stock: {i.stock_total_disponible})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Cantidad + Talla en fila en mobile */}
                                                <div className="flex gap-3 w-full sm:contents">
                                                    <div className="flex-1 sm:col-span-2">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase">
                                                            Cant.
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="w-full border-gray-200 rounded-lg text-sm mt-1"
                                                            value={row.cantidad}
                                                            onChange={e => updateItem(index, 'cantidad', e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="flex-1 sm:col-span-2">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase">
                                                            Talla
                                                        </label>
                                                        <select
                                                            className="w-full border-gray-200 rounded-lg text-sm mt-1"
                                                            value={row.epp_talla_id}
                                                            onChange={e => updateItem(index, 'epp_talla_id', e.target.value)}
                                                            disabled={!getItemSeleccionado(row.epp_item_id) || !getItemSeleccionado(row.epp_item_id)?.usa_tallas}
                                                            required={!!getItemSeleccionado(row.epp_item_id)?.usa_tallas}
                                                        >
                                                            {!getItemSeleccionado(row.epp_item_id) && <option value="">Seleccione</option>}
                                                            {getItemSeleccionado(row.epp_item_id) && !getItemSeleccionado(row.epp_item_id)?.usa_tallas && (
                                                                <option value={row.epp_talla_id || ''}>No aplica</option>
                                                            )}
                                                            {getItemSeleccionado(row.epp_item_id)?.usa_tallas && (
                                                                <>
                                                                    <option value="">Seleccione</option>
                                                                    {getTallasDisponibles(row.epp_item_id).map(t => (
                                                                        <option key={t.id} value={t.id}>
                                                                            {t.talla} (stock: {t.stock_actual})
                                                                        </option>
                                                                    ))}
                                                                </>
                                                            )}
                                                        </select>
                                                        {errors[`items.${index}.epp_talla_id`] && (
                                                            <p className="text-red-500 text-xs mt-1">
                                                                {errors[`items.${index}.epp_talla_id`]}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Motivo + Eliminar */}
                                                <div className="flex gap-3 w-full sm:contents items-end">
                                                    <div className="flex-1 sm:col-span-2">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase">
                                                            Motivo
                                                        </label>
                                                        <select
                                                            className="w-full border-gray-200 rounded-lg text-sm mt-1"
                                                            value={row.motivo}
                                                            onChange={e => updateItem(index, 'motivo', e.target.value)}
                                                        >
                                                            <option value="Personal Nuevo">Nuevo</option>
                                                            <option value="Desgaste">Desgaste</option>
                                                            <option value="Perdida">Perdida</option>
                                                        </select>
                                                        {errors[`items.${index}.motivo`] && (
                                                            <p className="text-red-500 text-xs mt-1">
                                                                {errors[`items.${index}.motivo`]}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="sm:col-span-1 flex items-end justify-center pb-1">
                                                        {index > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setData('items', data.items.filter((_, i) => i !== index))}
                                                                className="text-red-400 hover:text-red-600 p-2"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={agregarFila}
                                            className="flex items-center gap-2 text-blue-600 text-sm font-bold"
                                        >
                                            <Plus size={16} />
                                            Añadir otro equipo
                                        </button>
                                    </div>

                                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-lg"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg disabled:opacity-50"
                                        >
                                            {processing ? 'Procesando...' : 'Finalizar Asignación'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL DETALLE DEL CAMBIO ── */}
            <DetalleCambioModal
                cambio={detalleCambio}
                eppNombre={detalleEppNombre}
                onClose={handleCerrarDetalle}
            />
        </AdminLayout>
    );
}