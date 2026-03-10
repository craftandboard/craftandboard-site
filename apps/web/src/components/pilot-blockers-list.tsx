"use client";

import Link from "next/link";
import type { PilotFeedbackItem } from "../lib/api";
import { formatDateTime, humanizeToken } from "../lib/mvp";
import { StatusBadge } from "./status-badge";

export function PilotBlockersList({ items }: { items: PilotFeedbackItem[] }) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pilot Ops</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Open blockers and high-severity issues</h3>
        </div>
        <Link href="/pilot-feedback" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">
          Open feedback triage
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {items.length ? (
          items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={item.severity} label={humanizeToken(item.severity)} />
                    <StatusBadge value={item.status} label={humanizeToken(item.status)} />
                    <StatusBadge value={item.area} label={humanizeToken(item.area)} />
                  </div>
                  <h4 className="text-lg font-semibold text-white">{item.title}</h4>
                  <p className="text-sm text-slate-300">{item.message}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{formatDateTime(item.createdAt)}</p>
                  <p>{item.pagePath ?? "General"}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {item.pagePath?.startsWith("/") ? (
                  <Link
                    href={item.pagePath}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
                  >
                    Open affected page
                  </Link>
                ) : null}
                <Link
                  href="/pilot-feedback"
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
                >
                  Triage issue
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 px-4 py-6 text-sm text-slate-300">
            No blocker or high-severity issues are open right now.
          </div>
        )}
      </div>
    </section>
  );
}
