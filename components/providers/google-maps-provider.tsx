"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import type { ReactNode } from "react";

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Without an API key we can still render the UI, but Places Autocomplete won't work.
  if (!apiKey) return <>{children}</>;

  return (
    <APIProvider apiKey={apiKey} libraries={["places"]}>
      {children}
    </APIProvider>
  );
}

