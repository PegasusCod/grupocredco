import AdminLayout from "@/Layouts/AdminLayout"
import { Head } from "@inertiajs/react"

import {
  AlertCircle,
  Activity,
  Clock,
  Package,
  TrendingUp,
  TrendingDown,
  HardHat,
  Users,
} from "lucide-react"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const stockVsMinimoData = [
  { epp: "Cascos", stock: 245, minimo: 200 },
  { epp: "Guantes", stock: 180, minimo: 250 },
  { epp: "Botas", stock: 156, minimo: 150 },
  { epp: "Gafas", stock: 98, minimo: 120 },
  { epp: "Chalecos", stock: 89, minimo: 100 },
  { epp: "Arneses", stock: 45, minimo: 80 },
]

const consumoData = [
  { dia: "01", cantidad: 12 },
  { dia: "03", cantidad: 18 },
  { dia: "05", cantidad: 15 },
  { dia: "07", cantidad: 22 },
  { dia: "09", cantidad: 19 },
  { dia: "11", cantidad: 25 },
  { dia: "13", cantidad: 21 },
  { dia: "15", cantidad: 28 },
  { dia: "17", cantidad: 24 },
  { dia: "19", cantidad: 30 },
  { dia: "21", cantidad: 26 },
  { dia: "23", cantidad: 32 },
  { dia: "25", cantidad: 29 },
  { dia: "27", cantidad: 35 },
  { dia: "29", cantidad: 31 },
]

const cumplimientoData = [
  { area: "Producción", cumplimiento: 95 },
  { area: "Almacén", cumplimiento: 85 },
  { area: "Mantenimiento", cumplimiento: 72 },
]

const incumplimientoData = [
  { causa: "Olvido", cantidad: 45, porcentaje: 35 },
  { causa: "EPP deteriorado", cantidad: 32, porcentaje: 25 },
  { causa: "Incomodidad", cantidad: 28, porcentaje: 22 },
  { causa: "No disponible", cantidad: 18, porcentaje: 14 },
  { causa: "Otros", cantidad: 5, porcentaje: 4 },
]

const vencimientosData = [
  { epp: "Cascos Seguridad", empleado: "Carlos Rodríguez", dias: 15, categoria: "30" },
  { epp: "Guantes Industriales", empleado: "María González", dias: 22, categoria: "30" },
  { epp: "Botas Puntera", empleado: "Pedro Martínez", dias: 28, categoria: "30" },
  { epp: "Gafas Protección", empleado: "Ana López", dias: 45, categoria: "60" },
  { epp: "Chaleco Reflectivo", empleado: "Luis Hernández", dias: 52, categoria: "60" },
  { epp: "Arnés Seguridad", empleado: "José García", dias: 75, categoria: "90" },
  { epp: "Protector Auditivo", empleado: "Carmen Silva", dias: 88, categoria: "90" },
]

const stockChartConfig = {
  stock: {
    label: "Stock Actual",
    color: "var(--chart-1)",
  },
  minimo: {
    label: "Stock Mínimo",
    color: "var(--chart-2)",
  },
}

const consumoChartConfig = {
  cantidad: {
    label: "Unidades",
    color: "var(--chart-3)",
  },
}

const cumplimientoChartConfig = {
  cumplimiento: {
    label: "% Cumplimiento",
    color: "var(--chart-4)",
  },
}

const paretoChartConfig = {
  cantidad: {
    label: "Cantidad",
    color: "var(--chart-1)",
  },
  porcentaje: {
    label: "% Acumulado",
    color: "var(--chart-2)",
  },
}

export default function Dashboard() {
  const total30 = vencimientosData.filter((v) => v.categoria === "30").length
  const total60 = vencimientosData.filter((v) => v.categoria === "60").length
  const total90 = vencimientosData.filter((v) => v.categoria === "90").length

  return (
    <AdminLayout>
      <Head title="Dashboard" />

      <div className="flex-1 space-y-6 bg-muted/30 p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard de Control EPP</h1>
          <p className="text-muted-foreground">
            Monitoreo en tiempo real del sistema
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <KPICard
            title="Stock crítico"
            value="3"
            subtitle="EPPs bajo mínimo"
            icon={AlertCircle}
            trend="up"
            trendValue="+1"
          />
          <KPICard
            title="Cumplimiento"
            value="87%"
            subtitle="Uso de EPP"
            icon={Activity}
            trend="up"
            trendValue="+3%"
          />
          <KPICard
            title="Días cobertura"
            value="45"
            subtitle="Días promedio"
            icon={Clock}
            trend="down"
            trendValue="-2"
          />
          <KPICard
            title="Renovaciones"
            value="12"
            subtitle="Este mes"
            icon={Package}
            trend="up"
            trendValue="+3"
          />
          <KPICard
            title="Incidentes"
            value="5"
            subtitle="Reportados"
            icon={AlertCircle}
            trend="down"
            trendValue="-2"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Stock vs mínimo por EPP</CardTitle>
              <CardDescription>Comparativo de inventario actual y mínimo</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={stockChartConfig} className="min-h-[320px] w-full">
                <BarChart accessibilityLayer data={stockVsMinimoData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="epp"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="stock" fill="var(--color-stock)" radius={6} />
                  <Bar dataKey="minimo" fill="var(--color-minimo)" radius={6} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consumo de EPP</CardTitle>
              <CardDescription>Últimos 30 días</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={consumoChartConfig} className="min-h-[320px] w-full">
                <LineChart accessibilityLayer data={consumoData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="dia"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="cantidad"
                    stroke="var(--color-cantidad)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Cumplimiento por área</CardTitle>
              <CardDescription>Porcentaje actual por unidad</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={cumplimientoChartConfig} className="min-h-[320px] w-full">
                <BarChart accessibilityLayer data={cumplimientoData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="area"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="cumplimiento" radius={6}>
                    {cumplimientoData.map((entry, index) => (
                      <Cell
                        key={`cumplimiento-${index}`}
                        fill={
                          entry.cumplimiento >= 90
                            ? "#10b981"
                            : entry.cumplimiento >= 80
                            ? "#f59e0b"
                            : "#ef4444"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pareto de incumplimiento</CardTitle>
              <CardDescription>Causas principales detectadas</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={paretoChartConfig} className="min-h-[320px] w-full">
                <ComposedChart accessibilityLayer data={incumplimientoData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="causa"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    angle={-12}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    yAxisId="left"
                    dataKey="cantidad"
                    fill="var(--color-cantidad)"
                    radius={6}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="porcentaje"
                    stroke="var(--color-porcentaje)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function KPICard({ title, value, subtitle, icon: Icon, trend, trendValue }) {
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown
  const trendClass = trend === "up" ? "text-emerald-600" : "text-red-600"

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="rounded-lg border bg-background p-3">
            <Icon className="h-5 w-5" />
          </div>
          <span className={`inline-flex items-center gap-1 text-sm font-medium ${trendClass}`}>
            <TrendIcon className="h-4 w-4" />
            {trendValue}
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function PriorityBadge({ categoria }) {
  if (categoria === "30") {
    return <Badge className="bg-yellow-500 hover:bg-yellow-500">Alta</Badge>
  }

  if (categoria === "60") {
    return <Badge className="bg-orange-500 hover:bg-orange-500">Media</Badge>
  }

  return <Badge variant="destructive">Baja</Badge>
}