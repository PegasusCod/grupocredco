import { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import {
    Plus, X, ArrowRight, CheckCircle2, AlertTriangle,
    Package, ChevronDown, ChevronUp, Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ESTADO_CONFIG = {
    CONFIRMADO: { label: "Confirmado", cls: "bg-green-100 text-green-700" },
    BORRADOR:   { label: "Borrador",   cls: "bg-slate-100 text-slate-600" },
    ANULADO:    { label: "Anulado",    cls: "bg-red-100   text-red-700"   },
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function TransferenciasIndex({
    transferencias           = { data: [], links: [], meta: {} },
    detallesPorTransferencia = {},
    stats                    = {},
    almacenes                = [],
    filters                  = {},
}) {
    const { flash = {} } = usePage().props;

    const [showModal,    setShowModal]    = useState(false);
    const [expandedId,   setExpandedId]   = useState(null);
    const [estadoFilter, setEstadoFilter] = useState(filters.estado ?? "");

    // ── Formulario ────────────────────────────────────────────────────────────

    const emptyDetalle = () => ({ epp_sku_id: "", cantidad: 1, estado_stock: "DISPONIBLE" });

    const { data, setData, post, processing, errors, reset } = useForm({
        fecha_transferencia: "",
        almacen_origen_id:   "",
        almacen_destino_id:  "",
        motivo:              "",
        observaciones:       "",
        detalles:            [emptyDetalle()],
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

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("transferencias.store"), {
            preserveScroll: true,
            onSuccess: () => { reset(); setShowModal(false); },
        });
    };

    const handleAnular = (id) => {
        if (!confirm("¿Seguro que deseas anular esta transferencia? Se revertirá el stock.")) return;
        router.patch(route("transferencias.anular", id), {}, { preserveScroll: true });
    };

    const applyFiltros = (estado) => {
        setEstadoFilter(estado);
        router.get(route("transferencias.index"), { estado }, { preserveState: true, replace: true });
    };

    // Almacenes para selects del modal (origen cualquiera, destino cualquiera excepto el mismo)
    const almacenesOperativos = almacenes.filter(a => a.tipo_almacen === "OPERATIVO");
    const almacenesDestino    = almacenes.filter(a => String(a.id) !== String(data.almacen_origen_id));

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <Head title="Transferencias" />

            <div className="flex-1 space-y-6 bg-muted/30 p-6">

                {/* Header */}
                <div className="rounded-2xl border bg-background p-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Transferencias</h1>
                        <p className="text-sm text-muted-foreground">
                            Movimientos de stock entre almacenes
                        </p>
                    </div>
                    <Button onClick={() => setShowModal(true)} className="gap-2">
                        <Plus className="h-4 w-4" /> Nueva transferencia
                    </Button>
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

                {/* Aviso regla de negocio */}
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    <strong>Regla:</strong> Los préstamos entre almacenes no generan cargos.
                    Los EPP devueltos por desgaste se transfieren al Almacén de Segregación.
                </div>

                {/* KPIs */}
                <div className="grid gap-4 md:grid-cols-3">
                    {[
                        { label: "Total",       value: stats.total       ?? 0, cls: "" },
                        { label: "Confirmadas", value: stats.confirmadas ?? 0, cls: "text-green-600" },
                        { label: "Borradores",  value: stats.borradores  ?? 0, cls: "text-amber-600" },
                    ].map(({ label, value, cls }) => (
                        <Card key={label}>
                            <CardContent className="p-5">
                                <p className="text-sm text-muted-foreground">{label}</p>
                                <p className={`text-3xl font-bold ${cls}`}>{value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filtro estado */}
                <div className="flex gap-2">
                    {[["", "Todas"], ["CONFIRMADO", "Confirmadas"], ["BORRADOR", "Borradores"], ["ANULADO", "Anuladas"]].map(([val, label]) => (
                        <button key={val}
                            onClick={() => applyFiltros(val)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                estadoFilter === val
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background text-muted-foreground border-input hover:border-foreground"
                            }`}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Tabla */}
                <Card className="overflow-hidden rounded-2xl">
                    <div className="border-b bg-muted/30 px-6 py-4">
                        <h2 className="text-base font-semibold">Historial de transferencias</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-8"></TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Origen</TableHead>
                                    <TableHead></TableHead>
                                    <TableHead>Destino</TableHead>
                                    <TableHead>Motivo</TableHead>
                                    <TableHead>Responsable</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(transferencias?.data ?? []).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                                            No hay transferencias registradas
                                        </TableCell>
                                    </TableRow>
                                ) : (transferencias?.data ?? []).map(t => (
                                    <>
                                        <TableRow key={t.id} className="cursor-pointer"
                                            onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                                            <TableCell>
                                                {expandedId === t.id
                                                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                }
                                            </TableCell>
                                            <TableCell className="text-sm whitespace-nowrap">{t.fecha_transferencia}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-sm">{t.almacen_origen}</p>
                                                    <p className="text-xs text-muted-foreground">{t.proyecto_origen}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-sm">{t.almacen_destino}</p>
                                                    <p className="text-xs text-muted-foreground">{t.proyecto_destino}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm max-w-[160px] truncate">
                                                {t.motivo ?? "—"}
                                            </TableCell>
                                            <TableCell className="text-sm">{t.responsable}</TableCell>
                                            <TableCell>
                                                <Badge className={`text-xs ${ESTADO_CONFIG[t.estado]?.cls}`}>
                                                    {ESTADO_CONFIG[t.estado]?.label ?? t.estado}
                                                </Badge>
                                            </TableCell>
                                            <TableCell onClick={e => e.stopPropagation()}>
                                                {t.estado === "CONFIRMADO" && (
                                                    <Button size="sm" variant="outline"
                                                        className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                                        onClick={() => handleAnular(t.id)}>
                                                        <Ban className="h-3.5 w-3.5" /> Anular
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>

                                        {/* Fila expandida — detalles del EPP transferido */}
                                        {expandedId === t.id && (
                                            <TableRow key={`detail-${t.id}`}>
                                                <TableCell colSpan={9} className="bg-muted/20 px-8 py-3">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                                                        EPP transferidos
                                                    </p>
                                                    {(detallesPorTransferencia[t.id] ?? []).length === 0 ? (
                                                        <p className="text-sm text-muted-foreground">Sin detalle disponible</p>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-2">
                                                            {(detallesPorTransferencia[t.id] ?? []).map((d, i) => (
                                                                <span key={i}
                                                                    className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs">
                                                                    <Package className="h-3 w-3 text-muted-foreground" />
                                                                    {d.epp}
                                                                    {d.talla !== "ÚNICA" && ` — T.${d.talla}`}
                                                                    <strong>×{d.cantidad}</strong>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {t.observaciones && (
                                                        <p className="mt-2 text-xs text-muted-foreground">
                                                            <strong>Obs:</strong> {t.observaciones}
                                                        </p>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Paginación */}
                    {(transferencias?.links ?? []).length > 0 && (
                        <div className="flex items-center justify-between border-t px-6 py-4">
                            <p className="text-sm text-muted-foreground">
                                {transferencias?.meta?.total ?? 0} registros
                            </p>
                            <div className="flex gap-2">
                                {transferencias.links.map((link, i) => (
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

            {/* ── Modal Nueva Transferencia ── */}
            <Dialog open={showModal} onOpenChange={open => !open && setShowModal(false)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Nueva transferencia</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label>Fecha *</Label>
                                <Input type="date" value={data.fecha_transferencia}
                                    onChange={e => setData("fecha_transferencia", e.target.value)} />
                                {errors.fecha_transferencia && <p className="text-xs text-red-500">{errors.fecha_transferencia}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label>Almacén origen *</Label>
                                <select value={data.almacen_origen_id}
                                    onChange={e => setData("almacen_origen_id", e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="">Seleccionar...</option>
                                    {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                </select>
                                {errors.almacen_origen_id && <p className="text-xs text-red-500">{errors.almacen_origen_id}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label>Almacén destino *</Label>
                                <select value={data.almacen_destino_id}
                                    onChange={e => setData("almacen_destino_id", e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="">Seleccionar...</option>
                                    {almacenesDestino.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                </select>
                                {errors.almacen_destino_id && <p className="text-xs text-red-500">{errors.almacen_destino_id}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label>Motivo</Label>
                                <Input placeholder="Préstamo por desabasto, devolución…"
                                    value={data.motivo} onChange={e => setData("motivo", e.target.value)} />
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <Label>Observaciones</Label>
                                <textarea rows={2}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={data.observaciones}
                                    onChange={e => setData("observaciones", e.target.value)} />
                            </div>
                        </div>

                        {/* Detalles */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm">EPP a transferir</h3>
                                <Button type="button" size="sm" variant="outline" onClick={addDetalle} className="gap-1">
                                    <Plus className="h-3.5 w-3.5" /> Agregar
                                </Button>
                            </div>

                            {data.detalles.map((det, i) => (
                                <div key={i} className="rounded-xl border p-4 grid gap-3 md:grid-cols-[2fr_80px_140px_32px] items-end">
                                    <div className="space-y-1">
                                        <Label className="text-xs">SKU (EPP + talla) *</Label>
                                        <Input placeholder="ID del SKU"
                                            type="number" value={det.epp_sku_id}
                                            onChange={e => updateDetalle(i, "epp_sku_id", e.target.value)} />
                                        {errors[`detalles.${i}.epp_sku_id`] && (
                                            <p className="text-xs text-red-500">{errors[`detalles.${i}.epp_sku_id`]}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Cant. *</Label>
                                        <Input type="number" min={1} value={det.cantidad}
                                            onChange={e => updateDetalle(i, "cantidad", Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Estado stock</Label>
                                        <select value={det.estado_stock}
                                            onChange={e => updateDetalle(i, "estado_stock", e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                            <option value="DISPONIBLE">Disponible</option>
                                            <option value="DANADO">Dañado</option>
                                        </select>
                                    </div>
                                    {data.detalles.length > 1 && (
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeDetalle(i)}>
                                            <X className="h-4 w-4 text-red-500" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? "Guardando..." : "Confirmar transferencia"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}