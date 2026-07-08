import { ArrowLeft, Search } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onBack?: () => void;
};

export function SearchBar({ value, onChange, onBack }: SearchBarProps) {
  return (
    <div className="flex items-center gap-3">
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          className="flex h-9 w-7 items-center justify-center text-acspot-muted"
          onClick={onBack}
        >
          <ArrowLeft size={22} />
        </button>
      ) : null}
      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-acspot-line bg-[#dff0fb] px-4 py-2.5 text-sm text-acspot-muted shadow-sm">
        <Search aria-hidden="true" size={16} />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-acspot-text outline-none placeholder:text-acspot-muted"
          placeholder="Search cafes, restaurants, malls..."
        />
      </label>
    </div>
  );
}
