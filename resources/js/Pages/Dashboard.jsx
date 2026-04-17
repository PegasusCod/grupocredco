import AdminLayout from "@/Layouts/AdminLayout";
import { Head, usePage } from "@inertiajs/react";
import { router } from "@inertiajs/react";
import { useState } from "react";
import {
    AlertCircle, Activity, Package, HardHat, Users,
    TrendingUp, TrendingDown, ArrowUpRight,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ── Helpers ───────────────────────────────────────────────────────────────────

function KPICard({ title, value, subtitle, icon: Icon, color = "text-foreground" }) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="mb-3 flex items-center justify-between">
                    <div className="rounded-lg border bg-background p-2.5">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            </CardContent>
        </Card>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Dashboard({
    stats            = {},
    topEpp           = [],
    barData          = [],
    stockBajoMinimo  = [],
    topTrabajadores  = [],
    filters          = {},
    proyectos        = [],
}) {
    const [proyectoId, setProyectoId] = useState(filters.proyecto_id ?? "todos");
    const [anio,       setAnio]       = useState(String(filters.year ?? new Date().getFullYear()));
    const [mes,        setMes]        = useState(filters.mes ?? "");

    const applyFilters = (params = {}) => {
        router.get(route("dashboard"), {
            proyecto_id: params.proyecto_id ?? proyectoId,
            year:        params.year        ?? anio,
            mes:         params.mes         ?? mes,
        }, { preserveState: true, replace: true });
    };

    const mesesLabels = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

    const totalEntregas = barData.reduce((s, d) => s + d.total, 0);

    return (
        <AdminLayout>
            <Head title="Dashboard" />

            <div className="flex-1 space-y-6 bg-muted/30 p-6">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard EPP</h1>
                    <p className="text-muted-foreground text-sm">Métricas y trazabilidad del sistema</p>
                </div>

                {/* Filtros */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-3 items-end">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Proyecto</p>
                                <select value={proyectoId}
                                    onChange={e => { setProyectoId(e.target.value); applyFilters({ proyecto_id: e.target.value }); }}
                                    className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                                    <option value="todos">Todos</option>
                                    {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Año</p>
                                <select value={anio}
                                    onChange={e => { setAnio(e.target.value); applyFilters({ year: e.target.value }); }}
                                    className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                                    {[2026,2025,2024,2023].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Mes</p>
                                <select value={mes}
                                    onChange={e => { setMes(e.target.value); applyFilters({ mes: e.target.value }); }}
                                    className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                                    <option value="">Todo el año</option>
                                    {mesesLabels.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                    <KPICard title="Entregas"        value={stats.total_entregas       ?? 0} subtitle="EPP asignados"         icon={Package}     color="text-blue-600" />
                    <KPICard title="Con EPP activo"  value={stats.trabajadores_con_epp ?? 0} subtitle="Trabajadores en campo"  icon={Users}       color="text-green-600" />
                    <KPICard title="En custodia"     value={stats.en_custodia           ?? 0} subtitle="Unidades en uso"       icon={HardHat}     color="text-violet-600" />
                    <KPICard title="Devueltos"       value={stats.devueltos_desgaste   ?? 0} subtitle="En segregación"        icon={Activity}    color="text-amber-600" />
                    <KPICard title="Incidencias"     value={stats.incidencias           ?? 0} subtitle="Registradas"          icon={AlertCircle} color="text-red-600" />
                </div>

                {/* Gráficos fila */}
                <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                    {/* Barras por mes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Entregas por mes</CardTitle>
                            <CardDescription>
                                Total acumulado: <strong>{totalEntregas}</strong> entregas en {anio}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={barData}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                                    <Tooltip />
                                    <Bar dataKey="total" name="Entregas" fill="#2563EB" radius={[4,4,0,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Stock bajo mínimo */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">⚠️ Stock bajo mínimo</CardTitle>
                            <CardDescription>EPP que requieren reposición</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {stockBajoMinimo.length === 0 ? (
                                <p className="px-5 py-4 text-sm text-muted-foreground">Sin alertas de stock</p>
                            ) : (
                                <div className="divide-y">
                                    {stockBajoMinimo.map((s, i) => (
                                        <div key={i} className="flex items-center justify-between px-5 py-3">
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">{s.epp}</p>
                                                <p className="text-xs text-muted-foreground">{s.almacen}</p>
                                            </div>
                                            <div className="text-right shrink-0 ml-3">
                                                <p className="text-lg font-bold text-red-600">{s.cantidad_actual}</p>
                                                <p className="text-xs text-muted-foreground">mín: {s.stock_minimo}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Top EPP + Top Trabajadores */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Top 10 EPP */}
                    <Card>
                        <CardHeader>
                            <CardTitle>🏆 Top EPP más entregados</CardTitle>
                            <CardDescription>{anio}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-8">#</TableHead>
                                        <TableHead>EPP</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead className="text-right">Entregas</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topEpp.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                Sin datos para el período seleccionado
                                            </TableCell>
                                        </TableRow>
                                    ) : topEpp.map((e, i) => (
                                        <TableRow key={e.id}>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                                            <TableCell className="font-medium">{e.nombre}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">{e.categoria ?? "—"}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-blue-600">{e.total_entregas}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Top Trabajadores */}
                    <Card>
                        <CardHeader>
                            <CardTitle>🧑‍🏭 Top trabajadores</CardTitle>
                            <CardDescription>EPP activos en custodia</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Trabajador</TableHead>
                                        <TableHead>Proyecto</TableHead>
                                        <TableHead className="text-right">En campo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topTrabajadores.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                Sin datos
                                            </TableCell>
                                        </TableRow>
                                    ) : topTrabajadores.map((t, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-sm">{t.trabajador}</p>
                                                    <p className="text-xs text-muted-foreground">{t.fotocheck}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">{t.proyecto}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-green-600">{t.total_activo}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}