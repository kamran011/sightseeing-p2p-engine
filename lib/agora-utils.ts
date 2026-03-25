/** Deterministic numeric uid for Agora token generation from a string user id. */
export function stringToUid(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  // Agora requires IDs in the range [0, 65535].
  // Some Agora wrappers may internally offset values when creating data
  // channels. To avoid any risk of overflow at the upper bound, keep UIDs
  // in [1, 65533] so even a +2 offset stays <= 65535.
  return (Math.abs(h) % 65533) + 1;
}

export function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
