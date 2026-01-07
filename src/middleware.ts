import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

export function middleware(req: NextRequest) {
    if (req.nextUrl.pathname.startsWith("/s/")) {
        return NextResponse.next();
    }

    if (process.env.ENABLE_AUTH !== "true") {
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