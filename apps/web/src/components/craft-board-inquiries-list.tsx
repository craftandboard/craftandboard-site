"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCraftBoardInquiries, type CraftBoardInquiryItem } from "../lib/api";
import { formatDateTime, humanizeToken } from "../lib/mvp";
import { StatusBadge } from "./status-badge";

const statusOptions = ["ALL", "NEW", "REVIEWED", "QUOTE_IN_PROGRESS", "QUOTED", "CLOSED", "LOST"] as const;

export function CraftBoardInquiriesList() {
  const [inquiries, setInquiries] = useState<CraftBoardInquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("ALL");
  const [query, setQuery] = useState("");
  const [productFamily, setProductFamily] = useState("all");
  const [estimateState, setEstimateState] = useState<"all" | "has-estimate" | "needs-estimate">("all");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const payload = await getCraftBoardInquiries({
        status: status === "ALL" ? undefined : status,
        q: query.trim() || undefined,
        productFamily: productFamily === "all" ? undefined : productFamily,
        estimateState: estimateState === "all" ? undefined : estimateState
      });
      setInquiries(payload?.inquiries ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load inquiries.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = await getCraftBoardInquiries({
          status: status === "ALL" ? undefined : status,
          q: query.trim() || undefined,
          productFamily: productFamily === "all" ? undefined : productFamily,
          estimateState: estimateState === "all" ? undefined : estimateState
        });
        setInquiries(payload?.inquiries ?? []);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to load inquiries.");
      } finally {
        setLoading(false);
      }
    })();
  }, [status, query, productFamily, estimateState]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Craft & Board</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Inquiry Queue</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Review public requests, move them into quote prep, and keep the original customer intake separate from the internal estimate workflow.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
        >
          Refresh
        </button>
      </div>

      <section className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2 text-sm text-slate-200">
          <span>Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as (typeof statusOptions)[number])}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All statuses" : humanizeToken(option)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          <span>Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, email, product"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          <span>Product Family</span>
          <select
            value={productFamily}
            onChange={(event) => setProductFamily(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          >
            <option value="all">All product families</option>
            <option value="floating-shelves">Floating Shelves</option>
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          <span>Estimate State</span>
          <select
            value={estimateState}
            onChange={(event) => setEstimateState(event.target.value as "all" | "has-estimate" | "needs-estimate")}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          >
            <option value="all">All estimate states</option>
            <option value="needs-estimate">Needs estimate</option>
            <option value="has-estimate">Has estimate</option>
          </select>
        </label>
      </section>

      {error ? (
        <div className="rounded-3xl border border-rose-300/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          Loading inquiries...
        </div>
      ) : inquiries.length === 0 ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
          No inquiries match the current filters.
        </div>
      ) : (
        <div className="grid gap-4">
          {inquiries.map((inquiry) => (
            <Link
              key={inquiry.id}
              href={`/admin/craft-board/inquiries/${inquiry.id}`}
              className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 transition hover:border-emerald-300/30 hover:bg-white/8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-semibold text-white">{inquiry.customerName}</h3>
                    <StatusBadge value={inquiry.status} label={humanizeToken(inquiry.status)} />
                    <StatusBadge
                      value={inquiry.estimateState}
                      label={inquiry.hasEstimate ? "Has estimate" : "Needs estimate"}
                    />
                  </div>
                  <p className="text-sm text-slate-300">
                    {inquiry.customerEmail} · {humanizeToken(inquiry.productFamily)} · {inquiry.productName}
                  </p>
                  <p className="text-sm text-slate-400">
                    {inquiry.widthValue} {inquiry.widthUnit} × {inquiry.depthValue} {inquiry.depthUnit} ×{" "}
                    {inquiry.thicknessValue} {inquiry.thicknessUnit} · Qty {inquiry.quantity}
                  </p>
                  <p className="text-sm text-slate-400">
                    {inquiry.materialLabel ?? "No material"} · {inquiry.mountingLabel ?? "No mounting"} ·{" "}
                    {inquiry.assignedToUser?.name ?? inquiry.assignedToUser?.email ?? "Unassigned"}
                  </p>
                </div>
                <div className="text-right text-sm text-slate-300">
                  <p>Created {formatDateTime(inquiry.createdAt)}</p>
                  <p className="mt-1">Updated {formatDateTime(inquiry.updatedAt)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
