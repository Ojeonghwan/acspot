import { calculateDistanceMeters, formatDistance, latitudeToY, longitudeToX, PARIS_CENTER } from "./geo";
import type { Place, PlaceCategory } from "./types";

type NominatimPlace = {
  osm_type: string;
  osm_id: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  type?: string;
  category?: string;
  address?: {
    amenity?: string;
    shop?: string;
    tourism?: string;
    building?: string;
    road?: string;
    suburb?: string;
    city?: string;
  };
};

const PARIS_VIEWBOX = "2.2241,48.9022,2.4699,48.8156";

export async function searchOpenStreetMapPlaces(keyword: string): Promise<Place[]> {
  const normalized = keyword.trim();
  if (!normalized) {
    return [];
  }

  const params = new URLSearchParams({
    q: `${normalized}, Paris, France`,
    format: "jsonv2",
    addressdetails: "1",
    limit: "6",
    bounded: "1",
    viewbox: PARIS_VIEWBOX
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    return [];
  }

  const results = (await response.json()) as NominatimPlace[];
  return results.map(toPlace).filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
}

function toPlace(item: NominatimPlace): Place {
  const latitude = Number(item.lat);
  const longitude = Number(item.lon);
  const distanceMeters = calculateDistanceMeters(PARIS_CENTER.latitude, PARIS_CENTER.longitude, latitude, longitude);
  const name = item.name ?? item.address?.amenity ?? item.address?.shop ?? item.display_name.split(",")[0] ?? "Unnamed place";

  return {
    placeId: -Number(item.osm_id),
    name,
    category: toCategory(item),
    address: item.display_name,
    distanceText: formatDistance(distanceMeters),
    latitude,
    longitude,
    acStatus: "UNVERIFIED",
    trustScore: 0,
    totalReportCount: 0,
    lastReportedAt: null,
    mapX: longitudeToX(longitude),
    mapY: latitudeToY(latitude),
    isRegistered: false,
    osmId: `${item.osm_type}:${item.osm_id}`
  };
}

function toCategory(item: NominatimPlace): PlaceCategory {
  const text = `${item.category ?? ""} ${item.type ?? ""} ${item.address?.amenity ?? ""} ${item.address?.shop ?? ""}`.toLowerCase();
  if (text.includes("cafe")) {
    return "CAFE";
  }
  if (text.includes("restaurant") || text.includes("fast_food") || text.includes("food")) {
    return "RESTAURANT";
  }
  if (text.includes("mall") || text.includes("department_store") || text.includes("shopping")) {
    return "MALL";
  }
  if (text.includes("hotel")) {
    return "HOTEL";
  }
  if (text.includes("library") || text.includes("public") || text.includes("townhall")) {
    return "PUBLIC";
  }
  return "OTHER";
}