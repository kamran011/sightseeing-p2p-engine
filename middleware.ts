import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { Role } from "@/lib/types";

const roleFromPath = (pathname: string): Role | null => {
  if (pathname.startsWith("/poster")) return "POSTER";
  if (pathname.startsWith("/eye")) return "EYE";
  return null;
};

const roleFromLive = (req: NextRequest): Role | null => {
  if (!req.nextUrl.pathname.startsWith("/live/")) return null;
  const roleQ = req.nextUrl.searchParams.get("role");
  if (!roleQ) return null;
  if (roleQ === "poster") return "POSTER";
  if (roleQ === "eye") return "EYE";
  return null;
};

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const isApiAuthRoute = pathname.startsWith("/api/auth");
  if (isApiAuthRoute) return NextResponse.next();

  const requiredRole = roleFromPath(pathname) ?? roleFromLive(req);
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (requiredRole) {
    const userRole = (token.role as Role) ?? null;
    if (userRole !== requiredRole) {
      // Send the user directly to their own dashboard, not back to /
      // (avoids an extra redirect hop via getServerSession on the root page).
      const dest =
        userRole === "POSTER" ? "/poster" : userRole === "EYE" ? "/eye" : "/";
      return NextResponse.redirect(new URL(dest, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/poster/:path*", "/eye/:path*", "/live/:path*"],
};

