import type { ReactNode } from "react";

export function Section({
  children,
  className = "",
  tone = "default"
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "tinted";
}) {
  const toneClass = tone === "tinted" ? "bg-[#efe4d6]/55" : "";

  return <section className={`py-14 sm:py-20 lg:py-24 ${toneClass} ${className}`}>{children}</section>;
}
