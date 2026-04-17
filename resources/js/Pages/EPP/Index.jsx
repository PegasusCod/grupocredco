import { useMemo, useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import { Search, Plus, Edit, Trash2, Eye, HardHat, X, Package, AlertTriangle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ESTADO_CONFIG = {
    DISPONIBLE: { label: "Disponible", badge: "bg-green-500 text-white",    num: "text-green-600",  bar: "bg-green-600"  },
    BAJO_STOCK: { label: "Bajo stock", badge: "bg-orange-500 text-white",   num: "text-orange-600", bar: "bg-orange-600" },
    AGOTADO:    { label: "Agotado",    badge: "bg-red-500 text-white",      num: "text-red-600",    bar: "bg-red-600"    },
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function EppIndex({
    epps       = [],   // mapeados por EppController::mapEpp()
    categorias = [],   // EppCategoria[]  { id, nombre }
    tallas     = [],   // Talla[]         { id, codigo, nombre }
    almacenes  = [],   // Almacen[]       { id, nombre, proyecto_id }
}) {
    const { flash = {} } = usePage().props;

    const [searchTerm, setSearchTerm]           = useState("");
    const [selectedCategoria, setSelectedCategoria] = useState("todas");
    const [selectedEstado, setSelectedEstado]   = useState("todos");
    const [selectedEPP, setSelectedEPP]         = useState(null);
    const [showFormModal, setShowFormModal]     = useState(false);
    const [editingEPP, setEditingEPP]           = useState(null);

    // ── Formulario ────────────────────────────────────────────────────────────

    const emptyForm = {
        nombre:          "",
        categoria_id:    "",   // ← FK a epp_categorias
        marca:           "",
        unidad_medida:   "UND",
        stock_minimo:    10,
        vida_util_meses: "",
        usa_tallas:      false,
        // Sin tallas: stock inicial en un almacén
        almacen_id:      "",
        stock_inicial:   0,
        // Con tallas: array [{talla_id, almacen_id, cantidad}]
        tallas_stock:    [],
    };

    const { data, setData, post, put, processing, reset, clearErrors, errors } = useForm(emptyForm);

    const openCreate = () => {
        setEditingEPP(null);
        setData({ ...emptyForm, tallas_stock: [] });
        clearErrors();
        setShowFormModal(true);
    };

    const openEdit = (epp) => {
        setEditingEPP(epp);
        setData({
            nombre:          epp.nombre          ?? "",
            categoria_id:    epp.categoria_id    ? String(epp.categoria_id) : "",
            marca:           epp.marca           ?? "",
            unidad_medida:   epp.unidad_medida   ?? "UND",
            stock_minimo:    epp.stock_minimo     ?? 10,
            vida_util_meses: epp.vida_util_meses ?? "",
            usa_tallas:      !!epp.usa_tallas,
            almacen_id:      "",
            stock_inicial:   0,
            tallas_stock:    [],
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
            put(route("epp.update", editingEPP.id), { preserveScroll: true, onSuccess: closeFormModal });
        } else {
            post(route("epp.store"), { preserveScroll: true, onSuccess: closeFormModal });
        }
    };

    const handleDelete = (epp) => {
        if (!confirm(`¿Desactivar "${epp.nombre}"?`)) return;
        router.delete(route("epp.destroy", epp.id), { preserveScroll: true });
    };

    // Gestión de tallas_stock para el formulario
    const addTallaStock = () => {
        setData("tallas_stock", [...data.tallas_stock, { talla_id: "", almacen_id: "", cantidad: 0 }]);
    };
    const removeTallaStock = (i) => {
        setData("tallas_stock", data.tallas_stock.filter((_, idx) => idx !== i));
    };
    const updateTallaStock = (i, field, value) => {
        const arr = [...data.tallas_stock];
        arr[i] = { ...arr[i], [field]: value };
        setData("tallas_stock", arr);
    };

    // ── Filtros locales ───────────────────────────────────────────────────────

    const filtered = useMemo(() => epps.filter(epp => {
        const term = searchTerm.trim().toLowerCase();
        const matchSearch = !term || epp.nombre.toLowerCase().includes(term)
            || epp.codigo.toLowerCase().includes(term)
            || (epp.marca ?? "").toLowerCase().includes(term);
        const matchCat    = selectedCategoria === "todas" || String(epp.categoria_id) === String(selectedCategoria);
        const matchEstado = selectedEstado === "todos"    || epp.estado === selectedEstado;
        return matchSearch && matchCat && matchEstado;
    }), [epps, searchTerm, selectedCategoria, selectedEstado]);

    const stats = useMemo(() => ({
        total:      epps.reduce((s, e) => s + (e.stock || 0), 0),
        bajo_stock: epps.filter(e => e.estado === "BAJO_STOCK").length,
        agotados:   epps.filter(e => e.estado === "AGOTADO").length,
        disponibles: epps.filter(e => e.estado === "DISPONIBLE").length,
    }), [epps]);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <Head title="EPP Disponibles" />

            <div className="flex-1 overflow-auto bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b px-8 py-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">EPP Disponibles</h2>
                        <p className="text-gray-600 mt-1">Catálogo de equipos de protección personal</p>
                    </div>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="w-5 h-5" /> Nuevo EPP
                    </Button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Flash */}
                    {flash.success && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800">{flash.success}</div>}
                    {flash.error   && <div className="rounded-xl border border-red-200   bg-red-50   px-4 py-3 text-red-800"  >{flash.error}</div>}

                    {/* KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total en stock",  value: stats.total,       icon: Package,       cls: "" },
                            { label: "Bajo stock",      value: stats.bajo_stock,  icon: AlertTriangle, cls: "text-orange-600" },
                            { label: "Agotados",        value: stats.agotados,    icon: AlertTriangle, cls: "text-red-600" },
                            { label: "Disponibles",     value: stats.disponibles, icon: HardHat,       cls: "text-blue-600" },
                        ].map(({ label, value, icon: Icon, cls }) => (
                            <Card key={label}>
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{label}</p>
                                        <p className={`text-3xl font-bold ${cls}`}>{value}</p>
                                    </div>
                                    <Icon className={`w-6 h-6 ${cls || "text-muted-foreground"}`} />
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Filtros */}
                    <Card>
                        <CardContent className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-2 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input className="pl-9" placeholder="Nombre, código, marca..."
                                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
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
                        <p className="text-sm text-muted-foreground mb-4">
                            Mostrando {filtered.length} de {epps.length} equipos
                        </p>

                        {filtered.length === 0 ? (
                            <Card><CardContent className="py-16 text-center text-muted-foreground">
                                <HardHat className="w-14 h-14 mx-auto mb-3 opacity-30" />
                                <p>No se encontraron equipos con los filtros actuales</p>
                            </CardContent></Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {filtered.map(epp => {
                                    const cfg = ESTADO_CONFIG[epp.estado] ?? ESTADO_CONFIG.DISPONIBLE;
                                    const pct = epp.stock_minimo > 0
                                        ? Math.min((epp.stock / epp.stock_minimo) * 100, 100)
                                        : 100;

                                    return (
                                        <div key={epp.id} className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all overflow-hidden group">
                                            {/* Imagen */}
                                            <div className="h-40 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative">
                                                <HardHat className="w-20 h-20 text-blue-600 group-hover:scale-110 transition-transform" />
                                                <span className="absolute top-3 left-3 font-mono text-xs bg-white/80 px-2 py-1 rounded">{epp.codigo}</span>
                                                <span className={`absolute top-3 right-3 px-2 py-1 text-xs font-semibold rounded-full ${cfg.badge}`}>{cfg.label}</span>
                                            </div>

                                            {/* Body */}
                                            <div className="p-4">
                                                <h4 className="font-bold text-base text-gray-900 mb-3 line-clamp-2 min-h-[2.5rem]">{epp.nombre}</h4>

                                                <div className="space-y-1.5 text-sm mb-3">
                                                    {[["Marca", epp.marca], ["Categoría", epp.categoria], ["Unidad", epp.unidad_medida]].map(([l, v]) => (
                                                        <div key={l} className="flex justify-between">
                                                            <span className="text-muted-foreground">{l}:</span>
                                                            <span className="font-medium">{v ?? "—"}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Stock */}
                                                <div className="border-t pt-3">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm text-muted-foreground">Stock disponible</span>
                                                        <span className="text-xs text-muted-foreground">Mín: {epp.stock_minimo}</span>
                                                    </div>
                                                    <p className={`text-2xl font-bold ${cfg.num} mb-1`}>{epp.stock}</p>
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                                                        <div className={`h-1.5 rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
                                                    </div>

                                                    {/* Tallas (skus) */}
                                                    {epp.usa_tallas && epp.skus?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                                            {epp.skus.slice(0, 4).map(s => (
                                                                <span key={s.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                                                                    {s.talla}: {s.stock_disponible}
                                                                </span>
                                                            ))}
                                                            {epp.skus.length > 4 && (
                                                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">+{epp.skus.length - 4}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Acciones */}
                                                <div className="flex gap-2 pt-2 border-t">
                                                    <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => setSelectedEPP(epp)}>
                                                        <Eye className="w-3.5 h-3.5" /> Ver
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="gap-1 text-emerald-600" onClick={() => openEdit(epp)}>
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="gap-1 text-red-600" onClick={() => handleDelete(epp)}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Modal Detalle EPP ── */}
            {selectedEPP && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-xl w-full max-h-[85vh] overflow-y-auto">
                        <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white">
                            <h3 className="text-lg font-bold">Detalle del EPP</h3>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedEPP(null)}><X className="w-5 h-5" /></Button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
                                    <HardHat className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-bold">{selectedEPP.nombre}</h4>
                                    <p className="text-sm text-muted-foreground">{selectedEPP.codigo} · {selectedEPP.marca}</p>
                                </div>
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${ESTADO_CONFIG[selectedEPP.estado]?.badge}`}>
                                    {ESTADO_CONFIG[selectedEPP.estado]?.label}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    ["Categoría",    selectedEPP.categoria],
                                    ["Unidad",       selectedEPP.unidad_medida],
                                    ["Vida útil",    selectedEPP.vida_util_meses ? `${selectedEPP.vida_util_meses} meses` : "—"],
                                    ["Stock mínimo", selectedEPP.stock_minimo],
                                ].map(([l, v]) => (
                                    <div key={l} className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-muted-foreground">{l}</p>
                                        <p className="font-semibold">{v}</p>
                                    </div>
                                ))}
                                <div className="bg-green-50 rounded-lg p-3">
                                    <p className="text-xs text-green-700">Stock total</p>
                                    <p className="text-2xl font-bold text-green-900">{selectedEPP.stock}</p>
                                </div>
                            </div>

                            {selectedEPP.usa_tallas && selectedEPP.skus?.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm font-medium text-muted-foreground mb-3">Desglose por talla / almacén</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {selectedEPP.skus.map(sku => (
                                            <div key={sku.id} className="bg-white border rounded-lg p-2">
                                                <p className="text-xs text-muted-foreground">Talla</p>
                                                <p className="font-semibold">{sku.talla_nombre}</p>
                                                <p className="text-sm text-blue-700">Stock: {sku.stock_disponible}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-5 border-t flex justify-end gap-2 sticky bottom-0 bg-white">
                            <Button variant="outline" onClick={() => setSelectedEPP(null)}>Cerrar</Button>
                            <Button onClick={() => { setSelectedEPP(null); openEdit(selectedEPP); }}>Editar EPP</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal Crear / Editar EPP ── */}
            <Dialog open={showFormModal} onOpenChange={open => !open && closeFormModal()}>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingEPP ? "Editar EPP" : "Nuevo EPP"}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-5 p-1">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Nombre */}
                            <div className="col-span-2 space-y-1.5">
                                <Label>Nombre *</Label>
                                <Input value={data.nombre} onChange={e => setData("nombre", e.target.value)} placeholder="Ej: Botas de Seguridad" />
                                {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
                            </div>

                            {/* Categoría */}
                            <div className="space-y-1.5">
                                <Label>Categoría *</Label>
                                <select value={data.categoria_id} onChange={e => setData("categoria_id", e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="">Seleccionar...</option>
                                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                                {errors.categoria_id && <p className="text-xs text-red-500">{errors.categoria_id}</p>}
                            </div>

                            {/* Marca */}
                            <div className="space-y-1.5">
                                <Label>Marca</Label>
                                <Input value={data.marca} onChange={e => setData("marca", e.target.value)} />
                            </div>

                            {/* Unidad */}
                            <div className="space-y-1.5">
                                <Label>Unidad de medida *</Label>
                                <select value={data.unidad_medida} onChange={e => setData("unidad_medida", e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    {["UND","PAR","CAJA","PACK","SET","ROLLO","M"].map(u => <option key={u}>{u}</option>)}
                                </select>
                            </div>

                            {/* Stock mínimo */}
                            <div className="space-y-1.5">
                                <Label>Stock mínimo *</Label>
                                <Input type="number" min="0" value={data.stock_minimo}
                                    onChange={e => setData("stock_minimo", Number(e.target.value))} />
                            </div>

                            {/* Vida útil */}
                            <div className="space-y-1.5">
                                <Label>Vida útil (meses)</Label>
                                <Input type="number" min="1" value={data.vida_util_meses}
                                    onChange={e => setData("vida_util_meses", e.target.value)} placeholder="Ej: 6" />
                            </div>

                            {/* Usa tallas */}
                            <div className="col-span-2">
                                <label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer">
                                    <input type="checkbox" checked={data.usa_tallas}
                                        onChange={e => { setData("usa_tallas", e.target.checked); setData("tallas_stock", []); }}
                                        className="h-4 w-4" />
                                    <div>
                                        <p className="font-medium">Este EPP usa tallas</p>
                                        <p className="text-sm text-muted-foreground">Ej: calzado, ropa, guantes por talla</p>
                                    </div>
                                </label>
                            </div>

                            {/* Sin tallas: almacén + stock inicial */}
                            {!editingEPP && !data.usa_tallas && (
                                <>
                                    <div className="space-y-1.5">
                                        <Label>Almacén de ingreso</Label>
                                        <select value={data.almacen_id} onChange={e => setData("almacen_id", e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                            <option value="">Sin stock inicial</option>
                                            {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Stock inicial</Label>
                                        <Input type="number" min="0" value={data.stock_inicial}
                                            onChange={e => setData("stock_inicial", Number(e.target.value))} />
                                    </div>
                                </>
                            )}

                            {/* Con tallas: tabla de tallas × almacén */}
                            {!editingEPP && data.usa_tallas && (
                                <div className="col-span-2 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Stock inicial por talla</Label>
                                        <Button type="button" size="sm" variant="outline" onClick={addTallaStock}>
                                            <Plus className="w-3.5 h-3.5 mr-1" /> Agregar talla
                                        </Button>
                                    </div>
                                    {data.tallas_stock.map((ts, i) => (
                                        <div key={i} className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 items-end">
                                            <div>
                                                <Label className="text-xs">Talla</Label>
                                                <select value={ts.talla_id} onChange={e => updateTallaStock(i, "talla_id", e.target.value)}
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm">
                                                    <option value="">Talla...</option>
                                                    {tallas.map(t => <option key={t.id} value={t.id}>{t.codigo}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="text-xs">Almacén</Label>
                                                <select value={ts.almacen_id} onChange={e => updateTallaStock(i, "almacen_id", e.target.value)}
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm">
                                                    <option value="">Almacén...</option>
                                                    {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="text-xs">Cant.</Label>
                                                <Input type="number" min="0" value={ts.cantidad}
                                                    onChange={e => updateTallaStock(i, "cantidad", Number(e.target.value))} className="h-9" />
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeTallaStock(i)}>
                                                <X className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Nota en edición */}
                            {editingEPP && (
                                <div className="col-span-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                                    Para modificar el stock usa <strong>Ingresos de EPP</strong>.
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={closeFormModal}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? "Guardando..." : editingEPP ? "Actualizar" : "Registrar EPP"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}