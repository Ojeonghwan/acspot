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
        const tone = getChoiceTone(option.value, selected);
        return (
          <button
            key={option.value}
            type="button"
            className={`h-9 rounded border text-sm font-extrabold transition-colors ${tone}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function getChoiceTone(value: ReportChoice, selected: boolean): string {
  if (value === "AVAILABLE") {
    return selected ? "border-[#7be5b1] bg-[#e7fff2] text-[#007e55]" : "border-[#a7efc9] bg-white text-[#007e55]";
  }

  if (value === "UNKNOWN") {
    return selected ? "border-[#ffd36a] bg-[#fff7dc] text-[#d97706]" : "border-[#ffe29b] bg-white text-[#d97706]";
  }

  return selected ? "border-[#ffb5b5] bg-[#fff0f0] text-[#fa3333]" : "border-[#ffc9c9] bg-white text-[#fa3333]";
}
