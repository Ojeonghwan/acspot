"use client";

import L from "leaflet";
import { LocateFixed } from "lucide-react";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { PARIS_CENTER } from "@/lib/geo";
import type { Place } from "@/lib/types";

type LeafletMapProps = {
  places: Place[];
  selectedPlace: Place | null;
  onSelect: (place: Place) => void;
};

type LeafletDomEvent = L.LeafletEvent & {
  originalEvent?: Event;
};

export function LeafletMap({ places, selectedPlace, onSelect }: LeafletMapProps) {
  return (
    <section className="relative min-h-0 flex-1 overflow-hidden border-t border-acspot-line bg-[#eef3f4]">
      <MapContainer
        center={[PARIS_CENTER.latitude, PARIS_CENTER.longitude]}
        zoom={14}
        minZoom={12}
        maxZoom={18}
        zoomControl={false}
        attributionControl={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <SelectedPlacePan selectedPlace={selectedPlace} />
        <LocateButton />
        {places.map((place) => (
          <Marker
            key={`${place.isRegistered ? "registered" : "osm"}-${place.placeId}-${place.osmId ?? place.googlePlaceId ?? ""}`}
            position={[place.latitude, place.longitude]}
            icon={createPlaceIcon(place, selectedPlace?.placeId === place.placeId)}
            title={place.name}
            alt={place.name}
            riseOnHover
            interactive
            eventHandlers={createPlaceEventHandlers(place, onSelect)}
          />
        ))}
      </MapContainer>
    </section>
  );
}

function SelectedPlacePan({ selectedPlace }: { selectedPlace: Place | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedPlace) {
      map.panTo([selectedPlace.latitude, selectedPlace.longitude], { animate: true });
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
          map.setView([position.coords.latitude, position.coords.longitude], 15, { animate: true });
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
    className: "acspot-leaflet-marker",
    html: `<span class="${unavailable ? "is-unavailable" : ""} ${selected ? "is-selected" : ""}"><em>${unavailable ? "!" : "*"}</em></span>`,
    iconSize: selected ? [72, 72] : [64, 64],
    iconAnchor: selected ? [36, 64] : [32, 56]
  });
}