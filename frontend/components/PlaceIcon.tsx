import { Coffee, ShoppingBag, Utensils } from "lucide-react";
import type { PlaceCategory } from "@/lib/types";

type PlaceIconProps = {
  category: PlaceCategory;
  compact?: boolean;
};

export function PlaceIcon({ category, compact = false }: PlaceIconProps) {
  const Icon = category === "RESTAURANT" ? Utensils : category === "MALL" ? ShoppingBag : Coffee;

  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-[#ddf4ff] text-acspot-blue ${compact ? "h-10 w-10" : "h-12 w-12"}`}>
      <Icon aria-hidden="true" size={compact ? 18 : 20} strokeWidth={2.2} />
    </span>
  );
}
