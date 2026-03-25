import { EyeFeed } from "@/components/eye/eye-feed";
import { GoogleMapsProvider } from "@/components/providers/google-maps-provider";
import { RoleGuard } from "@/components/auth/role-guard";

export default function EyePage() {
  return (
    <GoogleMapsProvider>
      <RoleGuard role="EYE">
        <EyeFeed />
      </RoleGuard>
    </GoogleMapsProvider>
  );
}
