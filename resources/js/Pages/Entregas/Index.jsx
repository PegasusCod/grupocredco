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
    CalendarDays
} from 'lucide-react';

export default function EntregasIndex({ trabajador, items, historial = [], years = [], filters = {} }) {
    const currentYear = new Date().getFullYear().toString();

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedYear, setSelectedYear] = useState(String(filters.year || currentYear));
    const [showModal, setShowModal] = useState(false);

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
        if (trabajador) {
            setData('trabajador_id', trabajador.id);
        }
    }, [trabajador]);

    const handleBuscar = () => {
        router.get(route('entregas.index'), {
            search: searchTerm,
            year: selectedYear,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleLimpiar = () => {
        setSearchTerm('');
        setSelectedYear(currentYear);

        router.get(route('entregas.index'), {}, {
            replace: true,
        });
    };

    const handleSave = (e) => {
        e.preventDefault();

        post(route('entregas.store'), {
            onSuccess: () => {
                setShowModal(false);
                resetFormEntrega();
            },
            onError: () => {
                setShowModal(true);
            }
        });
    };

    const agregarFila = () => {
        setData('items', [
            ...data.items,
            emptyRow('Desgaste')
        ]);
    };

    const updateItem = (index, field, value) => {
        const nuevos = [...data.items];

        if (field === 'epp_item_id') {
            const itemId = value === '' ? '' : Number(value);
            const itemSeleccionado = items.find(i => Number(i.id) === itemId);

            nuevos[index].epp_item_id = itemId;

            if (!itemSeleccionado) {
                nuevos[index].epp_talla_id = '';
            } else if (itemSeleccionado.usa_tallas) {
                // Si usa tallas, el usuario debe elegir una
                nuevos[index].epp_talla_id = '';
            } else {
                // Si no usa tallas, asignamos automáticamente la fila única
                nuevos[index].epp_talla_id = itemSeleccionado.inventario_unico_id
                    ? Number(itemSeleccionado.inventario_unico_id)
                    : '';
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


    const getItemSeleccionado = (eppItemId) => {
        if (!eppItemId) return null;

        return items.find(i => String(i.id) === String(eppItemId));
    };

    const getTallasDisponibles = (eppItemId) => {
        const item = getItemSeleccionado(eppItemId);
        return Array.isArray(item?.tallas) ? item.tallas : [];
    };

    const getLabelTalla = (row) => {
        const item = getItemSeleccionado(row.epp_item_id);

        if (!item) return '';
        if (!item.usa_tallas) return 'No aplica';

        const talla = item.tallas.find(t => String(t.id) === String(row.epp_talla_id));
        return talla ? talla.talla : '';
    };

    const getTallaSeleccionada = (eppTallaId) => {
        const encontrado = items.find(i => String(i.id) === String(eppTallaId));

        if (!encontrado) return '';
        return encontrado?.talla_label || 'No aplica';
    };

    return (
        <AdminLayout>
            <Head title="Asignaciones de EPP" />

            <div className="flex-1 overflow-auto bg-gray-50 pb-10">
                {/* HEADER */}
                <div className="bg-white border-b border-gray-200 px-8 py-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900">Asignaciones de EPP</h2>
                            <p className="text-slate-500 mt-2">Historial de cambios de equipos por empleado</p>
                        </div>

                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            Nueva Asignación
                        </button>
                    </div>
                </div>

                <div className="p-8 max-w-7xl mx-auto space-y-8">
                    {/* FILTROS */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
                            <div className="lg:col-span-2">
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
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={handleBuscar}
                                className="bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 font-semibold flex items-center gap-2"
                            >
                                <Search className="w-5 h-5" />
                                Buscar
                            </button>

                            <button
                                onClick={handleLimpiar}
                                className="bg-slate-100 text-slate-700 px-8 py-3 rounded-2xl hover:bg-slate-200 font-semibold"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    </div>

                    {/* TARJETA TRABAJADOR */}
                    {trabajador && (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-center gap-5">
                            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                <User className="w-8 h-8" />
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">
                                    {trabajador.nombres} {trabajador.apellidos}
                                </h3>
                                <div className="mt-2 text-slate-600 flex flex-wrap gap-x-6 gap-y-1">
                                    <span><strong>Fotocheck:</strong> {trabajador.codigo_fotocheck}</span>
                                    <span><strong>Puesto:</strong> {trabajador.cargo?.nombre || 'Sin cargo'}</span>
                                    <span><strong>Área:</strong> {trabajador.area || 'Sin área'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HISTORIAL */}
                    {trabajador && (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-200">
                                <h3 className="text-2xl font-bold text-slate-900">
                                    Historial de Cambios de EPP - {selectedYear}
                                </h3>
                                <p className="text-slate-500 mt-1">
                                    Detalle de todos los cambios realizados durante el año
                                </p>
                            </div>

                            {historial.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-12 px-8 py-4 border-b border-slate-200 text-sm font-semibold text-slate-500 uppercase tracking-wide">
                                        <div className="col-span-4">EPP</div>
                                        <div className="col-span-6">Fechas de Cambio</div>
                                        <div className="col-span-2">Total Cambios</div>
                                    </div>

                                    {historial.map((grupo, index) => (
                                        <div
                                            key={index}
                                            className="grid grid-cols-12 gap-4 px-8 py-6 border-b last:border-b-0 border-slate-100 items-start"
                                        >
                                            {/* Nombre del EPP */}
                                            <div className="col-span-4 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                                    <HardHat className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <span className="text-xl font-semibold text-slate-900">
                                                    {grupo.epp}
                                                </span>
                                            </div>

                                            {/* Cambios */}
                                            <div className="col-span-6 space-y-3">
                                                {grupo.cambios.map((cambio, i) => (
                                                    <div
                                                        key={i}
                                                        className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-4"
                                                    >
                                                        <div className="flex items-center gap-2 text-blue-700 font-semibold">
                                                            <CalendarDays className="w-4 h-4" />
                                                            {cambio.fecha}
                                                        </div>
                                                        <span className="text-blue-600 text-sm font-medium">
                                                            {cambio.motivo} • Cantidad: {cambio.cantidad}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Total */}
                                            <div className="col-span-2">
                                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-emerald-800 font-semibold">
                                                    {grupo.total} {grupo.total === 1 ? 'cambio' : 'cambios'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="px-8 py-10 text-slate-500">
                                    No se encontraron cambios de EPP para este trabajador en el año {selectedYear}.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Estado vacío inicial */}
                    {!trabajador && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                            Busca un trabajador y selecciona un año para ver su historial de cambios de EPP.
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE NUEVA ASIGNACIÓN */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <HardHat className="text-blue-600" />
                                Nueva Entrega
                            </h3>

                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    reset();
                                }}
                                className="p-2 hover:bg-gray-200 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto">
                            {!trabajador && (
                                <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                                    Primero busca un trabajador en la vista principal para poder registrar una asignación.
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
                                                className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-4 rounded-xl border border-gray-100"
                                            >
                                                <div className="col-span-5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                                                        Equipo
                                                    </label>
                                                    <select
                                                        className="w-full border-gray-200 rounded-lg text-sm"
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

                                                <div className="col-span-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                                                        Cant.
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-full border-gray-200 rounded-lg text-sm"
                                                        value={row.cantidad}
                                                        onChange={e => updateItem(index, 'cantidad', e.target.value)}
                                                    />
                                                </div>

                                                <div className="col-span-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                                                        Talla
                                                    </label>
                                                    <select
                                                        className="w-full border-gray-200 rounded-lg text-sm"
                                                        value={row.epp_talla_id}
                                                        onChange={e => updateItem(index, 'epp_talla_id', e.target.value)}
                                                        disabled={!getItemSeleccionado(row.epp_item_id) || !getItemSeleccionado(row.epp_item_id)?.usa_tallas}
                                                        required={!!getItemSeleccionado(row.epp_item_id)?.usa_tallas}
                                                    >
                                                        {!getItemSeleccionado(row.epp_item_id) && (
                                                            <option value="">Seleccione</option>
                                                        )}

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

                                                <div className="col-span-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                                                        Motivo
                                                    </label>
                                                    <select
                                                        className="w-full border-gray-200 rounded-lg text-sm"
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

                                                <div className="col-span-1 text-center">
                                                    {index > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setData('items', data.items.filter((_, i) => i !== index))
                                                            }
                                                            className="text-red-400 hover:text-red-600 p-2"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
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

                                    <div className="flex justify-end gap-3 pt-4 border-t">
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
        </AdminLayout>
    );
}
