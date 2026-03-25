"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/nav/sidebar";

const STORAGE_KEY = "sidebar-collapsed";
const EXPANDED_W = 240;
const COLLAPSED_W = 64;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "true") setSidebarCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const setCollapsed = useCallback((next: boolean) => {
    setSidebarCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      /* ignore */
    }
  }, []);

  const hideNav =
    pathname?.startsWith("/live") ||
    pathname?.startsWith("/auth/") ||
    pathname?.startsWith("/api/auth") ||
    pathname === "/";

  if (hideNav) {
    return <>{children}</>;
  }

  const showDesktopSidebar = status === "authenticated";

  return (
    <div className="min-h-[100dvh]">
      {showDesktopSidebar ? (
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setCollapsed}
          collapsedWidth={COLLAPSED_W}
          expandedWidth={EXPANDED_W}
        />
      ) : null}

      <main
        className={cn(
          "min-h-[100dvh] transition-[margin] duration-200 ease-in-out",
          showDesktopSidebar &&
            (sidebarCollapsed ? "md:ml-16" : "md:ml-60"),
        )}
      >
        {children}
      </main>

      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  );
}
