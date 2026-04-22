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
import { NavProjects } from "./nav-projects"
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
      title: "Entrega de EPP",
      url: "#",
      isActive: true,
      icon: Bot,
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: Frame,
        },
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
        {
          title: "Custodia EPP",
          url: route('custodia.index'), // Aquí se puede usar route('custodia.index') si tienes esa ruta nombrada
          icon: Map,
          active: route().current('custodia.index') // Marca como activo si la ruta actual es 'custodia.index'
        },
        {
          title: "Transferencias",
          url: route('transferencias.index'), // Aquí se puede usar route('transferencias.index') si tienes esa ruta nombrada
          icon: Settings2,
          active: route().current('transferencias.index') // Marca como activo si la ruta actual es 'transferencias.index'
        },
        {
          title: "Kardex de EPP",
          url: route('kardex.index'), // Aquí se puede usar route('kardex.index') si tienes esa ruta nombrada
          icon: SquareTerminal,
          active: route().current('kardex.index') // Marca como activo si la ruta actual es 'kardex.index'
        },
        {
          title: "Segregación de EPP",
          url: route('segregacion.index'), // Aquí se puede usar route('segregacion.index') si tienes esa ruta nombrada
          icon: Bot,
          active: route().current('segregacion.index') // Marca como activo si la ruta actual es 'segregacion.index'
        },
        {
          title: "Configuraciones",
          url: route('configuracion.index'), // Aquí se puede usar route('configuracion.index') si tienes esa ruta nombrada
          icon: Settings2,
          active: route().current('configuracion.index') // Marca como activo si la ruta actual es 'configuracion.index'
        }
      ],
    },
    {
      title: "Entrega de herrramientas",
      icon: PieChart,
      items:[
        {
          title: "Dashboard",
          url:"#",
        },
        {
          title: "Inventario",
          url: "#"
        },
        { title:"Prestamos",
          url:"#",
        },
        { title:"Devoluciones",
          url:"#",
        },
        { title:"Resportes de herramientas",
          url:"#",
        }
      ],
    },
  ],

  projects: [
    {
      name:"Entrega de EPP",
      url: route('entregas.index'), // Aquí se puede usar route('entregas.index') si tienes esa ruta nombrada
      icon: Frame,
    },
    {
      name:"Salida de Herramientas",
      url:"#",
      icon: PieChart,
    },
    {
      name:"Registrar Devoluciones",
      url:"#",
      icon: Map,
    },
/*     {
      name:"",
      url:"#",
      icon: Bot,
    },
    {
      name:"",
      url:"#",
      icon: AudioWaveform,
    },
    {
      name:"",
      url:"#",
      icon: SquareTerminal,
    }, */
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
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarGroup className="mt-auto">

      </SidebarGroup>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
