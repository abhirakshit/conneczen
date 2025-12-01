"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/authContext";
// import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import {AppSidebar} from "@/components/app-sidebar";
import {SidebarInset, SidebarProvider, SidebarTrigger} from "@/components/ui/sidebar";
import {Separator} from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import {ModeToggle} from "@/components/mode-toggle";

/**
 * Layout for all authenticated routes
 * Redirects user to /onboarding or /dashboard
 * depending on onboarding completion.
 */
export default function ProtectedLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    // const status = useOnboardingCheck(user?.id);

    // useEffect(() => {
    //     if (!user?.id || status === "pending") return;
    //
    //     if (status === "incomplete" && !pathname.startsWith("/onboarding")) {
    //         router.replace("/onboarding");
    //     }
    //
    //     if (status === "complete" && pathname.startsWith("/onboarding")) {
    //         router.replace("/dashboard");
    //     }
    // }, [status, user?.id, pathname]);
    //
    // if (status === "pending") {
    //     return (
    //         <div className="flex min-h-screen items-center justify-center text-gray-500">
    //             Loading...
    //         </div>
    //     );
    // }

    return <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
            <header
                className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1"/>
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/dashboard">
                                    Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block"/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <ModeToggle/>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                {children}
            </div>
        </SidebarInset>
    </SidebarProvider>
}