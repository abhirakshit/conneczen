"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { DashboardNav } from "./dashboard-nav";
import { DashboardHeader } from "./dashboard-header";
import type { UserProfileData } from "@/lib/queries/users";

interface DashboardShellProps {
  children: React.ReactNode;
  user: User;
  profile: UserProfileData | null;
}

export function DashboardShell({ children, user, profile }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-amber-200 bg-amber-50/95 backdrop-blur supports-[backdrop-filter]:bg-amber-50/60 px-4 lg:hidden">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden text-amber-900 hover:bg-amber-100">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-white border-amber-200">
            <div className="flex h-14 items-center border-b border-amber-200 px-4">
              <span className="font-semibold text-lg text-amber-900">conneczen</span>
            </div>
            <DashboardNav onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="font-semibold text-amber-900">conneczen</span>
        <div className="ml-auto">
          <DashboardHeader user={user} compact />
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-amber-200 bg-white">
          <div className="flex h-14 items-center border-b border-amber-200 px-6">
            <span className="font-semibold text-lg text-amber-900">conneczen</span>
          </div>
          <DashboardNav />
          <div className="mt-auto border-t border-amber-200 p-4">
            <DashboardHeader user={user} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:pl-64">
          <div className="container max-w-4xl py-6 px-4 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
