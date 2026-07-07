import { CircleHelp, Snowflake, Sun } from "lucide-react";
import type { AcStatus } from "@/lib/types";

type AcStatusBadgeProps = {
  status: AcStatus;
};

export function AcStatusBadge({ status }: AcStatusBadgeProps) {
  if (status === "AVAILABLE") {
    return (
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[#7be5b1] bg-[#e7fff2] px-3 text-sm font-bold text-[#009c67]">
        <Snowflake aria-hidden="true" size={15} />
        A/C confirmed
      </span>
    );
  }

  if (status === "UNAVAILABLE") {
    return (
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[#ffb5b5] bg-[#fff0f0] px-3 text-sm font-bold text-[#fa3333]">
        <Sun aria-hidden="true" size={15} />
        No A/C
      </span>
    );
  }

  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[#d8dee7] bg-[#f1f4f8] px-3 text-sm font-bold text-[#6d7888]">
      <CircleHelp aria-hidden="true" size={15} />
      Unverified
    </span>
  );
}
