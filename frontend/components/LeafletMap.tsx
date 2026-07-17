"use client";

import L from "leaflet";
import { LocateFixed } from "lucide-react";
import { useEffect, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { DEFAULT_CENTER } from "@/lib/geo";
import type { OsmBounds } from "@/lib/osm";
import type { Place } from "@/lib/types";

type LeafletMapProps = {
  registeredPlaces: Place[];
  poiPlaces: Place[];
  selectedPlace: Place | null;
  onSelect: (place: Place) => void;
  onBoundsChange?: (bounds: OsmBounds) => void;
};

type LeafletDomEvent = L.LeafletEvent & {
  originalEvent?: Event;
};

export function LeafletMap({ registeredPlaces, poiPlaces, selectedPlace, onSelect, onBoundsChange }: LeafletMapProps) {
  return (
    <section className="relative min-h-0 flex-1 overflow-hidden border-t border-acspot-line bg-[#eef3f4]">
      <MapContainer
        center={[DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude]}
        zoom={14}
        minZoom={12}
        maxZoom={18}
        zoomControl={false}
        attributionControl={true}
        fadeAnimation={false}
        markerZoomAnimation={false}
        zoomAnimation={false}
        wheelDebounceTime={120}
        wheelPxPerZoomLevel={96}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LeafletErrorGuard />
        <BoundsWatcher onBoundsChange={onBoundsChange} />
        <SelectedPlacePan selectedPlace={selectedPlace} />
        <LocateButton />

        {poiPlaces.map((place) => (
          <Marker
            key={`poi-${place.placeId}-${place.osmId ?? place.googlePlaceId ?? ""}`}
            position={[place.latitude, place.longitude]}
            icon={createPlaceIcon(place, isSameSelectedPlace(selectedPlace, place))}
            title={place.name}
            alt={place.name}
            riseOnHover
            interactive
            eventHandlers={createPlaceEventHandlers(place, onSelect)}
          />
        ))}

        {registeredPlaces.map((place) => (
          <Marker
            key={`registered-${place.placeId}-${place.osmId ?? place.googlePlaceId ?? ""}`}
            position={[place.latitude, place.longitude]}
            icon={createPlaceIcon(place, isSameSelectedPlace(selectedPlace, place))}
            title={place.name}
            alt={place.name}
            riseOnHover
            interactive
            zIndexOffset={500}
            eventHandlers={createPlaceEventHandlers(place, onSelect)}
          />
        ))}
      </MapContainer>
    </section>
  );
}

function LeafletErrorGuard() {
  useEffect(() => {
    const isLeafletPositionError = (value: unknown) => {
      const message = value instanceof Error ? value.message : String(value ?? "");
      return message.includes("_leaflet_pos");
    };

    const handleError = (event: ErrorEvent) => {
      if (isLeafletPositionError(event.error) || isLeafletPositionError(event.message)) {
        event.preventDefault();
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (isLeafletPositionError(event.reason)) {
        event.preventDefault();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}

function BoundsWatcher({ onBoundsChange }: { onBoundsChange?: (bounds: OsmBounds) => void }) {
  const map = useMap();
  const timeoutRef = useRef<number | null>(null);
  const lastBoundsKeyRef = useRef("");

  useEffect(() => {
    if (!onBoundsChange) {
      return undefined;
    }

    const clearPending = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const emitBounds = () => {
      clearPending();
      timeoutRef.current = window.setTimeout(() => {
        const bounds = map.getBounds();
        const nextBounds = {
          south: bounds.getSouth(),
          west: bounds.getWest(),
          north: bounds.getNorth(),
          east: bounds.getEast()
        };
        const boundsKey = [nextBounds.south, nextBounds.west, nextBounds.north, nextBounds.east]
          .map((value) => value.toFixed(4))
          .join(":");

        if (boundsKey !== lastBoundsKeyRef.current) {
          lastBoundsKeyRef.current = boundsKey;
          onBoundsChange(nextBounds);
        }
      }, 800);
    };

    emitBounds();
    map.on("movestart zoomstart", clearPending);
    map.on("moveend zoomend", emitBounds);

    return () => {
      clearPending();
      map.off("movestart zoomstart", clearPending);
      map.off("moveend zoomend", emitBounds);
    };
  }, [map, onBoundsChange]);

  return null;
}

function SelectedPlacePan({ selectedPlace }: { selectedPlace: Place | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedPlace) {
      map.panTo([selectedPlace.latitude, selectedPlace.longitude], { animate: false });
    }
  }, [map, selectedPlace]);

  return null;
}

function LocateButton() {
  const map = useMap();

  return (
    <button
      type="button"
      className="absolute bottom-20 right-4 z-[500] flex h-10 items-center gap-1.5 rounded-full border border-acspot-line bg-white px-4 text-sm font-extrabold text-acspot-blue shadow-[0_2px_8px_rgba(46,84,116,0.16)]"
      onClick={() => {
        if (!navigator.geolocation) {
          return;
        }
        navigator.geolocation.getCurrentPosition((position) => {
          map.setView([position.coords.latitude, position.coords.longitude], 15, { animate: false });
        });
      }}
    >
      <LocateFixed size={17} />
      My location
    </button>
  );
}

function createPlaceEventHandlers(place: Place, onSelect: (place: Place) => void): L.LeafletEventHandlerFnMap {
  const openPlace = (event: LeafletDomEvent) => {
    if (event.originalEvent) {
      L.DomEvent.stop(event.originalEvent);
    }
    onSelect(place);
  };

  return {
    click: openPlace,
    touchend: openPlace
  } as unknown as L.LeafletEventHandlerFnMap;
}

function createPlaceIcon(place: Place, selected: boolean) {
  const unavailable = place.acStatus === "UNAVAILABLE";
  return L.divIcon({
    className: `acspot-leaflet-marker ${place.isRegistered ? "is-registered" : "is-external"}`,
    html: `<span class="${unavailable ? "is-unavailable" : ""} ${selected ? "is-selected" : ""}"><em>${place.isRegistered ? (unavailable ? "!" : "*") : ""}</em></span>`,
    iconSize: selected ? [72, 72] : [64, 64],
    iconAnchor: selected ? [36, 64] : [32, 56]
  });
}

function isSameSelectedPlace(selectedPlace: Place | null, place: Place): boolean {
  if (!selectedPlace) {
    return false;
  }
  if (selectedPlace.placeId === place.placeId) {
    return true;
  }
  return Boolean((selectedPlace.osmId && selectedPlace.osmId === place.osmId) || (selectedPlace.googlePlaceId && selectedPlace.googlePlaceId === place.googlePlaceId));
}
