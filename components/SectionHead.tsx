import { Ornament } from "@/components/Ornament";
import { Reveal } from "@/components/Reveal";
import type { ReactNode } from "react";

/** Eyebrow, h2 and the drawn ornament. `tone="primary"` is for use inside a primary band. */
export function SectionHead({
  eyebrow,
  title,
  id,
  tone = "cream",
  center = false,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  id?: string;
  tone?: "cream" | "primary";
  center?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={center ? "flex flex-col items-center text-center" : ""}>
      {eyebrow && (
        <Reveal>
          <p className="eyebrow">{eyebrow}</p>
        </Reveal>
      )}
      <Reveal i={1} className="mt-3">
        <h2 id={id} className="t-h2">
          {title}
        </h2>
      </Reveal>
      <div className="mt-4" data-orn="">
        <Ornament tone={tone === "primary" ? "pale" : "accent"} />
      </div>
      {children && (
        <Reveal i={2} className="mt-5 max-w-2xl t-lead">
          {children}
        </Reveal>
      )}
    </div>
  );
}
