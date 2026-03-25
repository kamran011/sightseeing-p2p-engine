"use client";

import type { ComponentType } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  Gavel,
  List,
  LogOut,
  Map,
  MapPin,
  Plus,
  Settings,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const posterItems: NavItem[] = [
  { href: "/poster", label: "Dashboard", icon: Map },
  { href: "/poster", label: "My requests", icon: List },
  { href: "/poster", label: "Payments", icon: Wallet },
  { href: "/poster?postJob=1", label: "Post job", icon: Plus },
];

const eyeItems: NavItem[] = [
  { href: "/eye", label: "Nearby gigs", icon: MapPin },
  { href: "/eye", label: "Active bids", icon: Gavel },
  { href: "/eye", label: "Earnings", icon: Coins },
];

function isActive(pathname: string, href: string) {
  const base = href.split("?")[0] ?? href;
  const normalized = (pathname ?? "").replace(/\/+$/, "") || "/";
  if (base === "/") return normalized === "/";
  return normalized === base || normalized.startsWith(`${base}/`);
}

export function Sidebar({
  collapsed,
  onCollapsedChange,
  collapsedWidth,
  expandedWidth,
}: {
  collapsed: boolean;
  onCollapsedChange: (next: boolean) => void;
  collapsedWidth: number;
  expandedWidth: number;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: Role })?.role;

  const items = role === "POSTER" ? posterItems : role === "EYE" ? eyeItems : [];

  const width = collapsed ? collapsedWidth : expandedWidth;

  const rowCollapsed = collapsed
    ? "justify-center gap-0 px-0"
    : "justify-start gap-3 px-3";

  return (
    <motion.aside
      animate={{ width }}
      className="fixed left-0 top-0 z-40 hidden h-full flex-col border-r border-slate-200 bg-white shadow-sm md:flex"
      initial={false}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-slate-100",
          collapsed ? "justify-center px-0" : "px-3",
        )}
      >
        <Map className="h-7 w-7 shrink-0 text-indigo-600" />
        {!collapsed ? (
          <motion.span
            animate={{ opacity: 1 }}
            className="ml-2 truncate text-sm font-semibold text-slate-900"
            initial={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            Sightseeing
          </motion.span>
        ) : null}
      </div>

      <nav
        className={cn(
          "flex flex-1 flex-col gap-1 overflow-y-auto p-2",
          collapsed && "items-stretch",
        )}
      >
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname ?? "", href);
          return (
            <Link
              className={cn(
                "flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors no-underline",
                rowCollapsed,
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
              href={href}
              key={`${href}-${label}`}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed ? (
                <span className="truncate">{label}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-100 p-2">
        <div className="flex flex-col gap-1">
          <Link
            className={cn(
              "flex items-center rounded-lg py-2 text-sm font-medium text-slate-600 no-underline transition-colors hover:bg-slate-100 hover:text-slate-900",
              rowCollapsed,
            )}
            href={role === "POSTER" ? "/poster" : "/eye"}
            title={collapsed ? "Profile" : undefined}
          >
            <User className="h-5 w-5 shrink-0" />
            {!collapsed ? <span className="truncate">Profile</span> : null}
          </Link>
          <Link
            className={cn(
              "flex items-center rounded-lg py-2 text-sm font-medium text-slate-600 no-underline transition-colors hover:bg-slate-100 hover:text-slate-900",
              rowCollapsed,
            )}
            href={role === "POSTER" ? "/poster" : "/eye"}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="h-5 w-5 shrink-0" />
            {!collapsed ? <span className="truncate">Settings</span> : null}
          </Link>

          {!collapsed ? (
            <Badge className="w-full justify-center py-1.5" variant="secondary">
              {role === "POSTER"
                ? "Poster mode"
                : role === "EYE"
                  ? "Eye mode"
                  : "Signed in"}
            </Badge>
          ) : null}

          <Button
            className={cn(
              "w-full gap-3",
              collapsed ? "justify-center px-0" : "justify-start",
            )}
            onClick={() => void signOut({ callbackUrl: "/" })}
            size="sm"
            variant="outline"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed ? "Log out" : null}
          </Button>

          <Button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "w-full shrink-0",
              collapsed
                ? "flex h-10 items-center justify-center px-0"
                : "justify-start gap-2",
            )}
            onClick={() => onCollapsedChange(!collapsed)}
            size="sm"
            variant="ghost"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5 text-indigo-600" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.aside>
  );
}
