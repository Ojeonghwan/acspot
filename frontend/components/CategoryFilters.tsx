import { Coffee, Landmark, ShoppingBag, Utensils } from "lucide-react";
import type { CategoryFilter } from "@/lib/types";

const filters: Array<{ value: CategoryFilter; label: string; icon: typeof Coffee | null }> = [
  { value: "ALL", label: "All", icon: null },
  { value: "CAFE", label: "Cafe", icon: Coffee },
  { value: "RESTAURANT", label: "Restaurant", icon: Utensils },
  { value: "MALL", label: "Mall", icon: ShoppingBag }
];

type CategoryFiltersProps = {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
};

export function CategoryFilters({ value, onChange }: CategoryFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {filters.map((filter) => {
        const Icon = filter.icon ?? Landmark;
        const selected = value === filter.value;
        return (
          <button
            key={filter.value}
            type="button"
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-bold shadow-sm ${
              selected
                ? "border-acspot-blue bg-acspot-blue text-white"
                : "border-acspot-line bg-white text-acspot-muted"
            }`}
            onClick={() => onChange(filter.value)}
          >
            {filter.icon ? <Icon aria-hidden="true" size={14} /> : null}
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
