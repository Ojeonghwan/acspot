export type PlaceCategory = "CAFE" | "RESTAURANT" | "MALL" | "HOTEL" | "PUBLIC" | "OTHER";

export type CategoryFilter = "ALL" | "CAFE" | "RESTAURANT" | "MALL";

export type AcStatus = "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN" | "UNVERIFIED";

export type ReportChoice = "AVAILABLE" | "UNKNOWN" | "UNAVAILABLE";

export type CoolingLevel = "STRONG" | "NORMAL" | "WEAK" | "UNKNOWN";

export type ViewMode = "map" | "list";

export type MapCamera = {
  latitude: number;
  longitude: number;
  zoom: number;
};

export type Place = {
  placeId: number;
  name: string;
  category: PlaceCategory;
  address: string;
  distanceText: string;
  latitude: number;
  longitude: number;
  acStatus: AcStatus;
  trustScore: number;
  totalReportCount: number;
  lastReportedAt: string | null;
  mapX: number;
  mapY: number;
  isRegistered: boolean;
  googlePlaceId?: string | null;
  googleMapsUrl?: string | null;
  osmId?: string | null;
  countryCode?: string | null;
  city?: string | null;
  sourceLabel?: string | null;
  openingHours?: string | null;
  phone?: string | null;
  website?: string | null;
};
