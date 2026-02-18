import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes require ADMIN role
    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    // Customer routes require active subscription
    if (
      (path.startsWith("/dashboard") ||
        path.startsWith("/my-bets") ||
        path.startsWith("/my-stats")) &&
      token?.role === "CUSTOMER" &&
      token?.subscriptionStatus !== "ACTIVE"
    ) {
      return NextResponse.redirect(new URL("/subscribe", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (
          path === "/" ||
          path === "/login" ||
          path === "/signup" ||
          path === "/admin/login" ||
          path.startsWith("/api/auth") ||
          path.startsWith("/api/stripe/webhook")
        ) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/my-bets/:path*",
    "/my-stats/:path*",
    "/admin/:path*",
    "/subscribe",
  ],
};
