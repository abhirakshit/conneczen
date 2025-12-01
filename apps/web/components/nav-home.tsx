import {Book, Menu, Sunset, Trees, Zap} from "lucide-react";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {Button} from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@//components/ui/sheet";
import {AuthButtonClient} from "@//components/auth-button-client";
import {ModeToggle} from "@//components/mode-toggle";
import Image from "next/image";

interface MenuItem {
    title: string;
    url: string;
    description?: string;
    icon?: React.ReactNode;
    items?: MenuItem[];
}

interface Navbar1Props {
    logo?: {
        url: string;
        src: string;
        alt: string;
        title: string;
    };
    menu?: MenuItem[];
    auth?: {
        login: {
            title: string;
            url: string;
        };
        signup: {
            title: string;
            url: string;
        };
    };
}

const Navbar = ({
                    logo = {
                        url: "https://www.shadcnblocks.com",
                        src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblockscom-icon.svg",
                        alt: "logo",
                        title: "Title",
                    },
                    menu = [
                        {title: "Home", url: "#"},
                        {
                            title: "Products",
                            url: "#",
                            items: [
                                {
                                    title: "Blog",
                                    description: "The latest industry news, updates, and info",
                                    icon: <Book className="size-5 shrink-0"/>,
                                    url: "#",
                                },
                                {
                                    title: "Company",
                                    description: "Our mission is to innovate and empower the world",
                                    icon: <Trees className="size-5 shrink-0"/>,
                                    url: "#",
                                },
                                {
                                    title: "Careers",
                                    description: "Browse job listing and discover our workspace",
                                    icon: <Sunset className="size-5 shrink-0"/>,
                                    url: "#",
                                },
                                {
                                    title: "Support",
                                    description:
                                        "Get in touch with our support team or visit our community forums",
                                    icon: <Zap className="size-5 shrink-0"/>,
                                    url: "#",
                                },
                            ],
                        },
                        {
                            title: "Resources",
                            url: "#",
                            items: [
                                {
                                    title: "Help Center",
                                    description: "Get all the answers you need right here",
                                    icon: <Zap className="size-5 shrink-0"/>,
                                    url: "#",
                                },
                                {
                                    title: "Contact Us",
                                    description: "We are here to help you with any questions you have",
                                    icon: <Sunset className="size-5 shrink-0"/>,
                                    url: "#",
                                },
                                {
                                    title: "Status",
                                    description: "Check the current status of our services and APIs",
                                    icon: <Trees className="size-5 shrink-0"/>,
                                    url: "#",
                                },
                                {
                                    title: "Terms of Service",
                                    description: "Our terms and conditions for using our services",
                                    icon: <Book className="size-5 shrink-0"/>,
                                    url: "#",
                                },
                            ],
                        },
                        {
                            title: "Pricing",
                            url: "#",
                        },
                        {
                            title: "Blog",
                            url: "#",
                        },
                    ],
                    // auth = {
                    //     login: { title: "Login", url: "/auth/login" },
                    //     signup: { title: "Sign up", url: "/auth/signup" },
                    // },
                }: Navbar1Props) => {
    return (
        <>
            <div className="flex items-center gap-2">
                <nav className="hidden lg:flex items-center justify-between">
                    {/* Left Section */}
                    <div className="flex items-center gap-6">
                        {/* Logo */}
                        <a href={logo.url} className="flex items-center gap-2">
                            <img
                                src={logo.src}
                                className="max-h-8 dark:invert"
                                alt={logo.alt}
                            />
                            <span className="text-lg font-semibold tracking-tighter">
                                {logo.title}
                            </span>
                        </a>

                        {/* Menu */}
                        <div className="flex items-center">
                            <NavigationMenu>
                                <NavigationMenuList>
                                    {menu.map((item) => renderMenuItem(item))}
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>
                    </div>
                </nav>

                {/* Mobile Menu */}
                <div className="block lg:hidden">
                    <div className="flex items-center justify-between w-full">
                        {/* Logo */}
                        <a href={logo.url} className="flex items-center gap-2">
                            <img
                                src={logo.src}
                                className="max-h-8 dark:invert"
                                alt={logo.alt}
                            />
                        </a>
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="ml-2">
                                    <Menu className="size-4"/>
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>
                                        <a href={logo.url} className="flex items-center gap-2">
                                            <img
                                                src={logo.src}
                                                className="max-h-8 dark:invert"
                                                alt={logo.alt}
                                            />
                                        </a>
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col gap-6 p-4">
                                    <Accordion
                                        type="single"
                                        collapsible
                                        className="flex w-full flex-col gap-4"
                                    >
                                        {menu.map((item) => renderMobileMenuItem(item))}
                                    </Accordion>

                                    {/*<div className="flex flex-col gap-3">*/}
                                    {/*    <AuthButtonClient/>*/}
                                    {/*</div>*/}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden sm:block">
                    <AuthButtonClient/>
                </div>
                <div>
                    <ModeToggle/>
                </div>
            </div>


            {/*      <div className=" container w-full">*/}
            {/*          /!* Desktop Menu *!/*/}
            {/*          <nav className="hidden lg:flex items-center justify-between">*/}
            {/*              /!* Left Section *!/*/}
            {/*              <div className="flex items-center gap-6">*/}
            {/*                  /!* Logo *!/*/}
            {/*                  <a href={logo.url} className="flex items-center gap-2">*/}
            {/*                      <img*/}
            {/*                          src={logo.src}*/}
            {/*                          className="max-h-8 dark:invert"*/}
            {/*                          alt={logo.alt}*/}
            {/*                      />*/}
            {/*                      <span className="text-lg font-semibold tracking-tighter">*/}
            {/*  {logo.title}*/}
            {/*</span>*/}
            {/*                  </a>*/}

            {/*                  /!* Menu *!/*/}
            {/*                  <div className="flex items-center">*/}
            {/*                      <NavigationMenu>*/}
            {/*                          <NavigationMenuList>*/}
            {/*                              {menu.map((item) => renderMenuItem(item))}*/}
            {/*                          </NavigationMenuList>*/}
            {/*                      </NavigationMenu>*/}
            {/*                  </div>*/}
            {/*              </div>*/}

            {/*              /!* Right Section (Auth Button) *!/*/}
            {/*              <div className="flex items-center gap-2">*/}
            {/*                  <AuthButtonClient/>*/}
            {/*              </div>*/}
            {/*          </nav>*/}

            {/*          /!* Mobile Menu *!/*/}
            {/*          <div className="block lg:hidden">*/}
            {/*              <div className="flex items-center justify-between">*/}
            {/*                  /!* Logo *!/*/}
            {/*                  <a href={logo.url} className="flex items-center gap-2">*/}
            {/*                      <img*/}
            {/*                          src={logo.src}*/}
            {/*                          className="max-h-8 dark:invert"*/}
            {/*                          alt={logo.alt}*/}
            {/*                      />*/}
            {/*                  </a>*/}
            {/*                  <Sheet>*/}
            {/*                      <SheetTrigger asChild>*/}
            {/*                          <Button variant="outline" size="icon" className="ml-2">*/}
            {/*                              <Menu className="size-4"/>*/}
            {/*                          </Button>*/}
            {/*                      </SheetTrigger>*/}
            {/*                      <SheetContent className="overflow-y-auto">*/}
            {/*                          <SheetHeader>*/}
            {/*                              <SheetTitle>*/}
            {/*                                  <a href={logo.url} className="flex items-center gap-2">*/}
            {/*                                      <img*/}
            {/*                                          src={logo.src}*/}
            {/*                                          className="max-h-8 dark:invert"*/}
            {/*                                          alt={logo.alt}*/}
            {/*                                      />*/}
            {/*                                  </a>*/}
            {/*                              </SheetTitle>*/}
            {/*                          </SheetHeader>*/}
            {/*                          <div className="flex flex-col gap-6 p-4">*/}
            {/*                              <Accordion*/}
            {/*                                  type="single"*/}
            {/*                                  collapsible*/}
            {/*                                  className="flex w-full flex-col gap-4"*/}
            {/*                              >*/}
            {/*                                  {menu.map((item) => renderMobileMenuItem(item))}*/}
            {/*                              </Accordion>*/}

            {/*                              <div className="flex flex-col gap-3">*/}
            {/*                                  <AuthButtonClient/>*/}
            {/*                              </div>*/}
            {/*                          </div>*/}
            {/*                      </SheetContent>*/}
            {/*                  </Sheet>*/}
            {/*              </div>*/}
            {/*          </div>*/}
            {/*      </div>*/}
        </>
    );
};

const renderMenuItem = (item: MenuItem) => {
    if (item.items) {
        return (
            <NavigationMenuItem key={item.title}>
                <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                <NavigationMenuContent className="bg-popover text-popover-foreground">
                    {item.items.map((subItem) => (
                        <NavigationMenuLink asChild key={subItem.title} className="w-80">
                            <SubMenuLink item={subItem}/>
                        </NavigationMenuLink>
                    ))}
                </NavigationMenuContent>
            </NavigationMenuItem>
        );
    }

    return (
        <NavigationMenuItem key={item.title}>
            <NavigationMenuLink
                href={item.url}
                className="bg-background hover:bg-muted hover:text-accent-foreground group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
            >
                {item.title}
            </NavigationMenuLink>
        </NavigationMenuItem>
    );
};

const renderMobileMenuItem = (item: MenuItem) => {
    if (item.items) {
        return (
            <AccordionItem key={item.title} value={item.title} className="border-b-0">
                <AccordionTrigger className="text-md py-0 font-semibold hover:no-underline">
                    {item.title}
                </AccordionTrigger>
                <AccordionContent className="mt-2">
                    {item.items.map((subItem) => (
                        <SubMenuLink key={subItem.title} item={subItem}/>
                    ))}
                </AccordionContent>
            </AccordionItem>
        );
    }

    return (
        <a key={item.title} href={item.url} className="text-md font-semibold">
            {item.title}
        </a>
    );
};

const SubMenuLink = ({item}: { item: MenuItem }) => {
    return (
        <a
            className="hover:bg-muted hover:text-accent-foreground flex min-w-80 select-none flex-row gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors"
            href={item.url}
        >
            <div className="text-foreground">{item.icon}</div>
            <div>
                <div className="text-sm font-semibold">{item.title}</div>
                {item.description && (
                    <p className="text-muted-foreground text-sm leading-snug">
                        {item.description}
                    </p>
                )}
            </div>
        </a>
    );
};

export {Navbar};
