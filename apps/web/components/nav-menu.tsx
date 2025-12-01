// app/components/navigation-menu.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from "lucide-react";

import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {AuthButtonClient} from "@/components/auth-button-client";

const components = [
    {
        title: "Alert Dialog",
        href: "/docs/primitives/alert-dialog",
        description:
            "A modal dialog that interrupts the user with important content and expects a response.",
    },
    {
        title: "Hover Card",
        href: "/docs/primitives/hover-card",
        description:
            "For sighted users to preview content available behind a link.",
    },
    {
        title: "Progress",
        href: "/docs/primitives/progress",
        description:
            "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
    },
    {
        title: "Scroll-area",
        href: "/docs/primitives/scroll-area",
        description: "Visually or semantically separates content.",
    },
    {
        title: "Tabs",
        href: "/docs/primitives/tabs",
        description:
            "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
    },
    {
        title: "Tooltip",
        href: "/docs/primitives/tooltip",
        description:
            "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
    },
];

export const NavigationMenuDemo = () => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <nav className="w-full px-4 py-2 border-b border-gray-200 lg:px-8">
            <div className="flex items-center justify-between">
                <Link href="/apps/web/public" className="text-xl font-bold">
                    Awesome
                </Link>

                <div className="lg:hidden">
                    <button onClick={() => setIsMobileOpen(!isMobileOpen)}>
                        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                <div className="hidden lg:flex items-center gap-6">
                    <DesktopMenu />
                    <AuthButtonClient />
                </div>
            </div>

            {isMobileOpen && (
                <div className="lg:hidden mt-4">
                    <MobileMenu />
                    <div className="mt-4">
                        <AuthButtonClient />
                    </div>
                </div>
            )}
        </nav>
    );
};

const DesktopMenu = () => (
    <NavigationMenu viewport={false}>
        <NavigationMenuList className="flex gap-4">
            <NavigationMenuItem>
                <NavigationMenuTrigger>Components</NavigationMenuTrigger>
                <NavigationMenuContent>
                    <ul className="grid w-[300px] gap-2 md:w-[500px] md:grid-cols-2">
                        {components.map((component) => (
                            <ListItem
                                key={component.title}
                                title={component.title}
                                href={component.href}
                            >
                                {component.description}
                            </ListItem>
                        ))}
                    </ul>
                </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link href="/docs">Docs</Link>
                </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <NavigationMenuTrigger>With Icon</NavigationMenuTrigger>
                <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-4">
                        <li>
                            <NavigationMenuLink asChild>
                                <Link href="#" className="flex items-center gap-2">
                                    <CircleHelpIcon /> Backlog
                                </Link>
                            </NavigationMenuLink>
                            <NavigationMenuLink asChild>
                                <Link href="#" className="flex items-center gap-2">
                                    <CircleIcon /> To Do
                                </Link>
                            </NavigationMenuLink>
                            <NavigationMenuLink asChild>
                                <Link href="#" className="flex items-center gap-2">
                                    <CircleCheckIcon /> Done
                                </Link>
                            </NavigationMenuLink>
                        </li>
                    </ul>
                </NavigationMenuContent>
            </NavigationMenuItem>
        </NavigationMenuList>
    </NavigationMenu>
);

const MobileMenu = () => (
    <ul className="space-y-4">
        <li>
            <Link href="/docs" className="block font-medium">
                Docs
            </Link>
        </li>
        {components.map((c) => (
            <li key={c.href}>
                <Link href={c.href} className="block text-sm">
                    {c.title}
                </Link>
            </li>
        ))}
    </ul>
);

function ListItem({
                      title,
                      children,
                      href,
                      ...props
                  }: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
    return (
        <li {...props}>
            <NavigationMenuLink asChild>
                <Link href={href} className="block p-2 rounded hover:bg-accent">
                    <div className="text-sm font-medium leading-none">{title}</div>
                    <p className="text-muted-foreground text-sm leading-snug">
                        {children}
                    </p>
                </Link>
            </NavigationMenuLink>
        </li>
    );
}