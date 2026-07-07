export type PlaceCategory = "CAFE" | "RESTAURANT" | "MALL" | "HOTEL" | "PUBLIC" | "OTHER";

export type CategoryFilter = "ALL" | "CAFE" | "RESTAURANT" | "MALL";

export type AcStatus = "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN" | "UNVERIFIED";

export type ReportChoice = "AVAILABLE" | "UNKNOWN" | "UNAVAILABLE";

export type ViewMode = "map" | "list";

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
};
