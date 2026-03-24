import { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import {
  Calendar,
  Package,
  Plus,
  Search,
  TrendingUp,
  User,
} from "lucide-react";

import AdminLayout from "@/Layouts/AdminLayout";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export default function InventarioIndex({
  items,
  ingresos,
  stats,
  filters,
  authUser,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(filters?.search || "");
  const firstLoad = useRef(true);

  const emptyDetalle = () => ({
    epp_item_id: "",
    talla: "",
    cantidad: 1,
  });

  const { data, setData, post, processing, errors, reset } = useForm({
    fecha_ingreso: "",
    numero_lote: "",
    proveedor: "",
    observaciones: "",
    detalles: [emptyDetalle()],
  });


  /* AÑADIR HELPERS PARA AÑADIR Y QUITAR LINEAS  */

  const addDetalle = () => {
    setData("detalles", [...data.detalles, emptyDetalle()]);
  };

  const removeDetalle = (index) => {
    if (data.detalles.length === 1) return;
    setData(
      "detalles",
      data.detalles.filter((_, i) => i !== index)
    );
  };

  const updateDetalle = (index, field, value) => {
    const nuevos = [...data.detalles];
    nuevos[index] = {
      ...nuevos[index],
      [field]: value,
    };

    if (field === "epp_item_id") {
      nuevos[index].talla = "";
    }

    setData("detalles", nuevos);
  };

  const getSelectedItem = (eppItemId) => {
    return items.find((item) => String(item.id) === String(eppItemId));
  };

  /*   const { data, setData, post, processing, errors, reset } = useForm({
      fecha_ingreso: "",
      numero_lote: "",
      epp_item_id: "",
      talla: "",
      cantidad: "",
      proveedor: "",
      observaciones: "",
    }); */

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }

    const timer = setTimeout(() => {
      router.get(
        "/inventario",
        { search },
        {
          preserveState: true,
          preserveScroll: true,
          replace: true,
        }
      );
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const selectedItem = useMemo(() => {
    return items.find((item) => String(item.id) === String(data.epp_item_id));
  }, [items, data.epp_item_id]);

  const stockAnterior = selectedItem?.stock_total ?? 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    post("/inventario/ingresos", {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        setOpen(false);
      },
    });
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(`${value}T00:00:00`).toLocaleDateString("es-PE");
  };

  return (
    <AdminLayout>
      <Head title="Inventario - Ingresos de EPP" />

      <div className="flex-1 space-y-6 bg-muted/30 p-6">
        <div className="flex flex-col gap-4 rounded-2xl border bg-background p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Inventario - Ingresos de EPP
            </h1>
            <p className="text-sm text-muted-foreground">
              Control de lotes de ingreso de equipos
            </p>
          </div>

          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Registrar Ingreso
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-2xl">
            <CardContent className="flex items-start justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Ingresos</p>
                <p className="mt-2 text-3xl font-bold">{stats.total_ingresos}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Lotes registrados
                </p>
              </div>
              <Package className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-green-600 text-white">
            <CardContent className="flex items-start justify-between p-6">
              <div>
                <p className="text-sm text-white/90">Unidades Ingresadas</p>
                <p className="mt-2 text-3xl font-bold">
                  {stats.unidades_ingresadas}
                </p>
                <p className="mt-1 text-xs text-white/90">EPPs en total</p>
              </div>
              <TrendingUp className="h-5 w-5" />
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="flex items-start justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">Último Ingreso</p>
                <p className="mt-2 text-2xl font-bold">
                  {stats.ultimo_ingreso ?? "-"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Fecha más reciente
                </p>
              </div>
              <Calendar className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <Label htmlFor="search" className="mb-2 block">
              Buscar por EPP, Lote, Proveedor o Responsable
            </Label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl">
          <div className="border-b bg-muted/30 px-6 py-4">
            <h2 className="text-lg font-semibold">Historial de Ingresos</h2>
            <p className="text-sm text-muted-foreground">
              Registro detallado de lotes de entrada
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>EPP</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Responsable</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {ingresos.data.length > 0 ? (
                  ingresos.data.map((ingreso) => (
                    <TableRow key={ingreso.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(ingreso.fecha)}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-xs text-primary">
                          {ingreso.lote}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div>
                          <div className="font-medium">{ingreso.epp.nombre}</div>
                          <div className="text-xs text-muted-foreground">
                            {ingreso.epp.codigo}
                            {ingreso.talla ? ` · Talla ${ingreso.talla}` : ""}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                          + {ingreso.cantidad}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              {ingreso.stock_anterior_item}
                            </span>{" "}
                            →{" "}
                            <span className="font-bold text-green-600">
                              {ingreso.stock_nuevo_item}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              (total)
                            </span>
                          </div>

                          {ingreso.talla &&
                            ingreso.stock_anterior_talla !== null && (
                              <div className="text-xs text-muted-foreground">
                                Talla {ingreso.talla}:{" "}
                                {ingreso.stock_anterior_talla} →{" "}
                                {ingreso.stock_nuevo_talla}
                              </div>
                            )}
                        </div>
                      </TableCell>

                      <TableCell>{ingreso.proveedor}</TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{ingreso.responsable}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No se encontraron registros
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 border-t px-6 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {ingresos.meta.from ?? 0} a {ingresos.meta.to ?? 0} de{" "}
              {ingresos.meta.total} registros
            </p>

            <div className="flex items-center gap-2">
              {ingresos.meta.prev_page_url ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={ingresos.meta.prev_page_url} preserveScroll>
                    Anterior
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
              )}

              <span className="text-sm text-muted-foreground">
                Página {ingresos.meta.current_page} de {ingresos.meta.last_page}
              </span>

              {ingresos.meta.next_page_url ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={ingresos.meta.next_page_url} preserveScroll>
                    Siguiente
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Siguiente
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Ingreso de EPP</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Datos del lote */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Fecha de Ingreso *</Label>
                <Input
                  type="date"
                  value={data.fecha_ingreso}
                  onChange={(e) => setData("fecha_ingreso", e.target.value)}
                />
                {errors.fecha_ingreso && (
                  <p className="text-sm text-red-500">{errors.fecha_ingreso}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Número de Lote *</Label>
                <Input
                  placeholder="LOTE-2026-001"
                  value={data.numero_lote}
                  onChange={(e) => setData("numero_lote", e.target.value)}
                />
                {errors.numero_lote && (
                  <p className="text-sm text-red-500">{errors.numero_lote}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Proveedor *</Label>
                <Input
                  placeholder="Nombre del proveedor"
                  value={data.proveedor}
                  onChange={(e) => setData("proveedor", e.target.value)}
                />
                {errors.proveedor && (
                  <p className="text-sm text-red-500">{errors.proveedor}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Responsable *</Label>
                <Input value={authUser.name} readOnly disabled />
                <p className="text-xs text-muted-foreground">
                  Se registra automáticamente con el usuario logueado.
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Observaciones</Label>
                <Textarea
                  rows={3}
                  placeholder="Observaciones adicionales sobre el ingreso..."
                  value={data.observaciones}
                  onChange={(e) => setData("observaciones", e.target.value)}
                />
                {errors.observaciones && (
                  <p className="text-sm text-red-500">{errors.observaciones}</p>
                )}
              </div>
            </div>

            {/* Detalles */}
            <div className="space-y-4">
              {data.detalles.map((detalle, index) => {
                const selectedItem = getSelectedItem(detalle.epp_item_id);
                const stockAnterior = selectedItem?.stock_total ?? 0;

                return (
                  <div key={index} className="rounded-xl border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">EPP #{index + 1}</h3>

                      {data.detalles.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeDetalle(index)}
                        >
                          Quitar
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Seleccionar EPP *</Label>
                        <Select
                          value={detalle.epp_item_id || undefined}
                          onValueChange={(value) =>
                            updateDetalle(index, "epp_item_id", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar equipo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {items.map((item) => (
                              <SelectItem key={item.id} value={String(item.id)}>
                                {item.nombre} ({item.codigo})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {errors[`detalles.${index}.epp_item_id`] && (
                          <p className="text-sm text-red-500">
                            {errors[`detalles.${index}.epp_item_id`]}
                          </p>
                        )}
                      </div>

                      {selectedItem?.usa_tallas && (
                        <div className="space-y-2 md:col-span-2">
                          <Label>Talla *</Label>
                          <Input
                            list={`tallas-sugeridas-${index}`}
                            placeholder="Ej: S, M, L, XL o 39, 40, 41"
                            value={detalle.talla}
                            onChange={(e) =>
                              updateDetalle(index, "talla", e.target.value)
                            }
                          />

                          <datalist id={`tallas-sugeridas-${index}`}>
                            {selectedItem.tallas.map((talla) => (
                              <option key={talla.id} value={talla.talla} />
                            ))}
                          </datalist>

                          <p className="text-xs text-muted-foreground">
                            Si esa talla ya existe, se suma stock. Si no existe, se crea.
                          </p>

                          {selectedItem.tallas.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {selectedItem.tallas.map((talla) => (
                                <span
                                  key={talla.id}
                                  className="rounded-full bg-muted px-2 py-1 text-xs"
                                >
                                  {talla.talla}: {talla.stock_actual}
                                </span>
                              ))}
                            </div>
                          )}

                          {errors[`detalles.${index}.talla`] && (
                            <p className="text-sm text-red-500">
                              {errors[`detalles.${index}.talla`]}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Cantidad *</Label>
                        <Input
                          type="number"
                          min={1}
                          value={detalle.cantidad}
                          onChange={(e) =>
                            updateDetalle(index, "cantidad", e.target.value)
                          }
                        />
                        {errors[`detalles.${index}.cantidad`] && (
                          <p className="text-sm text-red-500">
                            {errors[`detalles.${index}.cantidad`]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Stock Anterior</Label>
                        <Input value={stockAnterior} readOnly />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button type="button" variant="outline" onClick={addDetalle} className="gap-2">
              <Plus className="h-4 w-4" />
              Añadir otro EPP
            </Button>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
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
