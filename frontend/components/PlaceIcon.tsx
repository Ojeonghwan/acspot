import { Coffee, ShoppingBag, Utensils } from "lucide-react";
import type { PlaceCategory } from "@/lib/types";

type PlaceIconProps = {
  category: PlaceCategory;
  compact?: boolean;
};

export function PlaceIcon({ category, compact = false }: PlaceIconProps) {
  const Icon = category === "RESTAURANT" ? Utensils : category === "MALL" ? ShoppingBag : category === "CAFE" ? Coffee : null;

  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-[#ddf4ff] text-acspot-blue ${compact ? "h-10 w-10" : "h-12 w-12"}`}>
      {Icon ? <Icon aria-hidden="true" size={compact ? 18 : 20} strokeWidth={2.2} /> : <OtherPlaceIcon compact={compact} />}
    </span>
  );
}

function OtherPlaceIcon({ compact }: { compact: boolean }) {
  const size = compact ? 24 : 28;

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="5" y="5" width="30" height="30" rx="11" fill="#dff1ff" />
      <circle cx="14" cy="20" r="3" fill="#3a96c9" />
      <circle cx="20" cy="20" r="3" fill="#3a96c9" />
      <circle cx="26" cy="20" r="3" fill="#3a96c9" />
    </svg>
  );
}
