import React, { useMemo, useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Eye,
    HardHat,
    X,
    Package,
    AlertTriangle,
    Filter,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

const emptyForm = {
    nombre: '',
    categoria: '',
    marca: '',
    unidad_medida: 'unid.',
    usa_tallas: false,
    talla_inicial: '',
    stock_inicial: 0,
    stock_minimo: 10,
};

export default function EppIndex({ epps = [], categorias = [] }) {
    const { flash = {} } = usePage().props;

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoria, setSelectedCategoria] = useState('todas');
    const [selectedEstado, setSelectedEstado] = useState('todos');

    const [selectedEPP, setSelectedEPP] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingEPP, setEditingEPP] = useState(null);

    const {
        data,
        setData,
        post,
        put,
        processing,
        reset,
        clearErrors,
        errors,
    } = useForm(emptyForm);

    const openCreateModal = () => {
        setEditingEPP(null);
        setData({ ...emptyForm });
        clearErrors();
        setShowFormModal(true);
    };

    const openEditModal = (epp) => {
        setEditingEPP(epp);
        setData({
            nombre: epp.nombre ?? '',
            categoria: epp.categoria ?? '',
            marca: epp.marca ?? '',
            unidad_medida: epp.unidad_medida ?? 'unid.',
            usa_tallas: !!epp.usa_tallas,
            talla_inicial: '',
            stock_inicial: 0,
            stock_minimo: epp.stockMinimo ?? 0,
        });
        clearErrors();
        setShowFormModal(true);
    };

    const closeFormModal = () => {
        setShowFormModal(false);
        setEditingEPP(null);
        reset();
        clearErrors();
    };

    const submit = (e) => {
        e.preventDefault();

        if (editingEPP) {
            put(route('epp.update', editingEPP.id), {
                preserveScroll: true,
                onSuccess: () => closeFormModal(),
            });
            return;
        }

        post(route('epp.store'), {
            preserveScroll: true,
            onSuccess: () => closeFormModal(),
        });
    };

    const handleDeleteEPP = (epp) => {
        if (!window.confirm(`¿Seguro que deseas eliminar "${epp.nombre}"?`)) {
            return;
        }

        router.delete(route('epp.destroy', epp.id), {
            preserveScroll: true,
        });
    };

    const filteredEPP = useMemo(() => {
        return epps.filter((epp) => {
            const term = searchTerm.trim().toLowerCase();

            const matchesSearch =
                term === '' ||
                epp.nombre.toLowerCase().includes(term) ||
                epp.codigo.toLowerCase().includes(term) ||
                epp.marca.toLowerCase().includes(term);

            const matchesCategoria =
                selectedCategoria === 'todas' || epp.categoria === selectedCategoria;

            const matchesEstado =
                selectedEstado === 'todos' || epp.estado === selectedEstado;

            return matchesSearch && matchesCategoria && matchesEstado;
        });
    }, [epps, searchTerm, selectedCategoria, selectedEstado]);

    const stats = useMemo(() => {
        return {
            total: epps.reduce((sum, e) => sum + Number(e.stock || 0), 0),
            bajoStock: epps.filter((e) => e.estado === 'bajo_stock').length,
            agotados: epps.filter((e) => e.estado === 'agotado').length,
            disponibles: epps.filter((e) => e.estado === 'disponible').length,
        };
    }, [epps]);

    const estadoLabel = (estado) => {
        if (estado === 'bajo_stock') return 'Bajo Stock';
        if (estado === 'agotado') return 'Agotado';
        return 'Disponible';
    };

    const estadoBadgeClass = (estado) => {
        if (estado === 'agotado') return 'bg-red-500 text-white';
        if (estado === 'bajo_stock') return 'bg-orange-500 text-white';
        return 'bg-green-500 text-white';
    };

    const estadoNumberClass = (estado) => {
        if (estado === 'agotado') return 'text-red-600';
        if (estado === 'bajo_stock') return 'text-orange-600';
        return 'text-green-600';
    };

    const progressClass = (estado) => {
        if (estado === 'agotado') return 'bg-red-600';
        if (estado === 'bajo_stock') return 'bg-orange-600';
        return 'bg-green-600';
    };

    return (
        <AdminLayout>
            <div className="flex-1 overflow-auto bg-gray-50">
                <div className="bg-white border-b border-gray-200 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">EPP Disponibles</h2>
                            <p className="text-gray-600 mt-1">
                                Equipos de Protección Personal en inventario
                            </p>
                        </div>

                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-5 h-5" />
                            Nuevo EPP
                        </button>
                    </div>
                </div>

                <div className="p-8">
                    {flash.success && (
                        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800">
                            {flash.success}
                        </div>
                    )}

                    {flash.error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
                            {flash.error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-gray-600 text-sm">Total en Stock</p>
                                <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-xs text-gray-500 mt-1">{epps.length} tipos de EPP</p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-gray-600 text-sm">Bajo Stock</p>
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                            </div>
                            <p className="text-3xl font-bold text-orange-600">{stats.bajoStock}</p>
                            <p className="text-xs text-gray-500 mt-1">Requieren reposición</p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-gray-600 text-sm">Agotados</p>
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <p className="text-3xl font-bold text-red-600">{stats.agotados}</p>
                            <p className="text-xs text-gray-500 mt-1">Sin stock disponible</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:shadow-lg transition">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-blue-100 text-sm">Disponibles</p>
                                <HardHat className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-3xl font-bold">{stats.disponibles}</p>
                            <p className="text-xs text-blue-100 mt-1">EPP en óptimas condiciones</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <h3 className="font-semibold text-gray-900">Filtros</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Buscar EPP
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, código o marca..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Categoría
                                </label>
                                <select
                                    value={selectedCategoria}
                                    onChange={(e) => setSelectedCategoria(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="todas">Todas las categorías</option>
                                    {categorias.map((categoria) => (
                                        <option key={categoria} value={categoria}>
                                            {categoria}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Estado
                                </label>
                                <select
                                    value={selectedEstado}
                                    onChange={(e) => setSelectedEstado(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="todos">Todos los estados</option>
                                    <option value="disponible">Disponible</option>
                                    <option value="bajo_stock">Bajo Stock</option>
                                    <option value="agotado">Agotado</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">Catálogo de EPP</h3>
                                <p className="text-sm text-gray-600">
                                    Mostrando {filteredEPP.length} de {epps.length} equipos
                                </p>
                            </div>
                        </div>

                        {filteredEPP.length === 0 ? (
                            <div className="text-center py-12">
                                <HardHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">No se encontraron equipos</p>
                                <p className="text-sm text-gray-400">
                                    Intenta ajustar los filtros de búsqueda
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredEPP.map((epp) => (
                                    <div
                                        key={epp.id}
                                        className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all overflow-hidden group"
                                    >
                                        <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative overflow-hidden">
                                            <HardHat className="w-24 h-24 text-blue-600 group-hover:scale-110 transition-transform" />
                                            <div className="absolute top-3 left-3">
                                                <span className="text-xs font-mono text-gray-600 bg-white/80 px-2 py-1 rounded">
                                                    {epp.codigo}
                                                </span>
                                            </div>
                                            <div className="absolute top-3 right-3">
                                                <span
                                                    className={`px-3 py-1 text-xs font-semibold rounded-full ${estadoBadgeClass(epp.estado)}`}
                                                >
                                                    {estadoLabel(epp.estado)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-5">
                                            <h4 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 min-h-[3.5rem]">
                                                {epp.nombre}
                                            </h4>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Marca:</span>
                                                    <span className="font-medium text-gray-900">{epp.marca}</span>
                                                </div>

                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Categoría:</span>
                                                    <span className="font-medium text-gray-900 text-xs">
                                                        {epp.categoria}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Unidad:</span>
                                                    <span className="font-medium text-gray-900">
                                                        {epp.unidad_medida}
                                                    </span>
                                                </div>

                                                <div className="pt-3 mt-3 border-t border-gray-200">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm text-gray-600 font-medium">
                                                            Stock Disponible
                                                        </span>
                                                        <span
                                                            className={`text-lg font-bold ${estadoNumberClass(epp.estado)}`}
                                                        >
                                                            {epp.stock}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs text-gray-500">Stock mínimo:</span>
                                                        <span className="text-xs text-gray-700 font-medium">
                                                            {epp.stockMinimo} {epp.unidad_medida}
                                                        </span>
                                                    </div>

                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full transition-all ${progressClass(epp.estado)}`}
                                                            style={{
                                                                width: `${Math.min(
                                                                    epp.stockMinimo > 0
                                                                        ? (epp.stock / epp.stockMinimo) * 100
                                                                        : 100,
                                                                    100
                                                                )}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {epp.usa_tallas && (
                                                    <div className="pt-3">
                                                        <p className="text-xs font-medium text-gray-500 mb-2">
                                                            Stock por talla
                                                        </p>
                                                        {epp.tallas.length > 0 ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {epp.tallas.slice(0, 4).map((talla) => (
                                                                    <span
                                                                        key={talla.id}
                                                                        className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
                                                                    >
                                                                        {talla.talla}: {talla.stock_actual}
                                                                    </span>
                                                                ))}
                                                                {epp.tallas.length > 4 && (
                                                                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                                                                        +{epp.tallas.length - 4} más
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-gray-400">
                                                                Sin tallas registradas
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2 pt-3 border-t border-gray-200">
                                                <button
                                                    onClick={() => setSelectedEPP(epp)}
                                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Ver
                                                </button>

                                                <button
                                                    onClick={() => openEditModal(epp)}
                                                    className="flex items-center justify-center gap-2 bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 transition"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteEPP(epp)}
                                                    className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {selectedEPP && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                                <h3 className="text-xl font-bold text-gray-900">Detalles del EPP</h3>
                                <button
                                    onClick={() => setSelectedEPP(null)}
                                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                                        <div className="w-20 h-20 bg-blue-600 rounded-xl flex items-center justify-center">
                                            <HardHat className="w-10 h-10 text-white" />
                                        </div>

                                        <div className="flex-1">
                                            <h4 className="text-2xl font-bold text-gray-900 mb-1">
                                                {selectedEPP.nombre}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                {selectedEPP.codigo} • {selectedEPP.marca}
                                            </p>
                                        </div>

                                        <span
                                            className={`px-4 py-2 text-sm font-semibold rounded-full ${selectedEPP.estado === 'agotado'
                                                    ? 'bg-red-100 text-red-800'
                                                    : selectedEPP.estado === 'bajo_stock'
                                                        ? 'bg-orange-100 text-orange-800'
                                                        : 'bg-green-100 text-green-800'
                                                }`}
                                        >
                                            {estadoLabel(selectedEPP.estado)}
                                        </span>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-500 mb-1">Categoría</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {selectedEPP.categoria}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-500 mb-1">Marca</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {selectedEPP.marca}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-500 mb-1">Unidad</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {selectedEPP.unidad_medida}
                                        </p>
                                    </div>

                                    <div className="bg-green-50 rounded-lg p-4">
                                        <p className="text-sm text-green-700 mb-1">Stock Actual</p>
                                        <p className="text-2xl font-bold text-green-900">
                                            {selectedEPP.stock} unidades
                                        </p>
                                    </div>

                                    <div className="bg-orange-50 rounded-lg p-4">
                                        <p className="text-sm text-orange-700 mb-1">Stock Mínimo</p>
                                        <p className="text-2xl font-bold text-orange-900">
                                            {selectedEPP.stockMinimo} unidades
                                        </p>
                                    </div>

                                    {selectedEPP.usa_tallas && (
                                        <div className="col-span-2 bg-gray-50 rounded-lg p-4">
                                            <p className="text-sm text-gray-500 mb-3">Desglose por tallas</p>

                                            {selectedEPP.tallas.length > 0 ? (
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {selectedEPP.tallas.map((talla) => (
                                                        <div
                                                            key={talla.id}
                                                            className="rounded-lg bg-white border px-3 py-2"
                                                        >
                                                            <p className="text-xs text-gray-500">Talla</p>
                                                            <p className="font-semibold text-gray-900">
                                                                {talla.talla}
                                                            </p>
                                                            <p className="text-sm text-blue-700 mt-1">
                                                                Stock: {talla.stock_actual}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400">
                                                    No hay tallas registradas.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
                                <button
                                    onClick={() => setSelectedEPP(null)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cerrar
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedEPP(null);
                                        openEditModal(selectedEPP);
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Editar EPP
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showFormModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {editingEPP ? 'Editar EPP' : 'Registrar Nuevo EPP'}
                                </h3>
                                <button
                                    onClick={closeFormModal}
                                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={submit} className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    {editingEPP && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Código
                                            </label>
                                            <input
                                                type="text"
                                                value={editingEPP.codigo}
                                                disabled
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                                            />
                                        </div>
                                    )}

                                    <div className={editingEPP ? '' : 'col-span-2'}>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre del Equipo *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.nombre}
                                            onChange={(e) => setData('nombre', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                        {errors.nombre && (
                                            <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Categoría *
                                        </label>
                                        <select
                                            value={data.categoria}
                                            onChange={(e) => setData('categoria', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        >
                                            <option value="">Seleccionar categoría</option>
                                            <option value="Protección de Cabeza">Protección de Cabeza</option>
                                            <option value="Protección de Manos">Protección de Manos</option>
                                            <option value="Protección de Pies">Protección de Pies</option>
                                            <option value="Protección Ocular">Protección Ocular</option>
                                            <option value="Protección Ocular y Facial">Protección Ocular y Facial</option>
                                            <option value="Protección Respiratoria">Protección Respiratoria</option>
                                            <option value="Protección Auditiva">Protección Auditiva</option>
                                            <option value="Protección Corporal">Protección Corporal</option>
                                            <option value="Protección Anticaídas">Protección Anticaídas</option>
                                        </select>
                                        {errors.categoria && (
                                            <p className="text-sm text-red-500 mt-1">{errors.categoria}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Marca *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.marca}
                                            onChange={(e) => setData('marca', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                        {errors.marca && (
                                            <p className="text-sm text-red-500 mt-1">{errors.marca}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Unidad de Medida *
                                        </label>
                                        <select
                                            value={data.unidad_medida}
                                            onChange={(e) => setData('unidad_medida', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="unid.">Unidad</option>
                                            <option value="par">Par</option>
                                            <option value="caja">Caja</option>
                                            <option value="pack">Pack</option>
                                            <option value="set">Set</option>
                                            <option value="rollo">Rollo</option>
                                            <option value="m">Metro</option>
                                        </select>
                                        {errors.unidad_medida && (
                                            <p className="text-sm text-red-500 mt-1">{errors.unidad_medida}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Stock Mínimo *
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={data.stock_minimo}
                                            onChange={(e) => setData('stock_minimo', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                        {errors.stock_minimo && (
                                            <p className="text-sm text-red-500 mt-1">{errors.stock_minimo}</p>
                                        )}
                                    </div>

                                    <div className="col-span-2">
                                        <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
                                            <input
                                                type="checkbox"
                                                checked={data.usa_tallas}
                                                onChange={(e) => setData('usa_tallas', e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">Este EPP usa tallas</p>
                                                <p className="text-sm text-gray-500">
                                                    Ejemplo: zapatos, ropa, chalecos, guantes por talla
                                                </p>
                                            </div>
                                        </label>
                                        {errors.usa_tallas && (
                                            <p className="text-sm text-red-500 mt-1">{errors.usa_tallas}</p>
                                        )}
                                    </div>

                                    {!editingEPP && data.usa_tallas && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Talla Inicial
                                            </label>
                                            <input
                                                type="text"
                                                value={data.talla_inicial}
                                                onChange={(e) => setData('talla_inicial', e.target.value)}
                                                placeholder="Ej: S, M, L, 39, 40, 41"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            />
                                            {errors.talla_inicial && (
                                                <p className="text-sm text-red-500 mt-1">{errors.talla_inicial}</p>
                                            )}
                                        </div>
                                    )}

                                    {!editingEPP && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Stock Inicial *
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={data.stock_inicial}
                                                onChange={(e) => setData('stock_inicial', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            />
                                            {errors.stock_inicial && (
                                                <p className="text-sm text-red-500 mt-1">{errors.stock_inicial}</p>
                                            )}
                                        </div>
                                    )}

                                    {editingEPP && (
                                        <div className="col-span-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                                            El stock no se edita desde esta pantalla. Para aumentar stock usa la
                                            vista de <strong>Inventario / Ingresos</strong>.
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeFormModal}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                    >
                                        {processing
                                            ? 'Guardando...'
                                            : editingEPP
                                                ? 'Actualizar EPP'
                                                : 'Registrar EPP'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
