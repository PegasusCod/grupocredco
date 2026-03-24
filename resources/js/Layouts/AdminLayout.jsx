import { AppSidebar } from "@/Components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/Components/ui/sidebar"
import { Separator } from "@/Components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/Components/ui/breadcrumb"

import { usePage } from "@inertiajs/react"

export default function AdminLayout({ children, title }) {
    // 1. El hook DEBE ir dentro de la función
    const { url } = usePage();

    // 2. Lógica interna para determinar el nombre de la página
    const getPageName = () => {
        // Si pasaste un 'title' por props, usamos ese primero
        if (title) return title;

        // Si no, lo deducimos por la URL (útil para el control de EPP)
        if (url.startsWith('/dashboard')) return 'Dashboard';
        if (url.startsWith('/epp')) return 'Inventario de EPP';
        if (url.startsWith('/trabajadores')) return 'Personal / Trabajadores';
        
        return 'Sistema Credco'; 
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage className="font-semibold text-slate-900">
                                    {getPageName()}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <main className="flex flex-1 flex-col gap-4 p-4">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}