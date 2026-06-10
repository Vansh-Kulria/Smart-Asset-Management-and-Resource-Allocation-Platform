import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

const authMiddleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Check if user is authenticated
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Onboarding Redirect: If a user has no section/club selected (e.g. first-time OAuth sign-in)
    // force them to complete their profile registration before accessing other screens
    if (!token.section) {
      if (token.role === "ADMIN" && path !== "/admin/profile") {
        return NextResponse.redirect(new URL("/admin/profile?setup=true", req.url));
      }
      if (token.role === "CONSUMER" && path !== "/dashboard/profile") {
        return NextResponse.redirect(new URL("/dashboard/profile?setup=true", req.url));
      }
    }

    // Redirect consumers trying to access admin panel back to consumer dashboard
    if (path.startsWith("/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Named proxy export for Next.js 16 compatibility
export function proxy(req: NextRequest, event: any) {
  return (authMiddleware as any)(req, event);
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
