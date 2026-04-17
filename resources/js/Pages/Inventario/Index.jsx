import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { Calendar, Package, Plus, Search, TrendingUp, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export default function InventarioIndex({ items = [], ingresos, stats, filters = {}, almacenes = [], authUser }) {
    const [open, setOpen]     = useState(false);
    const [search, setSearch] = useState(filters?.search || "");
    const firstLoad           = useRef(true);

    // Debounce de búsqueda
    useEffect(() => {
        if (firstLoad.current) { firstLoad.current = false; return; }
        const timer = setTimeout(() => {
            router.get("/inventario", { search }, { preserveState: true, preserveScroll: true, replace: true });
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    // ── Formulario ───────────────────────────────────────────────────────────

    const emptyDetalle = () => ({ epp_sku_id: "", cantidad: 1 });

    const { data, setData, post, processing, errors, reset } = useForm({
        fecha_ingreso: "",
        numero_guia:   "",   // ← antes era numero_lote
        proveedor:     "",
        observaciones: "",
        almacen_id:    "",   // ← almacén destino
        detalles:      [emptyDetalle()],
    });

    const addDetalle    = () => setData("detalles", [...data.detalles, emptyDetalle()]);
    const removeDetalle = (i) => {
        if (data.detalles.length === 1) return;
        setData("detalles", data.detalles.filter((_, idx) => idx !== i));
    };
    const updateDetalle = (i, field, value) => {
        const arr = [...data.detalles];
        arr[i] = { ...arr[i], [field]: value };
        setData("detalles", arr);
    };

    // Buscar SKU por ID para mostrar nombre
    const getSkuLabel = (skuId) => {
        for (const item of items) {
            const sku = item.skus?.find(s => String(s.id) === String(skuId));
            if (sku) return `${item.nombre} — Talla ${sku.talla}`;
        }
        return null;
    };

    // Aplanar todos los SKUs de todos los items para el select
    const allSkus = items.flatMap(item =>
        (item.skus ?? []).map(sku => ({
            id:    sku.id,
            label: item.usa_tallas
                ? `${item.nombre} (Talla ${sku.talla})`
                : item.nombre,
        }))
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("inventario.store"), {
            preserveScroll: true,
            onSuccess: () => { reset(); setOpen(false); },
        });
    };

    const formatDate = (v) => {
        if (!v) return "—";
        return new Date(`${v}T00:00:00`).toLocaleDateString("es-PE");
    };

    return (
        <AdminLayout>
            <Head title="Ingresos de EPP" />

            <div className="flex-1 space-y-6 bg-muted/30 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-2xl border bg-background p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Ingresos de EPP</h1>
                        <p className="text-sm text-muted-foreground">Control de guías de remisión · Kardex de entradas</p>
                    </div>
                    <Button onClick={() => setOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" /> Registrar Ingreso
                    </Button>
                </div>

                {/* KPIs */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="rounded-2xl">
                        <CardContent className="flex items-start justify-between p-6">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Ingresos</p>
                                <p className="mt-2 text-3xl font-bold">{stats?.total_ingresos ?? 0}</p>
                                <p className="mt-1 text-xs text-muted-foreground">Movimientos de entrada</p>
                            </div>
                            <Package className="h-5 w-5 text-primary" />
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl bg-green-600 text-white">
                        <CardContent className="flex items-start justify-between p-6">
                            <div>
                                <p className="text-sm text-white/90">Unidades Ingresadas</p>
                                <p className="mt-2 text-3xl font-bold">{stats?.unidades_ingresadas ?? 0}</p>
                                <p className="mt-1 text-xs text-white/90">EPP en total</p>
                            </div>
                            <TrendingUp className="h-5 w-5" />
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl">
                        <CardContent className="flex items-start justify-between p-6">
                            <div>
                                <p className="text-sm text-muted-foreground">Último Ingreso</p>
                                <p className="mt-2 text-2xl font-bold">{stats?.ultimo_ingreso ?? "—"}</p>
                                <p className="mt-1 text-xs text-muted-foreground">Fecha más reciente</p>
                            </div>
                            <Calendar className="h-5 w-5 text-primary" />
                        </CardContent>
                    </Card>
                </div>

                {/* Búsqueda */}
                <Card className="rounded-2xl">
                    <CardContent className="p-5">
                        <Label className="mb-2 block">Buscar por EPP, Guía de remisión o Responsable</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Buscar..." value={search}
                                onChange={e => setSearch(e.target.value)} className="pl-9" />
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla historial */}
                <Card className="overflow-hidden rounded-2xl">
                    <div className="border-b bg-muted/30 px-6 py-4">
                        <h2 className="text-lg font-semibold">Historial de Ingresos</h2>
                        <p className="text-sm text-muted-foreground">Movimientos ENTRADA registrados en kardex</p>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>N° Guía</TableHead>
                                    <TableHead>EPP</TableHead>
                                    <TableHead>Cantidad</TableHead>
                                    <TableHead>Saldo anterior → nuevo</TableHead>
                                    <TableHead>Almacén</TableHead>
                                    <TableHead>Responsable</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ingresos?.data?.length > 0 ? ingresos.data.map(ing => (
                                    <TableRow key={ing.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                {formatDate(ing.fecha)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-xs text-primary">
                                                {ing.lote}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{ing.epp?.nombre}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {ing.epp?.codigo}
                                                    {ing.talla && ing.talla !== "UNICA" ? ` · Talla ${ing.talla}` : ""}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                                                + {ing.cantidad}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            <span className="text-muted-foreground">{ing.saldo_anterior}</span>
                                            {" → "}
                                            <span className="font-bold text-green-600">{ing.saldo_nuevo}</span>
                                        </TableCell>
                                        <TableCell className="text-sm">{ing.almacen ?? "—"}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                {ing.responsable}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                            No se encontraron registros
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Paginación */}
                    {ingresos?.meta && (
                        <div className="flex flex-col gap-3 border-t px-6 py-4 md:flex-row md:items-center md:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Mostrando {ingresos.meta.from ?? 0}–{ingresos.meta.to ?? 0} de {ingresos.meta.total}
                            </p>
                            <div className="flex items-center gap-2">
                                {ingresos.meta.prev_page_url
                                    ? <Button variant="outline" size="sm" asChild><Link href={ingresos.meta.prev_page_url} preserveScroll>Anterior</Link></Button>
                                    : <Button variant="outline" size="sm" disabled>Anterior</Button>
                                }
                                <span className="text-sm text-muted-foreground">
                                    Página {ingresos.meta.current_page} de {ingresos.meta.last_page}
                                </span>
                                {ingresos.meta.next_page_url
                                    ? <Button variant="outline" size="sm" asChild><Link href={ingresos.meta.next_page_url} preserveScroll>Siguiente</Link></Button>
                                    : <Button variant="outline" size="sm" disabled>Siguiente</Button>
                                }
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* ── Modal Registrar Ingreso ── */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Registrar Ingreso de EPP</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Datos del ingreso */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Fecha de Ingreso *</Label>
                                <Input type="date" value={data.fecha_ingreso}
                                    onChange={e => setData("fecha_ingreso", e.target.value)} />
                                {errors.fecha_ingreso && <p className="text-xs text-red-500">{errors.fecha_ingreso}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>N° Guía de Remisión *</Label>
                                <Input placeholder="GR-001-000001" value={data.numero_guia}
                                    onChange={e => setData("numero_guia", e.target.value)} />
                                {errors.numero_guia && <p className="text-xs text-red-500">{errors.numero_guia}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Almacén destino *</Label>
                                <select value={data.almacen_id} onChange={e => setData("almacen_id", e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="">Seleccionar almacén...</option>
                                    {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                </select>
                                {errors.almacen_id && <p className="text-xs text-red-500">{errors.almacen_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Proveedor *</Label>
                                <Input placeholder="Razón social del proveedor" value={data.proveedor}
                                    onChange={e => setData("proveedor", e.target.value)} />
                                {errors.proveedor && <p className="text-xs text-red-500">{errors.proveedor}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Responsable</Label>
                                <Input value={authUser?.name ?? ""} readOnly disabled />
                                <p className="text-xs text-muted-foreground">Registrado con el usuario activo</p>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label>Observaciones</Label>
                                <Textarea rows={2} placeholder="Observaciones adicionales..."
                                    value={data.observaciones} onChange={e => setData("observaciones", e.target.value)} />
                            </div>
                        </div>

                        {/* Detalles — por SKU */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">EPP a ingresar</h3>
                                <Button type="button" variant="outline" size="sm" onClick={addDetalle} className="gap-1">
                                    <Plus className="h-3.5 w-3.5" /> Añadir EPP
                                </Button>
                            </div>

                            {data.detalles.map((det, i) => (
                                <div key={i} className="rounded-xl border p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-muted-foreground">EPP #{i + 1}</h4>
                                        {data.detalles.length > 1 && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeDetalle(i)}>
                                                <X className="h-4 w-4 text-red-500" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-[1fr_100px]">
                                        {/* Select de SKU (incluye talla) */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Seleccionar EPP + talla *</Label>
                                            <select value={det.epp_sku_id}
                                                onChange={e => updateDetalle(i, "epp_sku_id", e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                                <option value="">Seleccionar EPP...</option>
                                                {allSkus.map(s => (
                                                    <option key={s.id} value={s.id}>{s.label}</option>
                                                ))}
                                            </select>
                                            {errors[`detalles.${i}.epp_sku_id`] && (
                                                <p className="text-xs text-red-500">{errors[`detalles.${i}.epp_sku_id`]}</p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Cantidad *</Label>
                                            <Input type="number" min={1} value={det.cantidad}
                                                onChange={e => updateDetalle(i, "cantidad", Number(e.target.value))} />
                                            {errors[`detalles.${i}.cantidad`] && (
                                                <p className="text-xs text-red-500">{errors[`detalles.${i}.cantidad`]}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? "Guardando..." : "Registrar Ingreso"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}