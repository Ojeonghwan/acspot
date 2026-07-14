export const PARIS_CENTER = { latitude: 48.8566, longitude: 2.3522 };

export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${distanceMeters}m`;
  }
  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

export function formatRelativeTime(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const reportedAt = parseServerTimestamp(value);
  if (Number.isNaN(reportedAt.getTime())) {
    return value;
  }

  const diffMs = Date.now() - reportedAt.getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  if (minutes < 60) {
    return `${minutes}min ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 48) {
    return `${hours}h ago`;
  }
  return `${Math.round(hours / 24)}d ago`;
}

function parseServerTimestamp(value: string): Date {
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  if (hasTimezone) {
    return new Date(value);
  }

  return new Date(`${value}Z`);
}

export function calculateDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusMeters * c);
}

export function longitudeToX(longitude: number): number {
  return clamp(50 + (longitude - PARIS_CENTER.longitude) * 2200, 12, 88);
}

export function latitudeToY(latitude: number): number {
  return clamp(50 - (latitude - PARIS_CENTER.latitude) * 3000, 14, 82);
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
