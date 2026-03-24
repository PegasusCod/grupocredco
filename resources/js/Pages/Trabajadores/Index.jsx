import React, { useMemo, useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
// CAMBIO: agregamos router para hacer filtros y paginación por Inertia
import { Head, useForm, router } from "@inertiajs/react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  UserCheck,
  UserX,
  Image as ImageIcon,
  AlertTriangle,
  Eye,
  Briefcase,
  Mail,
  Phone,
  CalendarDays,
  BadgeCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const AREAS_BASE = [
  "Proyectos",
  "Proyectos Relavera",
  "Administración",
];

function ResumenCard({ title, value, icon: Icon, valueClassName = "" }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${valueClassName}`}>{value}</p>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TrabajadoresIndex({
  auth,
  // CAMBIO: ahora trabajadores ya no es array plano, sino paginador de Laravel
  trabajadores = {
    data: [],
    links: [],
    total: 0,
    current_page: 1,
    last_page: 1,
    from: null,
    to: null,
  },
  cargos = [],
  // CAMBIO: recibimos filtros desde backend
  filters = {},
}) {
  // CAMBIO: iniciamos estados con filtros que vienen desde Laravel
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [selectedArea, setSelectedArea] = useState(filters.area || "todos");
  const [selectedEstado, setSelectedEstado] = useState(
    filters.estado || "todos"
  );

  const [showTrabajadorModal, setShowTrabajadorModal] = useState(false);
  const [showCargoModal, setShowCargoModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedTrabajador, setSelectedTrabajador] = useState(null);

  const canCreateTrabajador = cargos.length > 0;

  // CAMBIO: usamos la data real del paginador
  const trabajadoresData = trabajadores?.data || [];

  const {
    data: trabajadorData,
    setData: setTrabajadorData,
    post: postTrabajador,
    delete: destroyTrabajador,
    processing: processingTrabajador,
    errors: trabajadorErrors,
    reset: resetTrabajador,
  } = useForm({
    id: "",
    codigo_fotocheck: "",
    nombres: "",
    apellidos: "",
    dni: "",
    telefono: "",
    correo: "",
    area: "",
    cargo_id: "",
    fecha_ingreso: "",
    estado: "activo",
    foto: null,
    _method: undefined,
  });

  const {
    data: cargoData,
    setData: setCargoData,
    post: postCargo,
    processing: processingCargo,
    errors: cargoErrors,
    reset: resetCargo,
  } = useForm({
    nombre: "",
  });

  // CAMBIO: allAreas ahora sale de trabajadoresData en vez de trabajadores plano
  const allAreas = useMemo(() => {
    const areasDB = trabajadoresData.map((t) => t.area).filter(Boolean);
    return Array.from(new Set([...AREAS_BASE, ...areasDB]));
  }, [trabajadoresData]);

  // CAMBIO: las estadísticas usan la página actual.
  // total sí puede venir del total global del paginador.
  const stats = useMemo(() => {
    const total = trabajadores?.total || 0;
    const activos = trabajadoresData.filter((t) => t.estado === "activo").length;
    const inactivos = trabajadoresData.filter(
      (t) => t.estado === "inactivo"
    ).length;
    const conFoto = trabajadoresData.filter((t) => !!t.foto_url).length;

    return { total, activos, inactivos, conFoto };
  }, [trabajadores, trabajadoresData]);

  const formatDate = (dateString) => {
    if (!dateString) return "Sin fecha";
    const [y, m, d] = String(dateString).slice(0, 10).split("-");
    if (!y || !m || !d) return dateString;
    return `${d}/${m}/${y}`;
  };

  const getInitials = (trabajador) => {
    const n = trabajador?.nombres?.[0] ?? "";
    const a = trabajador?.apellidos?.[0] ?? "";
    const initials = `${n}${a}`.toUpperCase();
    return initials || "?";
  };

  // CAMBIO: función para aplicar filtros por backend con Inertia
  const applyFilters = (params = {}) => {
    router.get(
      route("trabajadores.index"),
      {
        search: params.search ?? searchTerm,
        area: params.area ?? selectedArea,
        estado: params.estado ?? selectedEstado,
      },
      {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      }
    );
  };

  // CAMBIO: función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedArea("todos");
    setSelectedEstado("todos");

    router.get(
      route("trabajadores.index"),
      {
        search: "",
        area: "todos",
        estado: "todos",
      },
      {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      }
    );
  };

  const resetTrabajadorForm = () => {
    resetTrabajador();
    setTrabajadorData({
      id: "",
      codigo_fotocheck: "",
      nombres: "",
      apellidos: "",
      dni: "",
      telefono: "",
      correo: "",
      area: "",
      cargo_id: "",
      fecha_ingreso: "",
      estado: "activo",
      foto: null,
      _method: undefined,
    });
    setPreviewUrl(null);
    setIsEditing(false);
  };

  const closeTrabajadorModal = () => {
    setShowTrabajadorModal(false);
    resetTrabajadorForm();
  };

  const openCreateTrabajadorModal = () => {
    resetTrabajadorForm();
    setShowTrabajadorModal(true);
  };

  const openEditTrabajadorModal = (trabajador) => {
    setTrabajadorData({
      id: trabajador.id ?? "",
      codigo_fotocheck: trabajador.codigo_fotocheck ?? "",
      nombres: trabajador.nombres ?? "",
      apellidos: trabajador.apellidos ?? "",
      dni: trabajador.dni ?? "",
      telefono: trabajador.telefono ?? "",
      correo: trabajador.correo ?? "",
      area: trabajador.area ?? "",
      cargo_id: trabajador.cargo_id ? String(trabajador.cargo_id) : "",
      fecha_ingreso: trabajador.fecha_ingreso
        ? String(trabajador.fecha_ingreso).slice(0, 10)
        : "",
      estado: trabajador.estado ?? "activo",
      foto: null,
      _method: "put",
    });

    setPreviewUrl(trabajador.foto_url ?? null);
    setIsEditing(true);
    setShowTrabajadorModal(true);
  };

  const openDetailTrabajadorModal = (trabajador) => {
    setSelectedTrabajador(trabajador);
    setShowDetailModal(true);
  };

  const closeDetailTrabajadorModal = () => {
    setSelectedTrabajador(null);
    setShowDetailModal(false);
  };

  const submitTrabajador = (e) => {
    e.preventDefault();

    const url = isEditing
      ? route("trabajadores.update", trabajadorData.id)
      : route("trabajadores.store");

    postTrabajador(url, {
      forceFormData: true,
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => closeTrabajadorModal(),
    });
  };

  const submitCargo = (e) => {
    e.preventDefault();

    postCargo(route("cargos.quick-store"), {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        setShowCargoModal(false);
        resetCargo();
      },
    });
  };

  const handleDeleteTrabajador = (trabajador) => {
    const nombreCompleto = `${trabajador.nombres} ${trabajador.apellidos}`.trim();

    if (!window.confirm(`¿Seguro que deseas eliminar a ${nombreCompleto}?`)) {
      return;
    }

    destroyTrabajador(route("trabajadores.destroy", trabajador.id), {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setTrabajadorData("foto", file);

    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <AdminLayout user={auth?.user}>
      <Head title="Trabajadores" />

      <div className="space-y-6 p-4 md:p-6">
        {/* Encabezado */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Trabajadores</h1>
            <p className="text-sm text-muted-foreground">
              Gestión de personal para control y trazabilidad de EPP.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCargoModal(true)}
            >
              <Briefcase className="mr-2 h-4 w-4" />
              Nuevo cargo
            </Button>

            <Button
              type="button"
              onClick={openCreateTrabajadorModal}
              disabled={!canCreateTrabajador}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo trabajador
            </Button>
          </div>
        </div>

        {/* Aviso si no hay cargos */}
        {!canCreateTrabajador && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">
                  No hay cargos registrados
                </p>
                <p className="text-sm text-amber-800">
                  Primero crea al menos un cargo para poder registrar un
                  trabajador.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumen */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ResumenCard title="Total" value={stats.total} icon={Users} />
          <ResumenCard
            title="Activos"
            value={stats.activos}
            icon={UserCheck}
            valueClassName="text-green-600"
          />
          <ResumenCard
            title="Inactivos"
            value={stats.inactivos}
            icon={UserX}
            valueClassName="text-slate-500"
          />
          <ResumenCard
            title="Con foto"
            value={stats.conFoto}
            icon={ImageIcon}
            valueClassName="text-blue-600"
          />
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtros</CardTitle>
            <CardDescription>
              Busca por nombre, DNI, correo, teléfono o código de fotocheck.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* CAMBIO: agregamos botones Buscar y Limpiar */}
            <div className="grid gap-4 md:grid-cols-6">
              <div className="relative md:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyFilters();
                  }}
                  placeholder="Buscar trabajador..."
                  className="pl-9"
                />
              </div>

              <select
                value={selectedArea}
                // CAMBIO: ahora filtra en backend
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedArea(value);
                  applyFilters({ area: value });
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="todos">Todas las áreas</option>
                {allAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>

              <select
                value={selectedEstado}
                // CAMBIO: ahora filtra en backend
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedEstado(value);
                  applyFilters({ estado: value });
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="todos">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>

              <Button type="button" onClick={() => applyFilters()}>
                Buscar
              </Button>

              <Button type="button" variant="outline" onClick={clearFilters}>
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Desktop: tabla */}
        <Card className="hidden overflow-hidden md:block">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-base">Listado de trabajadores</CardTitle>
            {/* CAMBIO: ya no usamos filteredTrabajadores.length */}
            <CardDescription>
              Mostrando {trabajadoresData.length} de {trabajadores.total} resultado(s)
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-[1050px] w-full">
                <thead className="bg-muted/40">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Trabajador
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Fotocheck
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Contacto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Área / Cargo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Ingreso
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Entregas EPP
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted-foreground">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {/* CAMBIO: usamos trabajadoresData */}
                  {trabajadoresData.length > 0 ? (
                    trabajadoresData.map((trabajador) => (
                      <tr
                        key={trabajador.id}
                        className="border-b transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {trabajador.foto_url ? (
                              <img
                                src={trabajador.foto_url}
                                alt={`${trabajador.nombres} ${trabajador.apellidos}`}
                                className="h-11 w-11 rounded-full object-cover ring-1 ring-border"
                              />
                            ) : (
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                                {getInitials(trabajador)}
                              </div>
                            )}

                            <div>
                              <p className="font-medium">
                                {trabajador.nombres} {trabajador.apellidos}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                DNI: {trabajador.dni}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className="rounded-md bg-muted px-2 py-1 font-mono text-sm">
                            {trabajador.codigo_fotocheck}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="space-y-1 text-sm">
                            <p>{trabajador.correo || "Sin correo"}</p>
                            <p className="text-muted-foreground">
                              {trabajador.telefono || "Sin teléfono"}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="space-y-1 text-sm">
                            <p>{trabajador.area || "Sin área"}</p>
                            <p className="text-muted-foreground">
                              {trabajador.cargo?.nombre || "Sin cargo"}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {formatDate(trabajador.fecha_ingreso)}
                        </td>

                        <td className="px-4 py-4 text-sm font-medium">
                          {trabajador.entregas_count ?? 0}
                        </td>

                        <td className="px-4 py-4">
                          <Badge
                            className={
                              trabajador.estado === "activo"
                                ? "bg-green-100 text-green-700 hover:bg-green-100"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                            }
                          >
                            {trabajador.estado === "activo"
                              ? "Activo"
                              : "Inactivo"}
                          </Badge>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => openDetailTrabajadorModal(trabajador)}
                              title="Ver detalle"
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditTrabajadorModal(trabajador)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4 text-emerald-600" />
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTrabajador(trabajador)}
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-14 text-center">
                        <div className="mx-auto max-w-md space-y-3">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                            <Users className="h-6 w-6 text-muted-foreground" />
                          </div>

                          <div>
                            <p className="font-medium">
                              No hay trabajadores para mostrar
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Ajusta los filtros o registra un nuevo trabajador.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* CAMBIO: bloque de paginación para desktop */}
            {trabajadores.links?.length > 0 && (
              <div className="flex flex-col gap-3 border-t px-4 py-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                  Página {trabajadores.current_page} de {trabajadores.last_page}
                  {trabajadores.from && trabajadores.to
                    ? ` · Mostrando ${trabajadores.from} a ${trabajadores.to}`
                    : ""}
                </p>

                <div className="flex flex-wrap gap-2">
                  {trabajadores.links.map((link, index) => (
                    <Button
                      key={index}
                      type="button"
                      size="sm"
                      variant={link.active ? "default" : "outline"}
                      disabled={!link.url}
                      onClick={() => {
                        if (link.url) {
                          router.visit(link.url, {
                            preserveState: true,
                            preserveScroll: true,
                          });
                        }
                      }}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mobile: tarjetas */}
        <div className="space-y-4 md:hidden">
          {/* CAMBIO: usamos trabajadoresData */}
          {trabajadoresData.length > 0 ? (
            trabajadoresData.map((trabajador) => (
              <Card key={trabajador.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {trabajador.foto_url ? (
                      <img
                        src={trabajador.foto_url}
                        alt={`${trabajador.nombres} ${trabajador.apellidos}`}
                        className="h-14 w-14 rounded-full object-cover ring-1 ring-border"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                        {getInitials(trabajador)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">
                            {trabajador.nombres} {trabajador.apellidos}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {trabajador.cargo?.nombre || "Sin cargo"}
                          </p>
                        </div>

                        <Badge
                          className={
                            trabajador.estado === "activo"
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                          }
                        >
                          {trabajador.estado === "activo"
                            ? "Activo"
                            : "Inactivo"}
                        </Badge>
                      </div>

                      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                        <p>DNI: {trabajador.dni}</p>
                        <p>Fotocheck: {trabajador.codigo_fotocheck}</p>
                        <p>Área: {trabajador.area || "Sin área"}</p>
                        <p>Ingreso: {formatDate(trabajador.fecha_ingreso)}</p>
                        <p>Entregas EPP: {trabajador.entregas_count ?? 0}</p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailTrabajadorModal(trabajador)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditTrabajadorModal(trabajador)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTrabajador(trabajador)}
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-3 font-medium">No hay trabajadores</p>
                <p className="text-sm text-muted-foreground">
                  No se encontraron resultados con los filtros actuales.
                </p>
              </CardContent>
            </Card>
          )}

          {/* CAMBIO: paginación también en móvil */}
          {trabajadores.links?.length > 0 && (
            <Card>
              <CardContent className="space-y-3 p-4">
                <p className="text-sm text-muted-foreground">
                  Página {trabajadores.current_page} de {trabajadores.last_page}
                </p>

                <div className="flex flex-wrap gap-2">
                  {trabajadores.links.map((link, index) => (
                    <Button
                      key={index}
                      type="button"
                      size="sm"
                      variant={link.active ? "default" : "outline"}
                      disabled={!link.url}
                      onClick={() => {
                        if (link.url) {
                          router.visit(link.url, {
                            preserveState: true,
                            preserveScroll: true,
                          });
                        }
                      }}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal crear / editar trabajador */}
      <Dialog
        open={showTrabajadorModal}
        onOpenChange={(open) => {
          if (!open) closeTrabajadorModal();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar trabajador" : "Nuevo trabajador"}
            </DialogTitle>
            <DialogDescription>
              Completa la información del trabajador.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitTrabajador} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombres">Nombres</Label>
                <Input
                  id="nombres"
                  value={trabajadorData.nombres}
                  onChange={(e) => setTrabajadorData("nombres", e.target.value)}
                />
                {trabajadorErrors.nombres && (
                  <p className="text-xs text-red-500">
                    {trabajadorErrors.nombres}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input
                  id="apellidos"
                  value={trabajadorData.apellidos}
                  onChange={(e) =>
                    setTrabajadorData("apellidos", e.target.value)
                  }
                />
                {trabajadorErrors.apellidos && (
                  <p className="text-xs text-red-500">
                    {trabajadorErrors.apellidos}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  value={trabajadorData.dni}
                  onChange={(e) => setTrabajadorData("dni", e.target.value)}
                />
                {trabajadorErrors.dni && (
                  <p className="text-xs text-red-500">{trabajadorErrors.dni}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo_fotocheck">Código de fotocheck</Label>
                <Input
                  id="codigo_fotocheck"
                  value={trabajadorData.codigo_fotocheck}
                  onChange={(e) =>
                    setTrabajadorData("codigo_fotocheck", e.target.value)
                  }
                />
                {trabajadorErrors.codigo_fotocheck && (
                  <p className="text-xs text-red-500">
                    {trabajadorErrors.codigo_fotocheck}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="correo">Correo</Label>
                <Input
                  id="correo"
                  type="email"
                  value={trabajadorData.correo}
                  onChange={(e) => setTrabajadorData("correo", e.target.value)}
                />
                {trabajadorErrors.correo && (
                  <p className="text-xs text-red-500">
                    {trabajadorErrors.correo}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={trabajadorData.telefono}
                  onChange={(e) => setTrabajadorData("telefono", e.target.value)}
                />
                {trabajadorErrors.telefono && (
                  <p className="text-xs text-red-500">
                    {trabajadorErrors.telefono}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Área</Label>
                <select
                  id="area"
                  value={trabajadorData.area}
                  onChange={(e) => setTrabajadorData("area", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar área</option>
                  {allAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                {trabajadorErrors.area && (
                  <p className="text-xs text-red-500">{trabajadorErrors.area}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="cargo_id">Cargo</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1 text-xs"
                    onClick={() => setShowCargoModal(true)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Crear cargo
                  </Button>
                </div>

                <select
                  id="cargo_id"
                  value={trabajadorData.cargo_id}
                  onChange={(e) => setTrabajadorData("cargo_id", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar cargo</option>
                  {cargos.map((cargo) => (
                    <option key={cargo.id} value={cargo.id}>
                      {cargo.nombre}
                    </option>
                  ))}
                </select>
                {trabajadorErrors.cargo_id && (
                  <p className="text-xs text-red-500">
                    {trabajadorErrors.cargo_id}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_ingreso">Fecha de ingreso</Label>
                <Input
                  id="fecha_ingreso"
                  type="date"
                  value={trabajadorData.fecha_ingreso}
                  onChange={(e) =>
                    setTrabajadorData("fecha_ingreso", e.target.value)
                  }
                />
                {trabajadorErrors.fecha_ingreso && (
                  <p className="text-xs text-red-500">
                    {trabajadorErrors.fecha_ingreso}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <select
                  id="estado"
                  value={trabajadorData.estado}
                  onChange={(e) => setTrabajadorData("estado", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
                {trabajadorErrors.estado && (
                  <p className="text-xs text-red-500">
                    {trabajadorErrors.estado}
                  </p>
                )}
              </div>

              <div className="space-y-3 md:col-span-2">
                <Label htmlFor="foto">Foto del trabajador</Label>

                <div className="grid gap-4 rounded-xl border border-dashed p-4 md:grid-cols-[120px_1fr]">
                  <div className="flex items-center justify-center">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Vista previa"
                        className="h-24 w-24 rounded-full object-cover ring-1 ring-border"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Input
                      id="foto"
                      type="file"
                      accept="image/*"
                      onChange={handleFotoChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG o WEBP. Máximo 2 MB.
                    </p>
                    {trabajadorErrors.foto && (
                      <p className="text-xs text-red-500">
                        {trabajadorErrors.foto}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeTrabajadorModal}
                disabled={processingTrabajador}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={processingTrabajador || !canCreateTrabajador}
              >
                {processingTrabajador
                  ? "Guardando..."
                  : isEditing
                  ? "Actualizar trabajador"
                  : "Guardar trabajador"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal detalle del trabajador */}
      <Dialog
        open={showDetailModal}
        onOpenChange={(open) => {
          if (!open) closeDetailTrabajadorModal();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del trabajador</DialogTitle>
            <DialogDescription>
              Información general y resumen de asignaciones.
            </DialogDescription>
          </DialogHeader>

          {selectedTrabajador && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {selectedTrabajador.foto_url ? (
                  <img
                    src={selectedTrabajador.foto_url}
                    alt={`${selectedTrabajador.nombres} ${selectedTrabajador.apellidos}`}
                    className="h-20 w-20 rounded-full object-cover ring-1 ring-border"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                    {getInitials(selectedTrabajador)}
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-xl font-bold">
                    {selectedTrabajador.nombres} {selectedTrabajador.apellidos}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTrabajador.cargo?.nombre || "Sin cargo"}
                  </p>

                  <div className="mt-2">
                    <Badge
                      className={
                        selectedTrabajador.estado === "activo"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                      }
                    >
                      {selectedTrabajador.estado === "activo"
                        ? "Activo"
                        : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Información personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Código fotocheck</p>
                      <p className="font-medium">
                        {selectedTrabajador.codigo_fotocheck}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">DNI</p>
                      <p className="font-medium">{selectedTrabajador.dni}</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Fecha de ingreso</p>
                      <p className="font-medium">
                        {formatDate(selectedTrabajador.fecha_ingreso)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Contacto y ubicación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Correo</p>
                        <p className="font-medium">
                          {selectedTrabajador.correo || "Sin correo"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Teléfono</p>
                        <p className="font-medium">
                          {selectedTrabajador.telefono || "Sin teléfono"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Briefcase className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Área</p>
                        <p className="font-medium">
                          {selectedTrabajador.area || "Sin área"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <BadgeCheck className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Entregas EPP
                        </p>
                        <p className="text-2xl font-bold">
                          {selectedTrabajador.entregas_count ?? 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Fecha de ingreso
                        </p>
                        <p className="font-semibold">
                          {formatDate(selectedTrabajador.fecha_ingreso)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-slate-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Estado</p>
                        <p className="font-semibold">
                          {selectedTrabajador.estado === "activo"
                            ? "Activo"
                            : "Inactivo"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={closeDetailTrabajadorModal}>
                  Cerrar
                </Button>

                <Button
                  onClick={() => {
                    closeDetailTrabajadorModal();
                    openEditTrabajadorModal(selectedTrabajador);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar trabajador
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal crear cargo */}
      <Dialog
        open={showCargoModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowCargoModal(false);
            resetCargo();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo cargo</DialogTitle>
            <DialogDescription>
              Crea un cargo sin salir de la vista de trabajadores.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitCargo} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cargo_nombre">Nombre del cargo</Label>
              <Input
                id="cargo_nombre"
                value={cargoData.nombre}
                onChange={(e) => setCargoData("nombre", e.target.value)}
                placeholder="Ejemplo: Operador"
              />
              {cargoErrors.nombre && (
                <p className="text-xs text-red-500">{cargoErrors.nombre}</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCargoModal(false);
                  resetCargo();
                }}
                disabled={processingCargo}
              >
                Cancelar
              </Button>

              <Button type="submit" disabled={processingCargo}>
                {processingCargo ? "Guardando..." : "Guardar cargo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}