"use client";

import { useEffect, useState } from "react";

type GeoStatus = "loading" | "ok" | "denied" | "unavailable" | "error";

export function useBrowserGeolocation(options?: {
  fallbackLat?: number;
  fallbackLng?: number;
}) {
  const fallbackLat = options?.fallbackLat ?? 31.52;
  const fallbackLng = options?.fallbackLng ?? 74.35;

  const [state, setState] = useState<{
    lat: number;
    lng: number;
    status: GeoStatus;
    error?: string;
  }>({
    lat: fallbackLat,
    lng: fallbackLng,
    status: "loading",
  });

  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState({ lat: fallbackLat, lng: fallbackLng, status: "unavailable" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          status: "ok",
        });
      },
      (err) => {
        const status: GeoStatus =
          err.code === err.PERMISSION_DENIED ? "denied" : "error";
        setState({
          lat: fallbackLat,
          lng: fallbackLng,
          status,
          error: err.message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60_000,
      },
    );
  }, [fallbackLat, fallbackLng]);

  return state;
}

