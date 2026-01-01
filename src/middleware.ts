import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    if (
        req.nextUrl.pathname.startsWith("/_next") ||
        req.nextUrl.pathname.startsWith("/api") ||
        req.nextUrl.pathname.startsWith("/static") ||
        req.nextUrl.pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    if (req.nextUrl.pathname.startsWith("/s/")) {
        return NextResponse.next();
    }

    const basicAuth = req.headers.get("authorization");

    if (basicAuth) {
        const authValue = basicAuth.split(" ")[1];
        const [user, pwd] = atob(authValue).split(":");

        const validUser = process.env.ADMIN_USER;
        const validPass = process.env.ADMIN_PASSWORD;

        if (user === validUser && pwd === validPass) {
            return NextResponse.next();
        }
    }

    return new NextResponse("Authentication required", {
        status: 401,
        headers: {
            "WWW-Authenticate": 'Basic realm="Secure Admin Area"',
        },
    });
}

export const config = {
    matcher: ["/:path*"],
};