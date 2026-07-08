import { PlaceCard } from "./PlaceCard";
import type { Place } from "@/lib/types";

type PlaceListProps = {
  places: Place[];
  title: string;
  onSelect: (place: Place) => void;
};

export function PlaceList({ places, title, onSelect }: PlaceListProps) {
  return (
    <section className="flex-1 overflow-y-auto px-4 pb-5">
      <h2 className="mb-2 text-sm font-extrabold text-acspot-muted">{title}</h2>
      <div className="space-y-3">
        {places.map((place) => (
          <PlaceCard key={place.placeId} place={place} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
