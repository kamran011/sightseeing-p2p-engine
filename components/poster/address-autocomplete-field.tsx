"use client";

import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Input } from "@/components/ui/input";

export type PlaceSelection = {
  address: string;
  latitude: number;
  longitude: number;
};

export function AddressAutocompleteField({
  value,
  onValueChange,
  onPlaceSelected,
  placeholder,
  disabled,
  id,
}: {
  id?: string;
  value: string;
  onValueChange: (v: string) => void;
  onPlaceSelected: (p: PlaceSelection) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const placesLib = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);
  const onPlaceSelectedRef = useRef(onPlaceSelected);

  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;
    if (autocompleteRef.current) return;

    const autocomplete = new (placesLib as any).Autocomplete(inputRef.current, {
      fields: ["geometry", "formatted_address", "name"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace?.();
      const location = place?.geometry?.location;
      if (!location) return;

      const lat =
        typeof location.lat === "function" ? location.lat() : location.lat;
      const lng =
        typeof location.lng === "function" ? location.lng() : location.lng;
      if (typeof lat !== "number" || typeof lng !== "number") return;

      const address =
        (place.formatted_address as string | undefined) ??
        (place.name as string | undefined) ??
        inputRef.current?.value ??
        "";

      onPlaceSelectedRef.current({
        address,
        latitude: lat,
        longitude: lng,
      });
    });

    autocompleteRef.current = autocomplete;
  }, [placesLib, onPlaceSelected]);

  return (
    <Input
      id={id}
      disabled={disabled}
      ref={inputRef}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      inputMode="text"
    />
  );
}

