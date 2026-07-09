import { Clock, Globe, Phone, Users, X } from "lucide-react";
import { AcStatusBadge } from "./AcStatusBadge";
import { PlaceIcon } from "./PlaceIcon";
import { ReportButtons } from "./ReportButtons";
import type { Place, ReportChoice } from "@/lib/types";

type PlaceBottomSheetProps = {
  place: Place | null;
  reportChoice: ReportChoice | null;
  saving?: boolean;
  onReportChange: (choice: ReportChoice) => void;
  onClose: () => void;
  onSave: () => void;
};

export function PlaceBottomSheet({ place, reportChoice, saving = false, onReportChange, onClose, onSave }: PlaceBottomSheetProps) {
  if (!place) {
    return null;
  }

  const actionLabel = place.acStatus === "UNVERIFIED" ? "Register" : "Save";
  const title = place.acStatus === "UNVERIFIED" ? "Register a place" : place.name;
  const infoItems = [place.sourceLabel, formatCategory(place.category), place.openingHours].filter(Boolean);

  return (
    <aside className="absolute inset-x-0 bottom-0 z-[1200] rounded-t-[22px] bg-white px-4 pb-8 pt-3 shadow-[0_-6px_24px_rgba(30,59,87,0.16)]">
      <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-[#d9ebf7]" />
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-acspot-text">{title}</h2>
        <button type="button" aria-label="Close" className="flex h-9 w-9 items-center justify-center text-acspot-muted" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <div className="flex gap-3">
        <PlaceIcon category={place.category} compact />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-extrabold text-acspot-text">{place.name}</h3>
          <p className="truncate text-sm font-medium text-acspot-muted">{place.address}</p>
          {infoItems.length ? <p className="mt-1 truncate text-xs font-bold text-acspot-muted">{infoItems.join(" · ")}</p> : null}
        </div>
      </div>

      {place.phone || place.website ? (
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-acspot-muted">
          {place.phone ? (
            <span className="flex items-center gap-1 rounded-full bg-[#eef7fc] px-2 py-1">
              <Phone size={12} />
              {place.phone}
            </span>
          ) : null}
          {place.website ? (
            <span className="flex min-w-0 items-center gap-1 rounded-full bg-[#eef7fc] px-2 py-1">
              <Globe size={12} />
              <span className="max-w-[210px] truncate">{shortenUrl(place.website)}</span>
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        <AcStatusBadge status={place.acStatus} />
        <div className="flex items-center gap-2 text-xs font-medium text-acspot-muted">
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

      <div className="my-4 h-px bg-[#dbeaf5]" />
      <p className="mb-3 text-sm font-extrabold text-acspot-muted">Is there an A/C here?</p>
      <ReportButtons value={reportChoice} onChange={onReportChange} />

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" className="h-9 rounded bg-[#dfeef8] text-sm font-extrabold text-acspot-muted" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button type="button" className="h-9 rounded bg-acspot-blue text-sm font-extrabold text-white disabled:opacity-60" onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : actionLabel}
        </button>
      </div>
    </aside>
  );
}

function formatCategory(category: Place["category"]): string {
  return category.charAt(0) + category.slice(1).toLowerCase();
}

function shortenUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}
