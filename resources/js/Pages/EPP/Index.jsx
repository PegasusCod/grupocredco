import { useEffect, useMemo, useRef, useState, memo, useCallback } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import {
    Search, Plus, Edit, Trash2, Eye, HardHat, X,
    Package, AlertTriangle, Camera, Upload, Warehouse,
    Tag, Ruler, ShieldCheck, Clock, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ESTADO_CONFIG = {
    DISPONIBLE: {
        label: "Disponible",
        badge: "bg-emerald-500 text-white",
        num: "text-emerald-600",
        bar: "bg-emerald-500",
        ring: "ring-emerald-200",
        bg: "bg-emerald-50",
    },
    BAJO_STOCK: {
        label: "Bajo stock",
        badge: "bg-amber-500 text-white",
        num: "text-amber-600",
        bar: "bg-amber-500",
        ring: "ring-amber-200",
        bg: "bg-amber-50",
    },
    AGOTADO: {
        label: "Agotado",
        badge: "bg-red-500 text-white",
        num: "text-red-600",
        bar: "bg-red-500",
        ring: "ring-red-200",
        bg: "bg-red-50",
    },
};

// ── Imagen EPP ────────────────────────────────────────────────────────────────
function EppImage({ src, nombre, size = "md" }) {
    const sizes = { sm: "w-12 h-12", md: "w-20 h-20", lg: "w-24 h-24" };
    if (src) {
        return (
            <img src={src} alt={nombre}
                className={`${sizes[size]} object-cover rounded-xl`}
                onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
        );
    }
    return (
        <div className={`${sizes[size]} rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center`}>
            <HardHat className={`${size === "lg" ? "w-10 h-10" : size === "md" ? "w-8 h-8" : "w-6 h-6"} text-slate-400`} />
        </div>
    );
}

// ──  EppCard definido FUERA del componente principal ─────────────────────
const EppCard = memo(({ epp, onView, onEdit, onDelete }) => {
    const cfg = ESTADO_CONFIG[epp.estado] ?? ESTADO_CONFIG.DISPONIBLE;
    const pct = epp.stock_minimo > 0
        ? Math.min((epp.stock / epp.stock_minimo) * 100, 100)
        : 100;

    return (
        <div
            className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">

            {/* ── Zona imagen ── */}
            <div className="relative h-44 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center overflow-hidden">
                {epp.foto_url ? (
                    <img
                        src={epp.foto_url}
                        alt={epp.nombre}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                        <HardHat className="w-16 h-16 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="absolute top-3 left-3 font-mono text-[10px] bg-white/90 text-slate-600 px-2 py-1 rounded-md font-semibold shadow-sm">
                    {epp.codigo}
                </span>
                <span className={`absolute top-3 right-3 px-2.5 py-1 text-[11px] font-bold rounded-full shadow-sm ${cfg.badge}`}>
                    {cfg.label}
                </span>
            </div>

            {/* ── Body ── */}
            <div className="p-4 flex flex-col flex-1">
                <h4 className="font-bold text-slate-900 mb-1 line-clamp-1">{epp.nombre}</h4>
                <p className="text-xs text-slate-400 mb-3">{epp.categoria ?? "Sin categoría"} · {epp.marca ?? "—"}</p>

                <div className="mt-auto">
                    <div className="flex items-end justify-between mb-1">
                        <span className="text-xs text-slate-500">Stock disponible</span>
                        <span className="text-xs text-slate-400">Mín {epp.stock_minimo}</span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                        <span className={`text-3xl font-black tabular-nums ${cfg.num}`}>{epp.stock}</span>
                        <span className="text-xs text-slate-400 mb-1">{epp.unidad_medida}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                        <div className={`h-1.5 rounded-full transition-all ${cfg.bar}`} style={{ width: `${pct}%` }} />
                    </div>

                    {/* Desglose por talla */}
                    {epp.usa_tallas && (epp.skus ?? []).length > 0 && (() => {
                        const tallasConStock = (epp.skus ?? [])
                            .map(sku => ({
                                nombre: sku.talla_nombre,
                                qty: (sku.stocks_por_almacen ?? [])
                                    .filter(s => s.estado_stock === "DISPONIBLE")
                                    .reduce((s, b) => s + (b.cantidad_actual || 0), 0),
                            }))
                            .filter(t => t.qty > 0);

                        const visibles = tallasConStock.slice(0, 4);
                        const restantes = tallasConStock.length - 4;

                        if (visibles.length === 0) return null;

                        return (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {visibles.map(t => (
                                    <div key={t.nombre}
                                        className="flex items-center gap-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                                        <span className="text-slate-500 font-medium">{t.nombre}</span>
                                        <span className={`font-bold ${t.qty <= epp.stock_minimo ? "text-red-500" : "text-emerald-600"}`}>
                                            {t.qty}
                                        </span>
                                    </div>
                                ))}
                                {restantes > 0 && (
                                    <div
                                        className="flex items-center text-[11px] bg-blue-50 border border-blue-200 text-blue-600 rounded-lg px-2 py-1 font-semibold cursor-pointer"
                                        onClick={() => onView(epp)}>
                                        +{restantes} más
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Acciones */}
                    <div className="flex gap-1.5 border-t pt-3">
                        <Button size="sm" variant="outline"
                            className="flex-1 h-8 text-xs gap-1 rounded-lg"
                            onClick={() => onView(epp)}>
                            <Eye className="w-3.5 h-3.5" /> Ver detalle
                        </Button>
                        <Button size="sm" variant="outline"
                            className="h-8 w-8 p-0 rounded-lg text-blue-600 border-blue-100 hover:bg-blue-50"
                            onClick={() => onEdit(epp)}>
                            <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline"
                            className="h-8 w-8 p-0 rounded-lg text-red-500 border-red-100 hover:bg-red-50"
                            onClick={() => onDelete(epp)}>
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
});

// ── Componente principal ──────────────────────────────────────────────────────

export default function EppIndex({
    epps = [],
    categorias = [],
    tallas = [],
    almacenes = [],
}) {
    const { flash = {} } = usePage().props;
    const fotoRef = useRef(null);

    const [searchInput, setSearchInput]       = useState("");   // valor visual del input
    const [searchTerm, setSearchTerm]         = useState("");   // valor real usado en el filtro (con debounce)
    const [selectedAlmacen, setSelectedAlmacen]   = useState("");
    const [selectedCategoria, setSelectedCategoria] = useState("todas");
    const [selectedEstado, setSelectedEstado]     = useState("todos");
    const [selectedEPP, setSelectedEPP]       = useState(null);
    const [showFormModal, setShowFormModal]   = useState(false);
    const [editingEPP, setEditingEPP]         = useState(null);
    const [fotoPreview, setFotoPreview]       = useState(null);

    // ── Debounce: espera 300ms tras el último keystroke para filtrar ──────────
    useEffect(() => {
        const timer = setTimeout(() => setSearchTerm(searchInput), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // ── Memoizado fuera del render ────────────────────────────────────────────
    const almacenesOperativos = useMemo(
        () => almacenes.filter(a => a.tipo_almacen === "OPERATIVO"),
        [almacenes]
    );

    const almacenActivo = useMemo(
        () => almacenes.find(a => String(a.id) === String(selectedAlmacen)),
        [almacenes, selectedAlmacen]
    );

    // Default almacén al montar
    useEffect(() => {
        if (!selectedAlmacen && almacenes.length > 0) {
            const def = almacenesOperativos.find(a =>
                a.nombre.toLowerCase().includes("obras civiles")
            ) ?? almacenesOperativos[0] ?? almacenes[0];
            if (def) setSelectedAlmacen(String(def.id));
        }
    }, [almacenes]);

    // ── Handlers memoizados con useCallback ──────────────────────────────────
    // NECESARIO para que memo() en EppCard funcione: si las funciones cambian
    // de referencia en cada render, memo() no puede evitar el re-render.
    const handleView   = useCallback((epp) => setSelectedEPP(epp), []);
    const handleDelete = useCallback((epp) => {
        if (!confirm(`¿Desactivar "${epp.nombre}"?`)) return;
        router.delete(route("epp.destroy", epp.id), { preserveScroll: true });
    }, []);

    // ── Formulario ────────────────────────────────────────────────────────────

    const emptyForm = {
        nombre: "", categoria_id: "", marca: "",
        unidad_medida: "UND", stock_minimo: 10,
        vida_util_meses: "", usa_tallas: false,
        almacen_id: "", stock_inicial: 0, tallas_stock: [],
        imagen_url: null,
    };

    const { data, setData, post, processing, reset, clearErrors, errors } = useForm(emptyForm);

    const openCreate = useCallback(() => {
        setEditingEPP(null); setFotoPreview(null);
        setData({ ...emptyForm, tallas_stock: [] }); clearErrors(); setShowFormModal(true);
    }, []);

    const openEdit = useCallback((epp) => {
        setEditingEPP(epp); setFotoPreview(epp.foto_url ?? null);
        setData({
            nombre: epp.nombre ?? "", categoria_id: epp.categoria_id ? String(epp.categoria_id) : "",
            marca: epp.marca ?? "", unidad_medida: epp.unidad_medida ?? "UND",
            stock_minimo: epp.stock_minimo ?? 10, vida_util_meses: epp.vida_util_meses ?? "",
            usa_tallas: !!epp.usa_tallas, almacen_id: "", stock_inicial: 0, tallas_stock: [], imagen_url: null,
        });
        clearErrors(); setShowFormModal(true);
    }, []);

    const closeFormModal = useCallback(() => {
        setShowFormModal(false); setEditingEPP(null);
        setFotoPreview(null); reset(); clearErrors();
    }, []);

    const handleFotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData("imagen_url", file);
        setFotoPreview(URL.createObjectURL(file));
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingEPP) {
            router.post(route("epp.update", editingEPP.id), {
                ...data,
                _method: "PUT",
            }, {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: closeFormModal,
            });
        } else {
            post(route("epp.store"), {
                preserveScroll: true,
                onSuccess: closeFormModal,
                forceFormData: true,
            });
        }
    };

    const addTallaStock    = () => setData("tallas_stock", [...data.tallas_stock, { talla_id: "", almacen_id: "", cantidad: 0 }]);
    const removeTallaStock = (i) => setData("tallas_stock", data.tallas_stock.filter((_, idx) => idx !== i));
    const updateTallaStock = (i, f, v) => {
        const arr = [...data.tallas_stock]; arr[i] = { ...arr[i], [f]: v }; setData("tallas_stock", arr);
    };

    // ── Filtros ───────────────────────────────────────────────────────────────

    const filtered = useMemo(() => {
        return epps.map(epp => {
            if (!selectedAlmacen) return epp;
            const skusFiltrados = (epp.skus ?? [])
                .map(sku => ({
                    ...sku,
                    stocks_por_almacen: (sku.stocks_por_almacen ?? [])
                        .filter(s => String(s.almacen_id) === String(selectedAlmacen)),
                }))
                .filter(sku => sku.stocks_por_almacen.length > 0);

            const stockAlmacen = skusFiltrados.reduce((sum, sku) =>
                sum + sku.stocks_por_almacen
                    .filter(s => s.estado_stock === "DISPONIBLE")
                    .reduce((a, b) => a + (b.cantidad_actual || 0), 0), 0);

            let estado = "DISPONIBLE";
            if (stockAlmacen === 0) estado = "AGOTADO";
            else if (stockAlmacen <= epp.stock_minimo) estado = "BAJO_STOCK";

            return { ...epp, skus: skusFiltrados, stock: stockAlmacen, estado };
        }).filter(epp => {
            if (selectedAlmacen && (epp.skus ?? []).length === 0) return false;
            const term = searchTerm.trim().toLowerCase();
            const matchSearch = !term || epp.nombre.toLowerCase().includes(term)
                || epp.codigo.toLowerCase().includes(term)
                || (epp.marca ?? "").toLowerCase().includes(term);
            const matchCat    = selectedCategoria === "todas" || String(epp.categoria_id) === String(selectedCategoria);
            const matchEstado = selectedEstado === "todos" || epp.estado === selectedEstado;
            return matchSearch && matchCat && matchEstado;
        });
    }, [epps, searchTerm, selectedCategoria, selectedEstado, selectedAlmacen]);

    const stats = useMemo(() => ({
        total:       filtered.reduce((s, e) => s + (e.stock || 0), 0),
        bajo_stock:  filtered.filter(e => e.estado === "BAJO_STOCK").length,
        agotados:    filtered.filter(e => e.estado === "AGOTADO").length,
        disponibles: filtered.filter(e => e.estado === "DISPONIBLE").length,
    }), [filtered]);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <Head title="EPP Disponibles" />

            <div className="flex-1 overflow-auto bg-slate-50/60">

                {/* ── Header ── */}
                <div className="bg-white border-b px-8 py-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">EPP Disponibles</h2>
                        <p className="text-slate-500 mt-0.5 text-sm">Catálogo de equipos de protección personal</p>
                    </div>
                    <Button onClick={openCreate} className="gap-2 bg-slate-900 hover:bg-slate-700 text-white shadow">
                        <Plus className="w-4 h-4" /> Nuevo EPP
                    </Button>
                </div>

                <div className="p-8 space-y-5">

                    {/* Flash */}
                    {flash.success && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 text-sm flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 shrink-0" /> {flash.success}
                        </div>
                    )}
                    {flash.error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" /> {flash.error}
                        </div>
                    )}

                    {/* Banner almacén activo */}
                    {almacenActivo && (
                        <div className="rounded-xl bg-blue-600 px-5 py-3 text-white flex items-center gap-3 shadow-sm">
                            <Warehouse className="w-5 h-5 opacity-80" />
                            <span className="text-sm">Mostrando stock de:</span>
                            <span className="font-bold">{almacenActivo.nombre}</span>
                        </div>
                    )}

                    {/* KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total en stock", value: stats.total,       color: "text-slate-800",   icon: Package },
                            { label: "Bajo stock",     value: stats.bajo_stock,  color: "text-amber-600",   icon: AlertTriangle },
                            { label: "Agotados",       value: stats.agotados,    color: "text-red-600",     icon: AlertTriangle },
                            { label: "Disponibles",    value: stats.disponibles, color: "text-emerald-600", icon: ShieldCheck },
                        ].map(({ label, value, color, icon: Icon }) => (
                            <Card key={label} className="border shadow-sm">
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
                                        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100">
                                        <Icon className={`w-5 h-5 ${color}`} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Filtros */}
                    <Card className="border shadow-sm">
                        <CardContent className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="lg:col-span-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        className="pl-9 h-10"
                                        placeholder="Nombre, código, marca..."
                                        value={searchInput}
                                        onChange={e => setSearchInput(e.target.value)}
                                    />
                                </div>

                                <select value={selectedAlmacen} onChange={e => setSelectedAlmacen(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium">
                                    <option value="">Todos los almacenes</option>
                                    {almacenesOperativos.map(a => (
                                        <option key={a.id} value={a.id}>{a.nombre}</option>
                                    ))}
                                </select>

                                <select value={selectedCategoria} onChange={e => setSelectedCategoria(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="todas">Todas las categorías</option>
                                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>

                                <select value={selectedEstado} onChange={e => setSelectedEstado(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="todos">Todos los estados</option>
                                    <option value="DISPONIBLE">Disponible</option>
                                    <option value="BAJO_STOCK">Bajo stock</option>
                                    <option value="AGOTADO">Agotado</option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Grid de tarjetas */}
                    <div>
                        <p className="text-sm text-slate-500 mb-4 font-medium">
                            {filtered.length} equipo{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
                            {epps.length !== filtered.length && ` de ${epps.length}`}
                        </p>

                        {filtered.length === 0 ? (
                            <Card className="border border-dashed">
                                <CardContent className="py-20 text-center text-slate-400">
                                    <HardHat className="w-14 h-14 mx-auto mb-4 opacity-20" />
                                    <p className="font-medium">No se encontraron equipos</p>
                                    <p className="text-sm mt-1">Intenta con otros filtros</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {filtered.map(epp => (
                                    // return directo de EppCard, sin JSX duplicado debajo
                                    <EppCard
                                        key={epp.id}
                                        epp={epp}
                                        onView={handleView}
                                        onEdit={openEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════════ MODAL DETALLE ═══════════════ */}
            {selectedEPP && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Header modal */}
                        <div className="relative">
                            <div className="h-40 bg-gradient-to-br from-slate-700 to-slate-900 overflow-hidden">
                                {selectedEPP.foto_url ? (
                                    <img src={selectedEPP.foto_url} alt={selectedEPP.nombre}
                                        className="w-full h-full object-cover opacity-60" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <HardHat className="w-20 h-20 text-white/20" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <div className="flex items-end justify-between gap-3">
                                    <div className="min-w-0">
                                        <span className="text-slate-400 text-xs font-mono">{selectedEPP.codigo}</span>
                                        <h3 className="text-white text-lg font-bold leading-tight truncate">{selectedEPP.nombre}</h3>
                                        <p className="text-slate-300 text-xs">{selectedEPP.marca ?? "Sin marca"}</p>
                                    </div>
                                    <span className={`shrink-0 px-3 py-1 text-xs font-bold rounded-full ${ESTADO_CONFIG[selectedEPP.estado]?.badge}`}>
                                        {ESTADO_CONFIG[selectedEPP.estado]?.label}
                                    </span>
                                </div>
                            </div>

                            <button onClick={() => setSelectedEPP(null)}
                                className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body modal */}
                        <div className="overflow-y-auto flex-1 p-5 space-y-4">

                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { icon: Tag,     label: "Categoría", value: selectedEPP.categoria ?? "—" },
                                    { icon: Ruler,   label: "Unidad",    value: selectedEPP.unidad_medida },
                                    { icon: Clock,   label: "Vida útil", value: selectedEPP.vida_util_meses ? `${selectedEPP.vida_util_meses} meses` : "—" },
                                    { icon: Package, label: "Stock mín.", value: selectedEPP.stock_minimo },
                                ].map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 p-3 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                                            <Icon className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-slate-400">{label}</p>
                                            <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={`rounded-xl p-4 ${ESTADO_CONFIG[selectedEPP.estado]?.bg ?? "bg-slate-50"} border border-slate-100`}>
                                <p className="text-xs text-slate-500 font-medium mb-1">Stock total disponible</p>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-4xl font-black tabular-nums ${ESTADO_CONFIG[selectedEPP.estado]?.num}`}>
                                        {selectedEPP.stock}
                                    </span>
                                    <span className="text-sm text-slate-500">{selectedEPP.unidad_medida}</span>
                                </div>
                            </div>

                            {selectedEPP.usa_tallas && (selectedEPP.skus ?? []).length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                        Stock por talla
                                    </p>
                                    <div className="space-y-2">
                                        {(selectedEPP.skus ?? []).map((sku) => {
                                            const stockTotalTalla = (sku.stocks_por_almacen ?? [])
                                                .filter(s => s.estado_stock === "DISPONIBLE")
                                                .reduce((total, s) => total + (Number(s.cantidad_actual) || 0), 0);

                                            const stockMinimoTalla = (sku.stocks_por_almacen ?? [])
                                                .reduce((min, s) => {
                                                    const value = Number(s.stock_minimo) || 0;
                                                    return min === null ? value : Math.min(min, value);
                                                }, null);

                                            return (
                                                <div key={sku.id}
                                                    className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                                                    <div>
                                                        <p className="text-xs text-slate-400"></p>
                                                        <p className="text-sm font-semibold text-slate-700">
                                                            {sku.talla_nombre ?? "Sin talla"}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-slate-400">Stock</p>
                                                        <span className={`text-2xl font-black tabular-nums ${stockTotalTalla <= (stockMinimoTalla ?? 0) ? "text-red-500" : "text-emerald-600"}`}>
                                                            {stockTotalTalla}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer modal */}
                        <div className="p-4 border-t bg-slate-50 flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setSelectedEPP(null)}>Cerrar</Button>
                            <Button className="flex-1 bg-slate-900 hover:bg-slate-700 text-white"
                                onClick={() => { const e = selectedEPP; setSelectedEPP(null); openEdit(e); }}>
                                <Edit className="w-4 h-4 mr-2" /> Editar EPP
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════ MODAL CREAR / EDITAR ═══════════════ */}
            {showFormModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

                        {/* Header */}
                        <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {editingEPP ? "Editar EPP" : "Registrar nuevo EPP"}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {editingEPP ? `Código: ${editingEPP.codigo}` : "Completa los datos del equipo"}
                                </p>
                            </div>
                            <button onClick={closeFormModal}
                                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors">
                                <X className="w-4 h-4 text-slate-600" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-6">
                            <form id="epp-form" onSubmit={submit} className="space-y-5">

                                {/* Foto */}
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50 shrink-0">
                                        {fotoPreview ? (
                                            <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera className="w-8 h-8 text-slate-300" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-700 mb-1">Foto del EPP</p>
                                        <p className="text-xs text-slate-400 mb-3">JPG, PNG o WEBP. Máx. 2 MB.</p>
                                        <button type="button"
                                            onClick={() => fotoRef.current?.click()}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors">
                                            <Upload className="w-4 h-4" />
                                            {fotoPreview ? "Cambiar foto" : "Subir foto"}
                                        </button>
                                        <input ref={fotoRef} type="file" accept="image/*"
                                            onChange={handleFotoChange} className="hidden" />
                                        {fotoPreview && (
                                            <button type="button"
                                                onClick={() => { setFotoPreview(null); setData("imagen_url", null); }}
                                                className="mt-2 text-xs text-red-500 hover:underline">
                                                Quitar foto
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100" />

                                {/* Campos principales */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Nombre *</Label>
                                        <Input value={data.nombre}
                                            onChange={e => setData("nombre", e.target.value)}
                                            placeholder="Ej: Botas de Seguridad"
                                            className="h-10" />
                                        {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Categoría *</Label>
                                        <select value={data.categoria_id}
                                            onChange={e => setData("categoria_id", e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                            <option value="">Seleccionar...</option>
                                            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                        </select>
                                        {errors.categoria_id && <p className="text-xs text-red-500">{errors.categoria_id}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Marca</Label>
                                        <Input value={data.marca} onChange={e => setData("marca", e.target.value)} className="h-10" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Unidad *</Label>
                                        <select value={data.unidad_medida}
                                            onChange={e => setData("unidad_medida", e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                            {["UND", "PAR", "CAJA", "PACK", "SET", "ROLLO", "M"].map(u => <option key={u}>{u}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Stock mínimo *</Label>
                                        <Input type="number" min="0" value={data.stock_minimo}
                                            onChange={e => setData("stock_minimo", Number(e.target.value))}
                                            className="h-10" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Vida útil (meses)</Label>
                                        <Input type="number" min="1" value={data.vida_util_meses}
                                            onChange={e => setData("vida_util_meses", e.target.value)}
                                            placeholder="Ej: 6" className="h-10" />
                                    </div>

                                    {/* Usa tallas */}
                                    <div className="col-span-2">
                                        <label className="flex items-center gap-3 rounded-xl border-2 border-slate-100 hover:border-slate-200 p-4 cursor-pointer transition-colors">
                                            <input type="checkbox" checked={data.usa_tallas}
                                                onChange={e => { setData("usa_tallas", e.target.checked); setData("tallas_stock", []); }}
                                                className="h-4 w-4 accent-slate-800" />
                                            <div>
                                                <p className="font-semibold text-slate-800">Este EPP usa tallas</p>
                                                <p className="text-xs text-slate-400 mt-0.5">Ej: calzado, ropa, guantes por talla</p>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Sin tallas: stock inicial */}
                                    {!editingEPP && !data.usa_tallas && (
                                        <>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Almacén de ingreso</Label>
                                                <select value={data.almacen_id}
                                                    onChange={e => setData("almacen_id", e.target.value)}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                                    <option value="">Sin stock inicial</option>
                                                    {almacenes.filter(a => a.tipo_almacen === "OPERATIVO").map(a =>
                                                        <option key={a.id} value={a.id}>{a.nombre}</option>
                                                    )}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Stock inicial</Label>
                                                <Input type="number" min="0" value={data.stock_inicial}
                                                    onChange={e => setData("stock_inicial", Number(e.target.value))}
                                                    className="h-10" />
                                            </div>
                                        </>
                                    )}

                                    {/* Con tallas */}
                                    {!editingEPP && data.usa_tallas && (
                                        <div className="col-span-2 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Stock inicial por talla</Label>
                                                <Button type="button" size="sm" variant="outline" onClick={addTallaStock}
                                                    className="h-8 text-xs gap-1">
                                                    <Plus className="w-3 h-3" /> Agregar talla
                                                </Button>
                                            </div>
                                            {data.tallas_stock.length === 0 && (
                                                <p className="text-xs text-slate-400 text-center py-3 border-2 border-dashed border-slate-100 rounded-xl">
                                                    Agrega al menos una talla con su stock inicial
                                                </p>
                                            )}
                                            {data.tallas_stock.map((ts, i) => (
                                                <div key={i} className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 items-end bg-slate-50 p-3 rounded-xl">
                                                    <div>
                                                        <Label className="text-[10px] text-slate-500 uppercase">Talla</Label>
                                                        <select value={ts.talla_id}
                                                            onChange={e => updateTallaStock(i, "talla_id", e.target.value)}
                                                            className="mt-1 flex h-9 w-full rounded-md border border-input bg-white px-2 py-1 text-sm">
                                                            <option value="">Seleccionar...</option>
                                                            {tallas.map(t => <option key={t.id} value={t.id}>{t.codigo}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] text-slate-500 uppercase">Almacén</Label>
                                                        <select value={ts.almacen_id}
                                                            onChange={e => updateTallaStock(i, "almacen_id", e.target.value)}
                                                            className="mt-1 flex h-9 w-full rounded-md border border-input bg-white px-2 py-1 text-sm">
                                                            <option value="">Seleccionar...</option>
                                                            {almacenes.filter(a => a.tipo_almacen === "OPERATIVO").map(a =>
                                                                <option key={a.id} value={a.id}>{a.nombre}</option>
                                                            )}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] text-slate-500 uppercase">Cant.</Label>
                                                        <Input type="number" min="0" value={ts.cantidad}
                                                            onChange={e => updateTallaStock(i, "cantidad", Number(e.target.value))}
                                                            className="mt-1 h-9" />
                                                    </div>
                                                    <button type="button" onClick={() => removeTallaStock(i)}
                                                        className="h-9 w-8 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Nota edición */}
                                    {editingEPP && (
                                        <div className="col-span-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
                                            <Package className="w-4 h-4 shrink-0" />
                                            Para modificar el stock usa <strong>Ingresos de EPP</strong>.
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={closeFormModal} className="px-6">
                                Cancelar
                            </Button>
                            <Button type="submit" form="epp-form" disabled={processing}
                                className="px-6 bg-slate-900 hover:bg-slate-700 text-white">
                                {processing ? "Guardando..." : editingEPP ? "Actualizar EPP" : "Registrar EPP"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}