export function ValueStrip({ items }: { items: string[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div key={item} className="rounded-[1.5rem] border border-[#dbcab9] bg-[#fffaf4] px-5 py-4 text-sm text-[#4f3f33]">
          {item}
        </div>
      ))}
    </div>
  );
}
