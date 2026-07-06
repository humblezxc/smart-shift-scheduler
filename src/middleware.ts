import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};

export async function middleware(req: NextRequest) {
    if (req.nextUrl.pathname.startsWith("/s/")) {
        return NextResponse.next();
    }

    if (req.nextUrl.pathname.startsWith("/login") ||
        req.nextUrl.pathname.startsWith("/signup") ||
        req.nextUrl.pathname.startsWith("/auth") ||
        req.nextUrl.pathname.startsWith("/invite") ||
        req.nextUrl.pathname.startsWith("/onboarding") ||
        req.nextUrl.pathname.startsWith("/setup-org") ||
        req.nextUrl.pathname.startsWith("/forgot-password") ||
        req.nextUrl.pathname.startsWith("/reset-password") ||
        req.nextUrl.pathname.startsWith("/welcome")) {
        return NextResponse.next();
    }

    if (process.env.ENABLE_AUTH !== "true") {
        return NextResponse.next();
    }

    let response = NextResponse.next({
        request: {
            headers: req.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        req.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request: req,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        return response;
    }

    const basicAuth = req.headers.get("authorization");

    if (basicAuth && basicAuth.startsWith("Basic ")) {
        try {
            const [authUser, pwd] = atob(basicAuth.slice(6)).split(":");

            const validUser = process.env.ADMIN_USER;
            const validPass = process.env.ADMIN_PASSWORD;

            if (authUser === validUser && pwd === validPass) {
                return NextResponse.next();
            }
        } catch {
        }
    }

    const welcomeUrl = new URL("/welcome", req.url);
    return NextResponse.redirect(welcomeUrl);
}
