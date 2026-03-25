import { Suspense } from "react";
import { PosterDashboard } from "@/components/poster/poster-dashboard";
import { GoogleMapsProvider } from "@/components/providers/google-maps-provider";
import { RoleGuard } from "@/components/auth/role-guard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function PosterPage() {
  return (
    <GoogleMapsProvider>
      <RoleGuard role="POSTER">
        <Suspense fallback={<LoadingSpinner />}>
          <PosterDashboard />
        </Suspense>
      </RoleGuard>
    </GoogleMapsProvider>
  );
}
