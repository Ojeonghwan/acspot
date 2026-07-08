"use client";

import dynamic from "next/dynamic";
import { LocateFixed, Snowflake } from "lucide-react";
import type { Place } from "@/lib/types";

type MapViewProps = {
  places: Place[];
  selectedPlace: Place | null;
  onSelect: (place: Place) => void;
};

const LeafletMap = dynamic(() => import("./LeafletMap").then((module) => module.LeafletMap), {
  ssr: false,
  loading: () => <FallbackMap places={[]} selectedPlace={null} onSelect={() => undefined} />
});

export function MapView({ places, selectedPlace, onSelect }: MapViewProps) {
  return <LeafletMap places={places} selectedPlace={selectedPlace} onSelect={onSelect} />;
}

export function FallbackMap({ places, selectedPlace, onSelect }: MapViewProps) {
  return (
    <section className="relative min-h-0 flex-1 overflow-hidden border-t border-acspot-line bg-[#eef3f4]">
      <div className="absolute inset-0 opacity-90">
        <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_0_42%,#cbd8df_42%_43%,transparent_43%_100%),linear-gradient(150deg,transparent_0_46%,#cbd8df_46%_47%,transparent_47%_100%),linear-gradient(90deg,transparent_0_60%,#dde7eb_60%_61%,transparent_61%_100%)] bg-[length:160px_130px,190px_160px,120px_120px]" />
        <div className="absolute left-[-18%] top-[45%] h-16 w-[140%] -rotate-12 border-y border-[#cbd8df] bg-[#dfe9ec]" />
        <div className="absolute left-[5%] top-[70%] h-28 w-44 rounded-[45%] border border-[#cfe2d5] bg-[#e8f4ed]" />
        <div className="absolute right-6 top-[58%] text-2xl font-extrabold tracking-normal text-[#8da1ae]">PARIS</div>
      </div>

      {places.map((place) => {
        const selected = selectedPlace?.placeId === place.placeId;
        return (
          <button
            key={`${place.isRegistered ? "registered" : "external"}-${place.placeId}-${place.osmId ?? place.googlePlaceId ?? ""}`}
            type="button"
            aria-label={place.name}
            className={`absolute flex h-12 w-12 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full rounded-bl-sm bg-acspot-blue text-white shadow-[0_3px_10px_rgba(0,115,153,0.35)] transition-transform ${selected ? "scale-125" : "scale-100"}`}
            style={{ left: `${place.mapX}%`, top: `${place.mapY}%` }}
            onClick={() => onSelect(place)}
          >
            <Snowflake size={26} strokeWidth={2.4} />
          </button>
        );
      })}

      <button
        type="button"
        className="absolute bottom-20 right-4 flex h-10 items-center gap-1.5 rounded-full border border-acspot-line bg-white px-4 text-sm font-extrabold text-acspot-blue shadow-[0_2px_8px_rgba(46,84,116,0.16)]"
      >
        <LocateFixed size={17} />
        My location
      </button>
    </section>
  );
}