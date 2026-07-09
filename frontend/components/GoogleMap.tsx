"use client";

import { LocateFixed } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PARIS_CENTER } from "@/lib/geo";
import { fetchGooglePlaceDetails, fetchGooglePlacesInBounds, hasGoogleMapsKey, loadGoogleMaps, type GoogleBounds } from "@/lib/googleMaps";
import type { Place } from "@/lib/types";

type GoogleMapProps = {
  registeredPlaces: Place[];
  poiPlaces: Place[];
  selectedPlace: Place | null;
  onSelect: (place: Place) => void;
  onBoundsChange?: (bounds: GoogleBounds) => void;
  onPoiPlacesChange?: (places: Place[]) => void;
};

type MarkerRecord = {
  marker: any;
  place: Place;
};

export function GoogleMap({ registeredPlaces, poiPlaces, selectedPlace, onSelect, onBoundsChange, onPoiPlacesChange }: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<MarkerRecord[]>([]);
  const idleTimeoutRef = useRef<number | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      if (!containerRef.current || mapRef.current) {
        return;
      }

      if (!hasGoogleMapsKey()) {
        setLoadError("Google Maps API key is missing");
        return;
      }

      try {
        const google = await loadGoogleMaps();
        if (cancelled || !containerRef.current) {
          return;
        }

        const map = new google.maps.Map(containerRef.current, {
          center: { lat: PARIS_CENTER.latitude, lng: PARIS_CENTER.longitude },
          zoom: 14,
          minZoom: 12,
          maxZoom: 19,
          clickableIcons: true,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: false,
          gestureHandling: "greedy",
          styles: [
            { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "on" }] },
            { featureType: "poi.business", stylers: [{ visibility: "on" }] }
          ]
        });

        mapRef.current = map;
        map.addListener("idle", () => emitVisiblePlaces());
        map.addListener("click", (event: any) => {
          if (!event.placeId) {
            return;
          }
          event.stop();
          openGoogleMapPoi(event.placeId);
        });

        emitVisiblePlaces();
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Could not load Google Maps");
        }
      }
    }

    initializeMap();
    return () => {
      cancelled = true;
      if (idleTimeoutRef.current) {
        window.clearTimeout(idleTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const google = (window as any).google;
    const map = mapRef.current;
    if (!google?.maps || !map) {
      return;
    }

    markersRef.current.forEach(({ marker }) => marker.setMap(null));
    markersRef.current = [...poiPlaces, ...registeredPlaces].map((place) => {
      const marker = new google.maps.Marker({
        map,
        position: { lat: place.latitude, lng: place.longitude },
        title: place.name,
        zIndex: place.isRegistered ? 20 : 10,
        icon: createMarkerIcon(place, Boolean(selectedPlace && isSamePlace(selectedPlace, place)))
      });

      marker.addListener("click", async () => {
        const nextPlace = place.isRegistered ? place : await fetchGooglePlaceDetails(map, place);
        onSelect(nextPlace);
      });

      return { marker, place };
    });
  }, [registeredPlaces, poiPlaces, selectedPlace, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPlace) {
      return;
    }

    map.panTo({ lat: selectedPlace.latitude, lng: selectedPlace.longitude });
  }, [selectedPlace]);

  async function openGoogleMapPoi(placeId: string) {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const place = await fetchGooglePlaceDetails(map, {
      placeId: -Math.abs(hashString(placeId)),
      name: "Selected place",
      category: "OTHER",
      address: "Address unavailable",
      distanceText: "",
      latitude: map.getCenter().lat(),
      longitude: map.getCenter().lng(),
      acStatus: "UNVERIFIED",
      trustScore: 0,
      totalReportCount: 0,
      lastReportedAt: null,
      mapX: 50,
      mapY: 50,
      isRegistered: false,
      googlePlaceId: placeId,
      sourceLabel: "Google Places"
    });
    onSelect(place);
  }

  function emitVisiblePlaces() {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (idleTimeoutRef.current) {
      window.clearTimeout(idleTimeoutRef.current);
    }

    idleTimeoutRef.current = window.setTimeout(async () => {
      const bounds = toBounds(map);
      if (!bounds) {
        return;
      }

      onBoundsChange?.(bounds);
      if (onPoiPlacesChange) {
        const places = await fetchGooglePlacesInBounds(map, bounds, 40);
        onPoiPlacesChange(places);
      }
    }, 450);
  }

  return (
    <section className="relative min-h-0 flex-1 overflow-hidden border-t border-acspot-line bg-[#eef3f4]">
      <div ref={containerRef} className="h-full w-full" />

      {loadError ? (
        <div className="absolute inset-x-4 top-4 z-10 rounded-lg border border-acspot-line bg-white p-3 text-sm font-bold text-acspot-muted shadow">
          {loadError}
        </div>
      ) : null}

      <button
        type="button"
        className="absolute bottom-20 right-4 z-10 flex h-10 items-center gap-1.5 rounded-full border border-acspot-line bg-white px-4 text-sm font-extrabold text-acspot-blue shadow-[0_2px_8px_rgba(46,84,116,0.16)]"
        onClick={() => {
          const map = mapRef.current;
          if (!map || !navigator.geolocation) {
            return;
          }
          navigator.geolocation.getCurrentPosition((position) => {
            map.setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
            map.setZoom(15);
          });
        }}
      >
        <LocateFixed size={17} />
        My location
      </button>
    </section>
  );
}

function createMarkerIcon(place: Place, selected: boolean) {
  const isRegistered = place.isRegistered;
  const color = place.acStatus === "UNAVAILABLE" ? "#ff405a" : isRegistered ? "#0797c9" : "#dff5ff";
  const strokeColor = isRegistered ? "#ffffff" : "#0797c9";
  const scale = selected ? 1.25 : isRegistered ? 1 : 0.72;

  return {
    path: "M 0 -24 C 12 -24 22 -14 22 -2 C 22 14 0 28 0 28 C 0 28 -22 14 -22 -2 C -22 -14 -12 -24 0 -24 Z",
    fillColor: color,
    fillOpacity: 1,
    strokeColor,
    strokeWeight: isRegistered ? 3 : 4,
    scale,
    anchor: new (window as any).google.maps.Point(0, 28)
  };
}

function toBounds(map: any): GoogleBounds | null {
  const bounds = map.getBounds();
  if (!bounds) {
    return null;
  }

  const northEast = bounds.getNorthEast();
  const southWest = bounds.getSouthWest();
  return {
    south: southWest.lat(),
    west: southWest.lng(),
    north: northEast.lat(),
    east: northEast.lng()
  };
}

function isSamePlace(a: Place, b: Place): boolean {
  if (a.placeId > 0 && b.placeId > 0) {
    return a.placeId === b.placeId;
  }
  return Boolean((a.googlePlaceId && a.googlePlaceId === b.googlePlaceId) || (a.osmId && a.osmId === b.osmId));
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash || 1;
}
