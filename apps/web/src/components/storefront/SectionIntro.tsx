export function SectionIntro({
  eyebrow,
  title,
  body,
  align = "left"
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">{eyebrow}</p> : null}
      <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#241811] sm:text-5xl">{title}</h2>
      {body ? <p className="mt-4 text-base leading-7 text-[#5c4a3d]">{body}</p> : null}
    </div>
  );
}
