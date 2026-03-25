"use client";

/**
 * Mobile-only bottom navigation (see `AppShell`: hidden from `md` and up).
 * Desktop uses `components/nav/sidebar.tsx`.
 */

import { LogOut, MapPin, Video, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/poster", label: "Poster", icon: Wallet },
  { href: "/eye", label: "Eye", icon: MapPin },
  { href: "/", label: "Home", icon: Video },
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (pathname?.startsWith("/live")) return null;
  // Hide nav on auth screens (NextAuth sign-in + our register/login pages).
  if (pathname?.startsWith("/api/auth")) return null;
  if (pathname?.startsWith("/auth/")) return null;

  if (status === "loading") return null;

  const role = (session?.user as any)?.role as Role | undefined;
  const isAuthed = status === "authenticated";
  const visibleLinks =
    role === "POSTER"
      ? links.filter((l) => l.href === "/" || l.href === "/poster")
      : role === "EYE"
        ? links.filter((l) => l.href === "/" || l.href === "/eye")
        : // If role isn't resolved yet (or user is unauthenticated), don't show the role-specific tab.
          links.filter((l) => l.href === "/");

  const normalizedPath = (pathname ?? "").replace(/\/+$/, "") || "/";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      {isAuthed ? (
        <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2 py-2">
          <ul className="flex flex-1 items-stretch justify-around gap-1">
            {visibleLinks.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/" ? normalizedPath === "/" : normalizedPath === href;
              return (
                <li className="flex-1" key={href}>
                  <Link
                    className={cn(
                      "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-medium transition-colors no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                      active
                        ? "text-indigo-600"
                        : "text-slate-500 hover:text-slate-800",
                    )}
                    href={href}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2 pl-1">
            <Badge className="max-w-[5.5rem] truncate text-[10px] sm:text-xs" variant="secondary">
              {role === "POSTER"
                ? "Poster"
                : role === "EYE"
                  ? "Eye"
                  : "Signed in"}
            </Badge>
            <Button
              aria-label="Logout"
              className="min-h-11"
              onClick={() => void signOut({ callbackUrl: "/" })}
              size="icon"
              variant="outline"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-lg items-center gap-2 px-3 py-2">
          <Button asChild className="flex-1" variant="outline">
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href="/auth/register">Register</Link>
          </Button>
        </div>
      )}
    </nav>
  );
}
