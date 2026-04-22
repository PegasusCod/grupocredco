import { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, router } from "@inertiajs/react";
import { Search, ArrowUpCircle, ArrowDownCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIPO_COLOR = {
    INGRESO_GUIA_REMISION:  "bg-green-100  text-green-700",
    ENTREGA_TRABAJADOR:     "bg-blue-100   text-blue-700",
    DEVOLUCION_DESGASTE:    "bg-amber-100  text-amber-700",
    TRANSFERENCIA_SALIDA:   "bg-violet-100 text-violet-700",
    TRANSFERENCIA_ENTRADA:  "bg-violet-100 text-violet-700",
    AJUSTE_POSITIVO:        "bg-emerald-100 text-emerald-700",
    AJUSTE_NEGATIVO:        "bg-red-100    text-red-700",
    BAJA_DEFINITIVA:        "bg-slate-100  text-slate-700",
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function KardexIndex({
    movimientos    = { data: [], links: [], meta: {} },
    almacenes      = [],
    eppItems       = [],
    tiposMovimiento = [],
    filters        = {},
}) {
    const [form, setForm] = useState({
        almacen_id:       filters.almacen_id        ?? "",
        epp_item_id:      filters.epp_item_id       ?? "",
        naturaleza:       filters.naturaleza         ?? "",
        fecha_desde:      filters.fecha_desde        ?? "",
        fecha_hasta:      filters.fecha_hasta        ?? "",
        tipo_movimiento_id: filters.tipo_movimiento_id ?? "",
    });

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const applyFilters = () => {
        router.get(route("kardex.index"), form, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        const empty = { almacen_id: "", epp_item_id: "", naturaleza: "", fecha_desde: "", fecha_hasta: "", tipo_movimiento_id: "" };
        setForm(empty);
        router.get(route("kardex.index"), empty, { preserveState: true, replace: true });
    };

    // Totales de la página actual
    const entradas = (movimientos?.data ?? []).filter(m => m.naturaleza === "ENTRADA").reduce((s, m) => s + m.cantidad, 0);
    const salidas  = (movimientos?.data ?? []).filter(m => m.naturaleza === "SALIDA").reduce((s, m)  => s + m.cantidad, 0);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <Head title="Kardex" />

            <div className="flex-1 space-y-6 bg-muted/30 p-6">

                {/* Header */}
                <div className="rounded-2xl border bg-background p-6">
                    <h1 className="text-2xl font-bold tracking-tight">Kardex</h1>
                    <p className="text-sm text-muted-foreground">
                        Registro cronológico de todos los movimientos de inventario
                    </p>
                </div>

                {/* Totales página */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="p-5">
                            <p className="text-sm text-muted-foreground">Registros en vista</p>
                            <p className="text-3xl font-bold">{movimientos?.meta?.total ?? 0}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Entradas (pág.)</p>
                                <p className="text-3xl font-bold text-green-600">{entradas}</p>
                            </div>
                            <ArrowUpCircle className="h-7 w-7 text-green-400" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Salidas (pág.)</p>
                                <p className="text-3xl font-bold text-red-600">{salidas}</p>
                            </div>
                            <ArrowDownCircle className="h-7 w-7 text-red-400" />
                        </CardContent>
                    </Card>
                </div>

                {/* Filtros */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Filter className="h-4 w-4" /> Filtros
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
                            {/* Almacén */}
                            <div className="space-y-1">
                                <Label className="text-xs">Almacén</Label>
                                <select value={form.almacen_id}
                                    onChange={e => handleChange("almacen_id", e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                                    <option value="">Todos</option>
                                    {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                </select>
                            </div>

                            {/* EPP */}
                            <div className="space-y-1">
                                <Label className="text-xs">EPP</Label>
                                <select value={form.epp_item_id}
                                    onChange={e => handleChange("epp_item_id", e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                                    <option value="">Todos</option>
                                    {eppItems.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                                </select>
                            </div>

                            {/* Tipo movimiento */}
                            <div className="space-y-1">
                                <Label className="text-xs">Tipo</Label>
                                <select value={form.tipo_movimiento_id}
                                    onChange={e => handleChange("tipo_movimiento_id", e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                                    <option value="">Todos</option>
                                    {tiposMovimiento.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                </select>
                            </div>

                            {/* Naturaleza */}
                            <div className="space-y-1">
                                <Label className="text-xs">Naturaleza</Label>
                                <select value={form.naturaleza}
                                    onChange={e => handleChange("naturaleza", e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                                    <option value="">Todas</option>
                                    <option value="ENTRADA">Entrada</option>
                                    <option value="SALIDA">Salida</option>
                                </select>
                            </div>

                            {/* Fecha desde */}
                            <div className="space-y-1">
                                <Label className="text-xs">Desde</Label>
                                <Input type="date" className="h-9"
                                    value={form.fecha_desde}
                                    onChange={e => handleChange("fecha_desde", e.target.value)} />
                            </div>

                            {/* Fecha hasta */}
                            <div className="space-y-1">
                                <Label className="text-xs">Hasta</Label>
                                <Input type="date" className="h-9"
                                    value={form.fecha_hasta}
                                    onChange={e => handleChange("fecha_hasta", e.target.value)} />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <Button onClick={applyFilters} className="gap-2">
                                <Search className="h-4 w-4" /> Aplicar filtros
                            </Button>
                            <Button variant="outline" onClick={clearFilters}>Limpiar</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla */}
                <Card className="overflow-hidden rounded-2xl">
                    <div className="border-b bg-muted/30 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold">Movimientos</h2>
                            <p className="text-sm text-muted-foreground">
                                Página {movimientos?.meta?.current_page ?? 1} de {movimientos?.meta?.last_page ?? 1}
                                {" · "}{movimientos?.meta?.total ?? 0} registros
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Almacén</TableHead>
                                    <TableHead>EPP</TableHead>
                                    <TableHead>Talla</TableHead>
                                    <TableHead>Tipo movimiento</TableHead>
                                    <TableHead>Nat.</TableHead>
                                    <TableHead>Estado stock</TableHead>
                                    <TableHead className="text-right">Cant.</TableHead>
                                    <TableHead className="text-right">Saldo ant.</TableHead>
                                    <TableHead className="text-right">Saldo nuevo</TableHead>
                                    <TableHead>Referencia</TableHead>
                                    <TableHead>Trabajador</TableHead>
                                    <TableHead>Responsable</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(movimientos?.data ?? []).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={13} className="py-12 text-center text-muted-foreground">
                                            Aplica filtros para ver los movimientos
                                        </TableCell>
                                    </TableRow>
                                ) : (movimientos?.data ?? []).map(m => (
                                    <TableRow key={m.id}
                                        className={m.naturaleza === "ENTRADA" ? "bg-green-50/30" : "bg-red-50/20"}>
                                        <TableCell className="text-xs whitespace-nowrap font-mono">
                                            {m.fecha_movimiento}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="text-sm font-medium">{m.almacen}</p>
                                                {m.almacen_contraparte && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        ↔ {m.almacen_contraparte}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-sm">{m.epp}</TableCell>
                                        <TableCell className="text-sm">
                                            {m.talla !== "ÚNICA" ? m.talla : "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`text-xs ${TIPO_COLOR[m.tipo_codigo] ?? "bg-slate-100 text-slate-700"}`}>
                                                {m.tipo_movimiento}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {m.naturaleza === "ENTRADA" ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                                    <ArrowUpCircle className="h-3 w-3" /> E
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                                                    <ArrowDownCircle className="h-3 w-3" /> S
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                m.estado_stock === "DISPONIBLE" ? "bg-green-100 text-green-700" :
                                                m.estado_stock === "DANADO"     ? "bg-amber-100 text-amber-700" :
                                                "bg-slate-100 text-slate-600"
                                            }`}>
                                                {m.estado_stock}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            <span className={m.naturaleza === "ENTRADA" ? "text-green-600" : "text-red-600"}>
                                                {m.naturaleza === "ENTRADA" ? "+" : "-"}{m.cantidad}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground font-mono">
                                            {m.saldo_anterior}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold text-sm">
                                            {m.saldo_nuevo}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                                            {m.referencia ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-xs max-w-[140px] truncate">
                                            {m.trabajador ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {m.responsable}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Paginación */}
                    {(movimientos?.links ?? []).length > 0 && (
                        <div className="flex items-center justify-between border-t px-6 py-4">
                            <p className="text-sm text-muted-foreground">
                                {movimientos?.meta?.from ?? 0}–{movimientos?.meta?.to ?? 0} de {movimientos?.meta?.total ?? 0}
                            </p>
                            <div className="flex gap-1.5">
                                {movimientos.links.map((link, i) => (
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
        </AdminLayout>
    );
}