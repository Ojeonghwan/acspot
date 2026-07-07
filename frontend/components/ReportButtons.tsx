import type { ReportChoice } from "@/lib/types";

type ReportButtonsProps = {
  value: ReportChoice | null;
  onChange: (value: ReportChoice) => void;
};

const options: Array<{ value: ReportChoice; label: string }> = [
  { value: "AVAILABLE", label: "A/C is on" },
  { value: "UNKNOWN", label: "Not sure" },
  { value: "UNAVAILABLE", label: "No A/C" }
];

export function ReportButtons({ value, onChange }: ReportButtonsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={`h-9 rounded border text-sm font-extrabold ${
              selected
                ? "border-[#7be5b1] bg-[#e7fff2] text-[#007e55]"
                : "border-acspot-line bg-white text-acspot-muted"
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
