import { Clock, Users, X } from "lucide-react";
import { AcStatusBadge } from "./AcStatusBadge";
import { PlaceIcon } from "./PlaceIcon";
import { ReportButtons } from "./ReportButtons";
import type { Place, ReportChoice } from "@/lib/types";

type PlaceBottomSheetProps = {
  place: Place | null;
  reportChoice: ReportChoice | null;
  onReportChange: (choice: ReportChoice) => void;
  onClose: () => void;
  onSave: () => void;
};

export function PlaceBottomSheet({ place, reportChoice, onReportChange, onClose, onSave }: PlaceBottomSheetProps) {
  if (!place) {
    return null;
  }

  const actionLabel = place.acStatus === "UNVERIFIED" ? "Register" : "Save";
  const title = place.acStatus === "UNVERIFIED" ? "Register a place" : place.name;

  return (
    <aside className="absolute inset-x-0 bottom-0 z-20 rounded-t-[22px] bg-white px-4 pb-8 pt-3 shadow-[0_-6px_24px_rgba(30,59,87,0.16)]">
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
        </div>
      </div>

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
        <button type="button" className="h-9 rounded bg-[#dfeef8] text-sm font-extrabold text-acspot-muted" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="h-9 rounded bg-acspot-blue text-sm font-extrabold text-white" onClick={onSave}>
          {actionLabel}
        </button>
      </div>
    </aside>
  );
}
