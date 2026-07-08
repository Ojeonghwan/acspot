import { calculateDistanceMeters, formatDistance, formatRelativeTime, latitudeToY, longitudeToX, PARIS_CENTER } from "./geo";
import type { AcStatus, CoolingLevel, Place, PlaceCategory, ReportChoice } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

type NearbyPlaceItem = {
  placeId: number;
  name: string;
  category: PlaceCategory;
  address: string;
  latitude: number;
  longitude: number;
  osmId: string | null;
  distanceMeters: number;
  acStatus: Exclude<AcStatus, "UNVERIFIED">;
  trustScore: number;
  totalReportCount: number;
  lastReportedAt: string | null;
};

type NearbyPlacesResponse = {
  places: NearbyPlaceItem[];
};

type PlaceSearchItem = {
  placeId: number;
  name: string;
  category: PlaceCategory;
  address: string;
  latitude: number;
  longitude: number;
  googlePlaceId: string | null;
  osmId: string | null;
  alreadyRegistered: boolean;
  acStatus: Exclude<AcStatus, "UNVERIFIED">;
  trustScore: number;
  totalReportCount: number;
  lastReportedAt: string | null;
};

type PlaceSearchResponse = {
  places: PlaceSearchItem[];
};

type PlaceDetailResponse = {
  placeId: number;
  name: string;
  category: PlaceCategory;
  address: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string | null;
  osmId: string | null;
  acSummary: {
    currentAcStatus: Exclude<AcStatus, "UNVERIFIED">;
    trustScore: number;
    totalReportCount: number;
    lastReportedAt: string | null;
  };
};

type CreatePlaceResponse = {
  placeId: number;
};

type AcReportResponse = {
  placeId: number;
  acStatus: Exclude<AcStatus, "UNVERIFIED">;
  trustScore: number;
  totalReportCount: number;
  lastReportedAt: string | null;
};

export async function fetchNearbyPlaces(latitude = PARIS_CENTER.latitude, longitude = PARIS_CENTER.longitude, radius = 3000): Promise<Place[]> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
    radius: String(radius)
  });
  const data = await request<NearbyPlacesResponse>(`/api/places/nearby?${params.toString()}`);
  return data.places.map((place) => toPlace(place));
}

export async function searchPlaces(keyword: string): Promise<Place[]> {
  const params = new URLSearchParams({ keyword });
  const data = await request<PlaceSearchResponse>(`/api/places/search?${params.toString()}`);
  return data.places.map((place) =>
    toPlace(
      {
        ...place,
        distanceMeters: calculateDistanceMeters(PARIS_CENTER.latitude, PARIS_CENTER.longitude, place.latitude, place.longitude),
        acStatus: place.acStatus,
        trustScore: place.trustScore,
        totalReportCount: place.totalReportCount,
        lastReportedAt: place.lastReportedAt
      },
      place.googlePlaceId,
      null,
      place.osmId
    )
  );
}

export async function fetchPlaceDetail(placeId: number, anonymousId: string): Promise<Place> {
  const params = anonymousId ? `?${new URLSearchParams({ anonymousId }).toString()}` : "";
  const detail = await request<PlaceDetailResponse>(`/api/places/${placeId}${params}`);
  return toPlace(
    {
      placeId: detail.placeId,
      name: detail.name,
      category: detail.category,
      address: detail.address,
      latitude: detail.latitude,
      longitude: detail.longitude,
      osmId: detail.osmId,
      distanceMeters: calculateDistanceMeters(PARIS_CENTER.latitude, PARIS_CENTER.longitude, detail.latitude, detail.longitude),
      acStatus: detail.acSummary.currentAcStatus,
      trustScore: detail.acSummary.trustScore,
      totalReportCount: detail.acSummary.totalReportCount,
      lastReportedAt: detail.acSummary.lastReportedAt
    },
    null,
    detail.googleMapsUrl,
    detail.osmId
  );
}

export async function registerExternalPlace(place: Place): Promise<number> {
  const response = await request<CreatePlaceResponse>("/api/places", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceType: place.osmId ? "OSM" : "MANUAL",
      googlePlaceId: place.googlePlaceId,
      osmId: place.osmId,
      name: place.name,
      category: place.category,
      countryCode: "FR",
      city: "Paris",
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      googleMapsUrl: place.googleMapsUrl
    })
  });
  return response.placeId;
}

export async function saveAcReport(placeId: number, anonymousId: string, acStatus: ReportChoice, coolingLevel: CoolingLevel = "UNKNOWN"): Promise<AcReportResponse> {
  return request<AcReportResponse>(`/api/places/${placeId}/ac-report`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ anonymousId, acStatus, coolingLevel })
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    let message = "API request failed";
    try {
      const body = (await response.json()) as { message?: string };
      message = body.message ?? message;
    } catch {
      // Keep the generic message when the response is not JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function toPlace(item: NearbyPlaceItem, googlePlaceId?: string | null, googleMapsUrl?: string | null, osmId?: string | null): Place {
  return {
    placeId: item.placeId,
    name: item.name,
    category: item.category,
    address: item.address,
    distanceText: formatDistance(item.distanceMeters),
    latitude: item.latitude,
    longitude: item.longitude,
    acStatus: item.acStatus,
    trustScore: item.trustScore,
    totalReportCount: item.totalReportCount,
    lastReportedAt: formatRelativeTime(item.lastReportedAt),
    mapX: longitudeToX(item.longitude),
    mapY: latitudeToY(item.latitude),
    isRegistered: true,
    googlePlaceId,
    googleMapsUrl,
    osmId: osmId ?? item.osmId
  };
}