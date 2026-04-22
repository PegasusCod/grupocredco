import { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import {
    Search, Trash2, AlertTriangle, CheckCircle2,
    Package, ArrowDownToLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ── Modal Dar de baja ─────────────────────────────────────────────────────────

function ModalDarBaja({ item, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        stock_almacen_id: item?.id ?? "",
        cantidad:         item?.cantidad_actual ?? 1,
        motivo:           "",
        observaciones:    "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("segregacion.darBaja"), {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    };

    if (!item) return null;

    return (
        <Dialog open={!!item} onOpenChange={open => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-700">
                        <Trash2 className="h-5 w-5" /> Dar de baja definitiva
                    </DialogTitle>
                </DialogHeader>

                {/* Info del item */}
                <div className="rounded-xl border bg-red-50 p-4 text-sm space-y-1">
                    <p className="font-semibold text-slate-800">{item.epp}</p>
                    {item.talla !== "ÚNICA" && (
                        <p className="text-xs text-muted-foreground">Talla: {item.talla}</p>
                    )}
                    <p className="text-slate-600">Almacén: <strong>{item.almacen}</strong></p>
                    <p className="text-slate-600">
                        Disponible para baja: <strong className="text-red-700">{item.cantidad_actual}</strong>
                    </p>
                </div>

                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    ⚠️ Esta acción es <strong>irreversible</strong>. El stock pasará a estado BAJA en el kardex.
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" value={data.stock_almacen_id}
                        onChange={() => {}} />

                    <div className="space-y-1.5">
                        <Label>Cantidad a dar de baja *</Label>
                        <Input type="number" min={1} max={item.cantidad_actual}
                            value={data.cantidad}
                            onChange={e => setData("cantidad", Number(e.target.value))} />
                        {errors.cantidad && <p className="text-xs text-red-500">{errors.cantidad}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Motivo de baja *</Label>
                        <Input placeholder="Ej: Vida útil vencida, deterioro irreparable…"
                            value={data.motivo}
                            onChange={e => setData("motivo", e.target.value)} />
                        {errors.motivo && <p className="text-xs text-red-500">{errors.motivo}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Observaciones</Label>
                        <textarea rows={2}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={data.observaciones}
                            onChange={e => setData("observaciones", e.target.value)} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing}
                            className="bg-red-600 hover:bg-red-700 text-white">
                            {processing ? "Procesando..." : "Confirmar baja"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function SegregacionIndex({
    stockSegregacion      = { data: [], links: [], meta: {} },
    stats                 = {},
    almacenesSegregacion  = [],
    filters               = {},
}) {
    const { flash = {} } = usePage().props;

    const [search,       setSearch]       = useState(filters.search       ?? "");
    const [almacenId,    setAlmacenId]    = useState(filters.almacen_id   ?? "");
    const [estadoStock,  setEstadoStock]  = useState(filters.estado_stock ?? "");
    const [itemBaja,     setItemBaja]     = useState(null);

    const applyFilters = (params = {}) => {
        router.get(route("segregacion.index"), {
            search:       params.search       ?? search,
            almacen_id:   params.almacen_id   ?? almacenId,
            estado_stock: params.estado_stock ?? estadoStock,
        }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setSearch(""); setAlmacenId(""); setEstadoStock("");
        router.get(route("segregacion.index"), {}, { preserveState: true, replace: true });
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <Head title="Segregación / Baja" />

            <div className="flex-1 space-y-6 bg-muted/30 p-6">

                {/* Header */}
                <div className="rounded-2xl border bg-background p-6">
                    <h1 className="text-2xl font-bold tracking-tight">Segregación / Baja</h1>
                    <p className="text-sm text-muted-foreground">
                        Stock en almacenes de segregación — EPP dañados o dados de baja
                    </p>
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> {flash.error}
                    </div>
                )}

                {/* KPIs */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">EPP Dañados</p>
                                <p className="text-3xl font-bold text-amber-600">{stats.total_danado ?? 0}</p>
                                <p className="text-xs text-muted-foreground mt-1">Unidades en segregación</p>
                            </div>
                            <AlertTriangle className="h-7 w-7 text-amber-400" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Dados de baja</p>
                                <p className="text-3xl font-bold text-red-600">{stats.total_baja ?? 0}</p>
                                <p className="text-xs text-muted-foreground mt-1">Baja definitiva</p>
                            </div>
                            <Trash2 className="h-7 w-7 text-red-400" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Tipos distintos</p>
                                <p className="text-3xl font-bold">{stats.tipos_distintos ?? 0}</p>
                                <p className="text-xs text-muted-foreground mt-1">EPP en segregación</p>
                            </div>
                            <Package className="h-7 w-7 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </div>

                {/* Filtros */}
                <Card>
                    <CardContent className="p-4">
                        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto_auto]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Buscar por EPP..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && applyFilters()}
                                    className="pl-9" />
                            </div>
                            <select value={almacenId}
                                onChange={e => { setAlmacenId(e.target.value); applyFilters({ almacen_id: e.target.value }); }}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="">Todos los almacenes</option>
                                {almacenesSegregacion.map(a => (
                                    <option key={a.id} value={a.id}>{a.nombre}</option>
                                ))}
                            </select>
                            <select value={estadoStock}
                                onChange={e => { setEstadoStock(e.target.value); applyFilters({ estado_stock: e.target.value }); }}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="">Todos los estados</option>
                                <option value="DANADO">Dañado</option>
                                <option value="BAJA">Baja definitiva</option>
                            </select>
                            <Button onClick={() => applyFilters()}>Buscar</Button>
                            <Button variant="outline" onClick={clearFilters}>Limpiar</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla */}
                <Card className="overflow-hidden rounded-2xl">
                    <div className="border-b bg-muted/30 px-6 py-4">
                        <h2 className="text-base font-semibold">Stock en segregación</h2>
                        <p className="text-sm text-muted-foreground">
                            {stockSegregacion?.meta?.total ?? 0} registros
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>EPP</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead>Talla</TableHead>
                                    <TableHead>Almacén</TableHead>
                                    <TableHead>Proyecto</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Cantidad</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(stockSegregacion?.data ?? []).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                                            <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                            No hay EPP en segregación
                                        </TableCell>
                                    </TableRow>
                                ) : (stockSegregacion?.data ?? []).map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell className="font-medium">{s.epp}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">{s.categoria ?? "—"}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {s.talla !== "ÚNICA" ? s.talla : "—"}
                                        </TableCell>
                                        <TableCell className="text-sm">{s.almacen}</TableCell>
                                        <TableCell className="text-sm">{s.proyecto ?? "—"}</TableCell>
                                        <TableCell>
                                            {s.estado_stock === "DANADO" ? (
                                                <Badge className="bg-amber-100 text-amber-700 text-xs">Dañado</Badge>
                                            ) : (
                                                <Badge className="bg-red-100 text-red-700 text-xs">Baja definitiva</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-xl font-bold text-amber-600">{s.cantidad_actual}</span>
                                        </TableCell>
                                        <TableCell>
                                            {/* Solo se puede dar de baja si está DAÑADO */}
                                            {s.estado_stock === "DANADO" && (
                                                <Button size="sm" variant="outline"
                                                    className="gap-1 text-red-700 border-red-200 hover:bg-red-50"
                                                    onClick={() => setItemBaja(s)}>
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

                    {/* Paginación */}
                    {(stockSegregacion?.links ?? []).length > 0 && (
                        <div className="flex items-center justify-between border-t px-6 py-4">
                            <p className="text-sm text-muted-foreground">
                                {stockSegregacion?.meta?.from ?? 0}–{stockSegregacion?.meta?.to ?? 0} de {stockSegregacion?.meta?.total ?? 0}
                            </p>
                            <div className="flex gap-1.5">
                                {stockSegregacion.links.map((link, i) => (
                                    <Button key={i} size="sm" variant={link.active ? "default" : "outline"}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Modal dar de baja */}
            <ModalDarBaja item={itemBaja} onClose={() => setItemBaja(null)} />
        </AdminLayout>
    );
}