import { Flame } from "lucide-react";

export function HeatAlertBar() {
  return (
    <div className="flex h-11 items-center gap-2 bg-acspot-alert px-4 text-sm font-semibold text-white">
      <Flame aria-hidden="true" size={16} strokeWidth={2.4} />
      <span>Paris now 42°C — Extreme heat alert active</span>
    </div>
  );
}
