import { List, Map } from "lucide-react";
import type { ViewMode } from "@/lib/types";

type ViewToggleProps = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex h-9 overflow-hidden rounded-full border border-acspot-line bg-[#dff0fb] p-0.5 shadow-sm">
      <button
        type="button"
        aria-label="Map view"
        aria-pressed={value === "map"}
        className={`flex h-8 w-8 items-center justify-center rounded-full ${value === "map" ? "bg-white text-acspot-blue" : "text-acspot-muted"}`}
        onClick={() => onChange("map")}
      >
        <Map size={18} />
      </button>
      <button
        type="button"
        aria-label="List view"
        aria-pressed={value === "list"}
        className={`flex h-8 w-8 items-center justify-center rounded-full ${value === "list" ? "bg-white text-acspot-blue" : "text-acspot-muted"}`}
        onClick={() => onChange("list")}
      >
        <List size={18} />
      </button>
    </div>
  );
}
