import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
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
        req.nextUrl.pathname.startsWith("/setup-org")) {
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

    if (basicAuth) {
        const authValue = basicAuth.split(" ")[1];
        const [authUser, pwd] = atob(authValue).split(":");

        const validUser = process.env.ADMIN_USER;
        const validPass = process.env.ADMIN_PASSWORD;

        if (authUser === validUser && pwd === validPass) {
            return NextResponse.next();
        }
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
}
