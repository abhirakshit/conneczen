"use client";

import { ModeToggle } from "@/components/mode-toggle";

/**
 * Minimal layout for onboarding - no sidebar, just top navbar and content.
 * Keeps the user focused on the voice conversation.
 */
export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-14 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">Conneczen</span>
                        <span className="text-muted-foreground text-sm">/ Getting Started</span>
                    </div>
                    <ModeToggle />
                </div>
            </header>
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}