"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Role } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function RoleGuard({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/auth/login");
      return;
    }

    const sessionRole = (session?.user as any)?.role as Role | undefined;
    if (sessionRole && sessionRole !== role) {
      // Authenticated but wrong dashboard — send them to their own home.
      router.replace(sessionRole === "POSTER" ? "/poster" : "/eye");
    }
  }, [role, session, status, router]);

  if (status === "loading") return <LoadingSpinner />;

  const sessionRole = (session?.user as any)?.role as Role | undefined;
  if (!sessionRole || sessionRole !== role) return null;

  return <>{children}</>;
}

