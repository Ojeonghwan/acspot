import { Clock, Users } from "lucide-react";
import { AcStatusBadge } from "./AcStatusBadge";
import { PlaceIcon } from "./PlaceIcon";
import type { Place } from "@/lib/types";

type PlaceCardProps = {
  place: Place;
  onSelect: (place: Place) => void;
};

export function PlaceCard({ place, onSelect }: PlaceCardProps) {
  return (
    <button
      type="button"
      className="w-full rounded-lg border border-[#dbeaf5] bg-white p-4 text-left shadow-[0_2px_8px_rgba(46,84,116,0.12)]"
      onClick={() => onSelect(place)}
    >
      <div className="flex gap-3">
        <PlaceIcon category={place.category} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-extrabold text-acspot-text">{place.name}</h3>
              <p className="truncate text-sm font-medium text-acspot-muted">{place.address}</p>
            </div>
            <span className="shrink-0 text-sm font-extrabold text-acspot-blue">{place.distanceText}</span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <AcStatusBadge status={place.acStatus} />
            <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-acspot-muted">
              <span className="flex items-center gap-1">
                <Users size={13} />
                {place.totalReportCount}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {place.lastReportedAt ?? "0"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
