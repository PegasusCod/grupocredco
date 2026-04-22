// resources/js/Pages/Configuracion/Index.jsx

import { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import {
    Plus, Edit, Trash2, Briefcase, Building2,
    Warehouse, CheckCircle2, AlertTriangle, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ── Tabs disponibles ──────────────────────────────────────────────────────────

const TABS = [
    { key: "cargos",    label: "Cargos laborales", icon: Briefcase  },
    { key: "proyectos", label: "Proyectos",         icon: Building2  },
    { key: "almacenes", label: "Almacenes",         icon: Warehouse  },
];

// ── Componente genérico de modal ──────────────────────────────────────────────

function FormModal({ open, onClose, title, children, onSubmit, processing }) {
    return (
        <Dialog open={open} onOpenChange={o => !o && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    {children}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// PESTAÑA: CARGOS
// ════════════════════════════════════════════════════════════════════════════

function TabCargos({ cargos = [] }) {
    const [modal, setModal]     = useState(false);
    const [editing, setEditing] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({ nombre: "" });

    const openCreate = () => { reset(); setEditing(null); setModal(true); };
    const openEdit   = (c)  => { setData("nombre", c.nombre); setEditing(c); setModal(true); };
    const closeModal = ()   => { setModal(false); setEditing(null); reset(); };

    const submit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route("cargos.update", editing.id), {
                preserveScroll: true,
                onSuccess: closeModal,
            });
        } else {
            post(route("cargos.storeQuick"), {
                preserveScroll: true,
                onSuccess: closeModal,
            });
        }
    };

    const handleDelete = (c) => {
        if (!confirm(`¿Eliminar el cargo "${c.nombre}"?`)) return;
        router.delete(route("cargos.destroy", c.id), { preserveScroll: true });
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Cargos laborales</CardTitle>
                        <CardDescription>{cargos.length} cargos registrados</CardDescription>
                    </div>
                    <Button size="sm" onClick={openCreate} className="gap-1">
                        <Plus className="h-4 w-4" /> Nuevo cargo
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cargos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                                        No hay cargos registrados
                                    </TableCell>
                                </TableRow>
                            ) : cargos.map((c, i) => (
                                <TableRow key={c.id}>
                                    <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                                    <TableCell className="font-medium">{c.nombre}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                                                <Edit className="h-4 w-4 text-emerald-600" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(c)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <FormModal
                open={modal}
                onClose={closeModal}
                title={editing ? "Editar cargo" : "Nuevo cargo laboral"}
                onSubmit={submit}
                processing={processing}
            >
                <div className="space-y-1.5">
                    <Label>Nombre del cargo *</Label>
                    <Input
                        value={data.nombre}
                        onChange={e => setData("nombre", e.target.value)}
                        placeholder="Ej: Operador, Supervisor, Vigía..."
                        autoFocus
                    />
                    {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
                </div>
            </FormModal>
        </>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// PESTAÑA: PROYECTOS
// ════════════════════════════════════════════════════════════════════════════

function TabProyectos({ proyectos = [] }) {
    const [modal, setModal]     = useState(false);
    const [editing, setEditing] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nombre: "",
        activo: true,
    });

    const openCreate = () => { reset(); setEditing(null); setModal(true); };
    const openEdit   = (p) => {
        setData({ nombre: p.nombre, activo: !!p.activo });
        setEditing(p);
        setModal(true);
    };
    const closeModal = () => { setModal(false); setEditing(null); reset(); };

    const submit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route("proyectos.update", editing.id), {
                preserveScroll: true,
                onSuccess: closeModal,
            });
        } else {
            post(route("proyectos.store"), {
                preserveScroll: true,
                onSuccess: closeModal,
            });
        }
    };

    const handleDelete = (p) => {
        if (!confirm(`¿Eliminar el proyecto "${p.nombre}"? Esto afectará a los trabajadores y almacenes asociados.`)) return;
        router.delete(route("proyectos.destroy", p.id), { preserveScroll: true });
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Proyectos</CardTitle>
                        <CardDescription>{proyectos.length} proyectos registrados</CardDescription>
                    </div>
                    <Button size="sm" onClick={openCreate} className="gap-1">
                        <Plus className="h-4 w-4" /> Nuevo proyecto
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {proyectos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                                        No hay proyectos registrados
                                    </TableCell>
                                </TableRow>
                            ) : proyectos.map((p, i) => (
                                <TableRow key={p.id}>
                                    <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                                    <TableCell className="font-medium">{p.nombre}</TableCell>
                                    <TableCell>
                                        <Badge className={p.activo
                                            ? "bg-green-100 text-green-700"
                                            : "bg-slate-100 text-slate-600"}>
                                            {p.activo ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                                                <Edit className="h-4 w-4 text-emerald-600" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(p)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <FormModal
                open={modal}
                onClose={closeModal}
                title={editing ? "Editar proyecto" : "Nuevo proyecto"}
                onSubmit={submit}
                processing={processing}
            >
                <div className="space-y-1.5">
                    <Label>Nombre del proyecto *</Label>
                    <Input
                        value={data.nombre}
                        onChange={e => setData("nombre", e.target.value)}
                        placeholder="Ej: Relavera, Obras Civiles..."
                        autoFocus
                    />
                    {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-3">
                    <input
                        type="checkbox"
                        id="activo"
                        checked={data.activo}
                        onChange={e => setData("activo", e.target.checked)}
                        className="h-4 w-4"
                    />
                    <div>
                        <Label htmlFor="activo" className="cursor-pointer">Proyecto activo</Label>
                        <p className="text-xs text-muted-foreground">
                            Los proyectos inactivos no aparecen en los formularios
                        </p>
                    </div>
                </div>
            </FormModal>
        </>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// PESTAÑA: ALMACENES
// ════════════════════════════════════════════════════════════════════════════

function TabAlmacenes({ almacenes = [], proyectos = [] }) {
    const [modal, setModal]     = useState(false);
    const [editing, setEditing] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nombre:       "",
        proyecto_id:  "",
        tipo_almacen: "OPERATIVO",
        compartido:   false,
        activo:       true,
    });

    const openCreate = () => { reset(); setEditing(null); setModal(true); };
    const openEdit   = (a) => {
        setData({
            nombre:       a.nombre,
            proyecto_id:  a.proyecto_id ? String(a.proyecto_id) : "",
            tipo_almacen: a.tipo_almacen,
            compartido:   !!a.compartido,
            activo:       !!a.activo,
        });
        setEditing(a);
        setModal(true);
    };
    const closeModal = () => { setModal(false); setEditing(null); reset(); };

    const submit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route("almacenes.update", editing.id), {
                preserveScroll: true,
                onSuccess: closeModal,
            });
        } else {
            post(route("almacenes.store"), {
                preserveScroll: true,
                onSuccess: closeModal,
            });
        }
    };

    const handleDelete = (a) => {
        if (!confirm(`¿Eliminar el almacén "${a.nombre}"?`)) return;
        router.delete(route("almacenes.destroy", a.id), { preserveScroll: true });
    };

    const TIPO_CONFIG = {
        OPERATIVO:   { label: "Operativo",   cls: "bg-blue-100 text-blue-700"  },
        SEGREGACION: { label: "Segregación", cls: "bg-amber-100 text-amber-700" },
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Almacenes</CardTitle>
                        <CardDescription>{almacenes.length} almacenes registrados</CardDescription>
                    </div>
                    <Button size="sm" onClick={openCreate} className="gap-1">
                        <Plus className="h-4 w-4" /> Nuevo almacén
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Proyecto</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Compartido</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {almacenes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                        No hay almacenes registrados
                                    </TableCell>
                                </TableRow>
                            ) : almacenes.map((a, i) => (
                                <TableRow key={a.id}>
                                    <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                                    <TableCell className="font-medium">{a.nombre}</TableCell>
                                    <TableCell className="text-sm">{a.proyecto?.nombre ?? "—"}</TableCell>
                                    <TableCell>
                                        <Badge className={`text-xs ${TIPO_CONFIG[a.tipo_almacen]?.cls}`}>
                                            {TIPO_CONFIG[a.tipo_almacen]?.label ?? a.tipo_almacen}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {a.compartido
                                            ? <Badge className="bg-violet-100 text-violet-700 text-xs">Sí</Badge>
                                            : <span className="text-xs text-muted-foreground">No</span>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={a.activo
                                            ? "bg-green-100 text-green-700"
                                            : "bg-slate-100 text-slate-600"}>
                                            {a.activo ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                                                <Edit className="h-4 w-4 text-emerald-600" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(a)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <FormModal
                open={modal}
                onClose={closeModal}
                title={editing ? "Editar almacén" : "Nuevo almacén"}
                onSubmit={submit}
                processing={processing}
            >
                <div className="space-y-1.5">
                    <Label>Nombre del almacén *</Label>
                    <Input
                        value={data.nombre}
                        onChange={e => setData("nombre", e.target.value)}
                        placeholder="Ej: Almacén Relavera, Almacén Segregación..."
                        autoFocus
                    />
                    {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
                </div>

                <div className="space-y-1.5">
                    <Label>Tipo de almacén *</Label>
                    <select
                        value={data.tipo_almacen}
                        onChange={e => setData("tipo_almacen", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="OPERATIVO">Operativo (stock disponible)</option>
                        <option value="SEGREGACION">Segregación (EPP dañados / baja)</option>
                    </select>
                    {errors.tipo_almacen && <p className="text-xs text-red-500">{errors.tipo_almacen}</p>}
                </div>

                {/* Proyecto — solo si es OPERATIVO */}
                {data.tipo_almacen === "OPERATIVO" && (
                    <div className="space-y-1.5">
                        <Label>Proyecto asociado</Label>
                        <select
                            value={data.proyecto_id}
                            onChange={e => setData("proyecto_id", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="">Sin proyecto (compartido)</option>
                            {proyectos.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.compartido}
                            onChange={e => setData("compartido", e.target.checked)}
                            className="h-4 w-4"
                        />
                        <div>
                            <p className="text-sm font-medium">Almacén compartido</p>
                            <p className="text-xs text-muted-foreground">
                                Visible y accesible desde todos los proyectos
                            </p>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.activo}
                            onChange={e => setData("activo", e.target.checked)}
                            className="h-4 w-4"
                        />
                        <div>
                            <p className="text-sm font-medium">Almacén activo</p>
                            <p className="text-xs text-muted-foreground">
                                Los almacenes inactivos no aparecen en los formularios
                            </p>
                        </div>
                    </label>
                </div>
            </FormModal>
        </>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default function ConfiguracionIndex({
    cargos    = [],
    proyectos = [],
    almacenes = [],
}) {
    const { flash = {} } = usePage().props;
    const [tab, setTab] = useState("cargos");

    return (
        <AdminLayout>
            <Head title="Configuración" />

            <div className="flex-1 space-y-6 bg-muted/30 p-6">

                {/* Header */}
                <div className="rounded-2xl border bg-background p-6">
                    <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gestión de tablas maestras del sistema
                    </p>
                </div>

                {/* Flash */}
                {flash.success && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" /> {flash.error}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                tab === key
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Contenido según pestaña */}
                {tab === "cargos"    && <TabCargos    cargos={cargos} />}
                {tab === "proyectos" && <TabProyectos proyectos={proyectos} />}
                {tab === "almacenes" && <TabAlmacenes almacenes={almacenes} proyectos={proyectos} />}
            </div>
        </AdminLayout>
    );
}