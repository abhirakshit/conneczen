import {createServerClient} from "@supabase/ssr";
import {NextResponse, type NextRequest} from "next/server";
import {getUserRole} from "@/lib/get-user-role";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    // With Fluid compute, don't put this client in a global environment
    // variable. Always create a new one on each request.
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({name, value}) =>
                        request.cookies.set(name, value),
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({name, value, options}) =>
                        supabaseResponse.cookies.set(name, value, options),
                    );
                },
            },
        },
    );

    // Do not run code between createServerClient and
    // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: If you remove getClaims() and you use server-side rendering
    // with the Supabase client, your users may be randomly logged out.
    const {data} = await supabase.auth.getClaims();
    // console.log('data', data);
    const user = data?.claims;
    console.log("user", user?.email);

    // console.log("USER", user, request.nextUrl.pathname);
    // const role = user ? await getUserRole() : null;
    const path = request.nextUrl.pathname;

    console.log("RESP MIDDLE", path);

    const isPublicRoute =
        path === "/" ||
        path.startsWith("/blog") ||
        path.startsWith("/about");

    const isAuthOnlyRoute =
        path.startsWith("/dashboard") ||
        path.startsWith("/knowledge-base");

    const isSignInRoute = path.startsWith("/auth");

    const isAdminRoute = path.startsWith("/admin");

    // 🔓 Public routes: accessible to all
    if (isPublicRoute) return supabaseResponse;

    // 🚫 Prevent logged-in users from accessing sign-in again
    if (isSignInRoute) {
        if (user) {
            const url = request.nextUrl.clone();
            url.pathname = "/";
            return NextResponse.redirect(url);
        }
        return supabaseResponse;
    }

    // 🔐 Authenticated-only routes
    if (isAuthOnlyRoute) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = "/auth/login";
            url.searchParams.set("next", path);
            return NextResponse.redirect(url);
        }
        return supabaseResponse;
    }

    // 🛡️ Admin routes
    if (isAdminRoute) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = "/auth/login";
            url.searchParams.set("next", path);
            return NextResponse.redirect(url);
        }

        const role = await getUserRole();
        if (role !== "admin") {
            const url = request.nextUrl.clone();
            url.pathname = "/";
            return NextResponse.redirect(url);
        }
        return supabaseResponse;
    }

    // ❓ Catch-all fallback — deny by default for unknown private paths
    if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        url.searchParams.set("next", path);
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
