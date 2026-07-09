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

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

export type OsmBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

const PARIS_VIEWBOX = "2.2241,48.9022,2.4699,48.8156";
export const PARIS_POI_BOUNDS: OsmBounds = { south: 48.845, west: 2.325, north: 48.872, east: 2.37 };
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

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

export async function fetchOpenStreetMapPlacesInBounds(bounds: OsmBounds, limit = 40): Promise<Place[]> {
  const params = new URLSearchParams({
    south: String(bounds.south),
    west: String(bounds.west),
    north: String(bounds.north),
    east: String(bounds.east),
    limit: String(limit)
  });

  let data: OverpassResponse;
  try {
    const response = await Promise.race<Response | null>([
      fetch(`${API_BASE_URL}/api/external/osm/places?${params.toString()}`, {
        headers: { Accept: "application/json" }
      }),
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 2500))
    ]);

    if (!response || !response.ok) {
      return fallbackOpenStreetMapPlaces(limit, bounds);
    }

    data = (await response.json()) as OverpassResponse;
  } catch {
    return fallbackOpenStreetMapPlaces(limit, bounds);
  }
  const places = (data.elements ?? [])
    .slice(0, limit)
    .map(toPlaceFromOverpass)
    .filter((place): place is Place => Boolean(place))
    .filter(uniqueByOsmId);

  return places.length ? places : fallbackOpenStreetMapPlaces(limit, bounds);

}

const FALLBACK_OSM_PLACES: Array<{
  name: string;
  category: PlaceCategory;
  address: string;
  latitude: number;
  longitude: number;
  osmId: string;
  openingHours?: string;
}> = [
  { name: "Cafe Beaubourg", category: "CAFE", address: "100 Rue Saint-Martin, 75004 Paris", latitude: 48.86002, longitude: 2.35274, osmId: "fallback:cafe-beaubourg" },
  { name: "Monoprix Saint-Michel", category: "MALL", address: "24 Boulevard Saint-Michel, 75006 Paris", latitude: 48.85252, longitude: 2.34352, osmId: "fallback:monoprix-saint-michel" },
  { name: "Le Petit Marcel", category: "RESTAURANT", address: "65 Rue Rambuteau, 75004 Paris", latitude: 48.86142, longitude: 2.35012, osmId: "fallback:le-petit-marcel" },
  { name: "Hotel Duo", category: "HOTEL", address: "11 Rue du Temple, 75004 Paris", latitude: 48.85861, longitude: 2.35428, osmId: "fallback:hotel-duo" },
  { name: "Bibliotheque Forney", category: "PUBLIC", address: "1 Rue du Figuier, 75004 Paris", latitude: 48.85485, longitude: 2.35872, osmId: "fallback:bibliotheque-forney" },
  { name: "Le Tournesol", category: "RESTAURANT", address: "9 Rue de la Gaite, 75014 Paris", latitude: 48.84094, longitude: 2.32372, osmId: "fallback:le-tournesol" },
  { name: "Lidl", category: "MALL", address: "53 Boulevard Saint-Michel, 75005 Paris", latitude: 48.84713, longitude: 2.34107, osmId: "fallback:lidl-saint-michel" },
  { name: "Mercure Paris Gare Montparnasse", category: "HOTEL", address: "20 Rue de la Gaite, 75014 Paris", latitude: 48.84059, longitude: 2.32395, osmId: "fallback:mercure-montparnasse" },
  { name: "Bibliotheque Sainte-Genevieve", category: "PUBLIC", address: "10 Place du Pantheon, 75005 Paris", latitude: 48.84691, longitude: 2.34503, osmId: "fallback:bsg" },
  { name: "Cafe de Flore", category: "CAFE", address: "172 Boulevard Saint-Germain, 75006 Paris", latitude: 48.85415, longitude: 2.33237, osmId: "fallback:cafe-de-flore" },
  { name: "Forum des Halles", category: "MALL", address: "101 Porte Berger, 75001 Paris", latitude: 48.86275, longitude: 2.34723, osmId: "fallback:forum-des-halles" },
  { name: "Cafe Procope", category: "CAFE", address: "13 Rue de l Ancienne Comedie, 75006 Paris", latitude: 48.85309, longitude: 2.33894, osmId: "fallback:cafe-procope" },
  { name: "Hotel de Ville", category: "PUBLIC", address: "Place de l Hotel de Ville, 75004 Paris", latitude: 48.85658, longitude: 2.35221, osmId: "fallback:hotel-de-ville" },
  { name: "Centre Pompidou", category: "PUBLIC", address: "Place Georges-Pompidou, 75004 Paris", latitude: 48.86064, longitude: 2.35225, osmId: "fallback:centre-pompidou" },
  { name: "Shakespeare and Company", category: "OTHER", address: "37 Rue de la Bucherie, 75005 Paris", latitude: 48.85255, longitude: 2.34710, osmId: "fallback:shakespeare-company" },
  { name: "Le Marais Bistro", category: "RESTAURANT", address: "32 Rue de Bretagne, 75003 Paris", latitude: 48.86279, longitude: 2.36206, osmId: "fallback:le-marais-bistro" },
  { name: "BHV Marais", category: "MALL", address: "52 Rue de Rivoli, 75004 Paris", latitude: 48.85754, longitude: 2.35313, osmId: "fallback:bhv-marais" }
];

function fallbackOpenStreetMapPlaces(limit: number, bounds?: OsmBounds): Place[] {
  const visiblePlaces = bounds
    ? FALLBACK_OSM_PLACES.filter((item) =>
        item.latitude >= bounds.south &&
        item.latitude <= bounds.north &&
        item.longitude >= bounds.west &&
        item.longitude <= bounds.east
      )
    : FALLBACK_OSM_PLACES;

  return visiblePlaces.slice(0, limit).map((item) => {
    const distanceMeters = calculateDistanceMeters(PARIS_CENTER.latitude, PARIS_CENTER.longitude, item.latitude, item.longitude);
    return {
      placeId: -stableExternalId(item.osmId),
      name: item.name,
      category: item.category,
      address: item.address,
      distanceText: formatDistance(distanceMeters),
      latitude: item.latitude,
      longitude: item.longitude,
      acStatus: "UNVERIFIED",
      trustScore: 0,
      totalReportCount: 0,
      lastReportedAt: null,
      mapX: longitudeToX(item.longitude),
      mapY: latitudeToY(item.latitude),
      isRegistered: false,
      osmId: item.osmId,
      sourceLabel: "OpenStreetMap",
      openingHours: item.openingHours ?? null,
      phone: null,
      website: null
    };
  });
}
export function getFallbackOpenStreetMapPlacesInBounds(bounds: OsmBounds, limit = 40): Place[] {
  return fallbackOpenStreetMapPlaces(limit, bounds);
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
    osmId: `${item.osm_type}:${item.osm_id}`,
    sourceLabel: "OpenStreetMap"
  };
}

function toPlaceFromOverpass(item: OverpassElement): Place | null {
  const tags = item.tags ?? {};
  const latitude = item.lat ?? item.center?.lat;
  const longitude = item.lon ?? item.center?.lon;
  const name = tags.name;

  if (!name || latitude == null || longitude == null) {
    return null;
  }

  const distanceMeters = calculateDistanceMeters(PARIS_CENTER.latitude, PARIS_CENTER.longitude, latitude, longitude);
  const osmId = `${item.type}:${item.id}`;

  return {
    placeId: -stableExternalId(osmId),
    name,
    category: toCategoryFromTags(tags),
    address: formatAddress(tags),
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
    osmId,
    sourceLabel: "OpenStreetMap",
    openingHours: tags.opening_hours ?? null,
    phone: tags.phone ?? tags["contact:phone"] ?? null,
    website: tags.website ?? tags["contact:website"] ?? null
  };
}

function toCategory(item: NominatimPlace): PlaceCategory {
  const text = `${item.category ?? ""} ${item.type ?? ""} ${item.address?.amenity ?? ""} ${item.address?.shop ?? ""}`.toLowerCase();
  return toCategoryFromText(text);
}

function toCategoryFromTags(tags: Record<string, string>): PlaceCategory {
  return toCategoryFromText(`${tags.amenity ?? ""} ${tags.shop ?? ""} ${tags.tourism ?? ""}`.toLowerCase());
}

function toCategoryFromText(text: string): PlaceCategory {
  if (text.includes("cafe")) {
    return "CAFE";
  }
  if (text.includes("restaurant") || text.includes("fast_food") || text.includes("food")) {
    return "RESTAURANT";
  }
  if (text.includes("mall") || text.includes("department_store") || text.includes("shopping") || text.includes("supermarket")) {
    return "MALL";
  }
  if (text.includes("hotel")) {
    return "HOTEL";
  }
  if (text.includes("library") || text.includes("public") || text.includes("townhall") || text.includes("museum") || text.includes("community")) {
    return "PUBLIC";
  }
  return "OTHER";
}

function formatAddress(tags: Record<string, string>): string {
  const house = tags["addr:housenumber"];
  const street = tags["addr:street"];
  const postcode = tags["addr:postcode"];
  const city = tags["addr:city"] ?? "Paris";
  const primary = [house, street].filter(Boolean).join(" ");
  return [primary, postcode, city].filter(Boolean).join(", ") || "Address not available";
}

function stableExternalId(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return Math.max(1, hash % 2_000_000_000);
}

function uniqueByOsmId(place: Place, index: number, places: Place[]): boolean {
  return places.findIndex((item) => item.osmId === place.osmId) === index;
}
