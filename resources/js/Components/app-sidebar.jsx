import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

// agregamos el calendario
import { Calendar } from "@/Components/ui/calendar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Panel",
      url: "#",
      isActive: true,
      icon: Frame,
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: Frame,
        },
      ],

    },
    {
      title: "Personal",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Trabajadores",
          url: route('trabajadores.index'), // Aquí se puede usar route('trabajadores.index') si tienes esa ruta nombrada
          active: route().current('trabajadores.index') // Marca como activo si la ruta actual es 'trabajadores.index'
        },
        {
          title: "Entregas de EPP",
          url: route('entregas.index'), // Aquí se puede usar route('entregas.index') si tienes esa ruta nombrada
          icon: BookOpen,
          active: route().current('entregas.index') // Marca como activo si la ruta actual es 'entregas.index'
        },
      ],
    },
    {
      title: "Inventario",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "EPP Disponibles",
          url: route('epp.index'), // Aquí se usa la función route() para generar la URL
          icon: PieChart,
          active: route().current('epp.index') // Aquí se marca como activo si la ruta actual es 'epp.index'
        },
        {
          title: "Inventario",
          url: route('inventario.index'), // Aquí se puede usar route('inventario.index') si tienes esa ruta nombrada
          icon: AudioWaveform,
          active: route().current('inventario.index') // Marca como activo si la ruta actual es 'inventario.index'
        },
      ],
    },
    {
      title: "Reportes",
      url: "#",
      icon: SquareTerminal,
      items: [
        {
          title: "Reportes de Entregas",
          url: "#",
        },
      ],
    },
  ],
}

export function AppSidebar({
  ...props
}) {
  const [date, setDate] = React.useState(new Date())
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarGroup className="mt-auto">
        {/* <SidebarGroupContent className="flex justify-center p-2">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border bg-white shadow-sm scale-90 origin-top"
          />
        </SidebarGroupContent> */}
      </SidebarGroup>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
