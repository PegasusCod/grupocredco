import { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import {
    Search, HardHat, User, CalendarDays, RotateCcw,
    ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ESTADO_CUSTODIA = {
    ACTIVO:          { label: "En campo",        cls: "bg-green-100  text-green-700"  },
    DEVUELTO_DANADO: { label: "Devuelto dañado", cls: "bg-amber-100  text-amber-700"  },
    PERDIDO:         { label: "Perdido",          cls: "bg-red-100    text-red-700"    },
    EXTRAVIADO:      { label: "Extraviado",       cls: "bg-red-100    text-red-700"    },
    CERRADO:         { label: "Cerrado",          cls: "bg-slate-100  text-slate-600"  },
};

const MOTIVO_LABEL = {
    INICIAL:             "Nuevo ingreso",
    REPOSICION_DESGASTE: "Reposición desgaste",
    REPOSICION_PERDIDA:  "Reposición pérdida",
};

// ── Modal de devolución ───────────────────────────────────────────────────────

function ModalDevolucion({ custodia, almacenesSegregacion, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        cantidad_devuelta:  custodia?.cantidad_pendiente ?? 1,
        almacen_destino_id: "",
        observaciones:      "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("custodia.devolver", custodia.id), {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    };

    if (!custodia) return null;

    return (
        <Dialog open={!!custodia} onOpenChange={open => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-amber-600" />
                        Registrar devolución
                    </DialogTitle>
                </DialogHeader>

                {/* Info custodia */}
                <div className="rounded-xl border bg-amber-50 p-4 text-sm space-y-1">
                    <p className="font-semibold text-slate-800">{custodia.epp}</p>
                    {custodia.talla !== "ÚNICA" && (
                        <p className="text-xs text-muted-foreground">Talla: {custodia.talla}</p>
                    )}
                    <p className="text-slate-600">
                        Trabajador: <strong>{custodia.trabajador?.nombre_completo}</strong>
                    </p>
                    <p className="text-slate-600">
                        Pendiente de devolución: <strong className="text-amber-700">{custodia.cantidad_pendiente}</strong>
                    </p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    El EPP devuelto ingresará al almacén de <strong>Segregación</strong> con estado <strong>DAÑADO</strong>.
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Cantidad a devolver *</Label>
                        <Input type="number" min={1} max={custodia.cantidad_pendiente}
                            value={data.cantidad_devuelta}
                            onChange={e => setData("cantidad_devuelta", Number(e.target.value))} />
                        {errors.cantidad_devuelta && (
                            <p className="text-xs text-red-500">{errors.cantidad_devuelta}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Almacén de segregación *</Label>
                        <select value={data.almacen_destino_id}
                            onChange={e => setData("almacen_destino_id", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="">Seleccionar almacén...</option>
                            {almacenesSegregacion.map(a => (
                                <option key={a.id} value={a.id}>{a.nombre}</option>
                            ))}
                        </select>
                        {errors.almacen_destino_id && (
                            <p className="text-xs text-red-500">{errors.almacen_destino_id}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Observaciones</Label>
                        <textarea rows={2}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="Estado del EPP devuelto..."
                            value={data.observaciones}
                            onChange={e => setData("observaciones", e.target.value)} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing}
                            className="bg-amber-600 hover:bg-amber-700 text-white">
                            {processing ? "Registrando..." : "Confirmar devolución"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CustodiaIndex({
    activos   = { data: [], meta: {} },
    historial = { data: [], meta: {} },
    stats     = {},
    proyectos = [],
    filters   = {},
    // Almacenes de segregación para el modal de devolución
    almacenesSegregacion = [],
}) {
    const { flash = {} } = usePage().props;

    const [tab,             setTab]             = useState(filters.tab || "activos");
    const [search,          setSearch]          = useState(filters.search || "");
    const [proyectoId,      setProyectoId]      = useState(filters.proyecto_id || "todos");
    const [custodiaDevolver, setCustodiaDevolver] = useState(null);

    // Filtros backend
    const applyFilters = (params = {}) => {
        router.get(route("custodia.index"), {
            tab:         params.tab        ?? tab,
            search:      params.search     ?? search,
            proyecto_id: params.proyecto_id ?? proyectoId,
        }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleTabChange = (newTab) => {
        setTab(newTab);
        applyFilters({ tab: newTab });
    };

    const currentData = tab === "activos" ? activos : historial;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <Head title="Custodia de EPP" />

            <div className="flex-1 space-y-6 bg-muted/30 p-6">

                {/* Header */}
                <div className="rounded-2xl border bg-background p-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Custodia de EPP</h1>
                        <p className="text-sm text-muted-foreground">
                            EPP bajo responsabilidad de cada trabajador
                        </p>
                    </div>
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
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: "En campo",        value: stats.total_activos   ?? 0, icon: ShieldCheck, cls: "text-green-600"  },
                        { label: "Devueltos dañados", value: stats.total_devueltos ?? 0, icon: RotateCcw,   cls: "text-amber-600"  },
                        { label: "Perdidos",         value: stats.total_perdidos  ?? 0, icon: ShieldAlert,  cls: "text-red-600"    },
                        { label: "Cerrados",         value: stats.total_cerrados  ?? 0, icon: CheckCircle2, cls: "text-slate-500"  },
                    ].map(({ label, value, icon: Icon, cls }) => (
                        <Card key={label}>
                            <CardContent className="p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{label}</p>
                                    <p className={`text-3xl font-bold ${cls}`}>{value}</p>
                                </div>
                                <Icon className={`h-6 w-6 ${cls}`} />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filtros */}
                <Card>
                    <CardContent className="p-4">
                        <div className="grid gap-3 md:grid-cols-[1fr_200px_120px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Nombre, DNI, fotocheck..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && applyFilters()}
                                    className="pl-9" />
                            </div>
                            <select value={proyectoId}
                                onChange={e => { setProyectoId(e.target.value); applyFilters({ proyecto_id: e.target.value }); }}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="todos">Todos los proyectos</option>
                                {proyectos.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                ))}
                            </select>
                            <Button onClick={() => applyFilters()}>Buscar</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Pestañas */}
                <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
                    {[
                        { key: "activos",   label: `En campo (${stats.total_activos ?? 0})` },
                        { key: "historial", label: `Historial (${(stats.total_devueltos ?? 0) + (stats.total_perdidos ?? 0) + (stats.total_cerrados ?? 0)})` },
                    ].map(({ key, label }) => (
                        <button key={key}
                            onClick={() => handleTabChange(key)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                tab === key
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Tabla */}
                <Card className="overflow-hidden rounded-2xl">
                    <div className="border-b bg-muted/30 px-6 py-4">
                        <h2 className="text-base font-semibold">
                            {tab === "activos" ? "EPP activos en campo" : "Historial de devoluciones y pérdidas"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {currentData?.meta?.total ?? 0} registros encontrados
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Trabajador</TableHead>
                                    <TableHead>Proyecto</TableHead>
                                    <TableHead>EPP</TableHead>
                                    <TableHead>Talla</TableHead>
                                    <TableHead>Motivo</TableHead>
                                    <TableHead>Entregado</TableHead>
                                    <TableHead>Devuelto</TableHead>
                                    <TableHead>Perdido</TableHead>
                                    <TableHead>Pendiente</TableHead>
                                    <TableHead>F. Entrega</TableHead>
                                    {tab === "historial" && <TableHead>F. Cierre</TableHead>}
                                    <TableHead>Estado</TableHead>
                                    {tab === "activos" && <TableHead>Acciones</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(currentData?.data ?? []).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={13} className="py-12 text-center text-muted-foreground">
                                            <HardHat className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                            No hay registros para mostrar
                                        </TableCell>
                                    </TableRow>
                                ) : (currentData?.data ?? []).map(c => (
                                    <TableRow key={c.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                    <User className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{c.trabajador?.nombre_completo}</p>
                                                    <p className="text-xs text-muted-foreground">{c.trabajador?.codigo_fotocheck}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {c.trabajador?.proyecto ?? "—"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-sm">{c.epp}</p>
                                                <p className="text-xs text-muted-foreground">{c.categoria}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {c.talla !== "ÚNICA" ? c.talla : "—"}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs">
                                                {MOTIVO_LABEL[c.motivo_entrega] ?? c.motivo_entrega ?? "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center font-semibold">{c.cantidad_entregada}</TableCell>
                                        <TableCell className="text-center text-green-600 font-semibold">{c.cantidad_devuelta}</TableCell>
                                        <TableCell className="text-center text-red-600 font-semibold">{c.cantidad_perdida}</TableCell>
                                        <TableCell className="text-center">
                                            <span className={`font-bold ${c.cantidad_pendiente > 0 ? "text-amber-600" : "text-slate-400"}`}>
                                                {c.cantidad_pendiente}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm whitespace-nowrap">{c.fecha_entrega ?? "—"}</TableCell>
                                        {tab === "historial" && (
                                            <TableCell className="text-sm whitespace-nowrap">{c.fecha_cierre ?? "—"}</TableCell>
                                        )}
                                        <TableCell>
                                            <Badge className={`text-xs ${ESTADO_CUSTODIA[c.estado]?.cls ?? "bg-slate-100 text-slate-600"}`}>
                                                {ESTADO_CUSTODIA[c.estado]?.label ?? c.estado}
                                            </Badge>
                                        </TableCell>
                                        {tab === "activos" && (
                                            <TableCell>
                                                {c.cantidad_pendiente > 0 && (
                                                    <Button size="sm" variant="outline"
                                                        className="gap-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                                                        onClick={() => setCustodiaDevolver(c)}>
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                        Devolver
                                                    </Button>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Paginación */}
                    {currentData?.meta?.last_page > 1 && (
                        <div className="flex items-center justify-between border-t px-6 py-4">
                            <p className="text-sm text-muted-foreground">
                                Página {currentData.meta.current_page} de {currentData.meta.last_page}
                            </p>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline"
                                    disabled={!currentData.meta.prev_page_url}
                                    onClick={() => currentData.meta.prev_page_url && router.visit(currentData.meta.prev_page_url, { preserveState: true })}>
                                    Anterior
                                </Button>
                                <Button size="sm" variant="outline"
                                    disabled={!currentData.meta.next_page_url}
                                    onClick={() => currentData.meta.next_page_url && router.visit(currentData.meta.next_page_url, { preserveState: true })}>
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Modal devolución */}
            <ModalDevolucion
                custodia={custodiaDevolver}
                almacenesSegregacion={almacenesSegregacion}
                onClose={() => setCustodiaDevolver(null)}
            />
        </AdminLayout>
    );
}