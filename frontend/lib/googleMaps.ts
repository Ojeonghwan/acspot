"use client";

import { calculateDistanceMeters, DEFAULT_CENTER, formatDistance, latitudeToY, longitudeToX } from "./geo";
import type { Place, PlaceCategory } from "./types";

export type GoogleBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

type GoogleLatLng = {
  lat: () => number;
  lng: () => number;
};

type GooglePlaceResult = {
  place_id?: string;
  name?: string;
  vicinity?: string;
  formatted_address?: string;
  types?: string[];
  geometry?: {
    location?: GoogleLatLng;
  };
  opening_hours?: {
    isOpen?: () => boolean;
  };
  formatted_phone_number?: string;
  website?: string;
  url?: string;
};

type GoogleMapsWindow = Window & {
  google?: any;
  __acspotGoogleMapsPromise?: Promise<any>;
};

const GOOGLE_MAPS_SCRIPT_ID = "acspot-google-maps";
const GOOGLE_MAPS_LIBRARIES = "places,marker";

export const GOOGLE_PLACES_BOUNDS: GoogleBounds = {
  south: 48.83,
  west: 2.29,
  north: 48.89,
  east: 2.41
};

export function hasGoogleMapsKey(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
}

export function loadGoogleMaps(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }

  const mapsWindow = window as GoogleMapsWindow;
  if (mapsWindow.google?.maps?.Map && mapsWindow.google?.maps?.places) {
    return Promise.resolve(mapsWindow.google);
  }

  if (mapsWindow.__acspotGoogleMapsPromise) {
    return mapsWindow.__acspotGoogleMapsPromise;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing"));
  }

  mapsWindow.__acspotGoogleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    const callbackName = `__acspotGoogleMapsLoaded_${Date.now()}`;
    const callbackTarget = mapsWindow as unknown as Record<string, unknown>;

    callbackTarget[callbackName] = () => {
      delete callbackTarget[callbackName];
      resolve(mapsWindow.google);
    };

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(mapsWindow.google), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Could not load Google Maps")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=${GOOGLE_MAPS_LIBRARIES}&callback=${callbackName}`;
    script.onerror = () => reject(new Error("Could not load Google Maps"));
    document.head.appendChild(script);
  });

  return mapsWindow.__acspotGoogleMapsPromise;
}

export function fetchGooglePlacesInBounds(map: any, bounds: GoogleBounds, limit = 40): Promise<Place[]> {
  return new Promise((resolve) => {
    const google = (window as GoogleMapsWindow).google;
    if (!google?.maps?.places?.PlacesService) {
      resolve([]);
      return;
    }

    const service = new google.maps.places.PlacesService(map);
    const request = {
      bounds: new google.maps.LatLngBounds(
        new google.maps.LatLng(bounds.south, bounds.west),
        new google.maps.LatLng(bounds.north, bounds.east)
      ),
      type: "establishment"
    };

    service.nearbySearch(request, (results: GooglePlaceResult[] | null, status: string) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
        resolve([]);
        return;
      }

      resolve(results.slice(0, limit).map(toPlace).filter(Boolean) as Place[]);
    });
  });
}

export function fetchGooglePlaceDetails(map: any, place: Place): Promise<Place> {
  return new Promise((resolve) => {
    const google = (window as GoogleMapsWindow).google;
    if (!google?.maps?.places?.PlacesService || !place.googlePlaceId) {
      resolve(place);
      return;
    }

    const service = new google.maps.places.PlacesService(map);
    service.getDetails(
      {
        placeId: place.googlePlaceId,
        fields: ["place_id", "name", "formatted_address", "types", "geometry", "opening_hours", "formatted_phone_number", "website", "url"]
      },
      (result: GooglePlaceResult | null, status: string) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !result) {
          resolve(place);
          return;
        }

        const latitude = result.geometry?.location?.lat() ?? place.latitude;
        const longitude = result.geometry?.location?.lng() ?? place.longitude;

        resolve({
          ...place,
          name: result.name ?? place.name,
          category: result.types ? toCategory(result.types) : place.category,
          address: result.formatted_address ?? place.address,
          distanceText: formatDistance(calculateDistanceMeters(DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude, latitude, longitude)),
          latitude,
          longitude,
          openingHours: result.opening_hours?.isOpen ? (result.opening_hours.isOpen() ? "Open now" : "Closed now") : place.openingHours,
          phone: result.formatted_phone_number ?? place.phone,
          website: result.website ?? place.website,
          googleMapsUrl: result.url ?? place.googleMapsUrl
        });
      }
    );
  });
}

function toPlace(result: GooglePlaceResult): Place | null {
  const location = result.geometry?.location;
  if (!result.place_id || !result.name || !location) {
    return null;
  }

  const latitude = location.lat();
  const longitude = location.lng();
  const category = toCategory(result.types ?? []);

  return {
    placeId: -Math.abs(hashString(result.place_id)),
    name: result.name,
    category,
    address: result.vicinity ?? result.formatted_address ?? "Address unavailable",
    distanceText: formatDistance(calculateDistanceMeters(DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude, latitude, longitude)),
    latitude,
    longitude,
    acStatus: "UNVERIFIED",
    trustScore: 0,
    totalReportCount: 0,
    lastReportedAt: null,
    mapX: longitudeToX(longitude),
    mapY: latitudeToY(latitude),
    isRegistered: false,
    googlePlaceId: result.place_id,
    googleMapsUrl: result.url,
    sourceLabel: "Google Places"
  };
}

function toCategory(types: string[]): PlaceCategory {
  if (types.includes("cafe") || types.includes("bakery")) {
    return "CAFE";
  }
  if (types.includes("restaurant") || types.includes("meal_takeaway")) {
    return "RESTAURANT";
  }
  if (types.includes("shopping_mall") || types.includes("department_store") || types.includes("store")) {
    return "MALL";
  }
  if (types.includes("lodging")) {
    return "HOTEL";
  }
  if (types.includes("library") || types.includes("museum")) {
    return "PUBLIC";
  }
  return "OTHER";
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash || 1;
}
