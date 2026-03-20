"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  getPublicCraftBoardProposal,
  respondToCraftBoardProposal,
  type CraftBoardProposalItem
} from "../../lib/api";
import { formatCurrency, formatDateTime, humanizeToken } from "../../lib/mvp";

export function PublicProposalPage({ publicToken }: { publicToken: string }) {
  const [proposal, setProposal] = useState<CraftBoardProposalItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = await getPublicCraftBoardProposal(publicToken);
        setProposal(payload?.proposal ?? null);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Proposal not found.");
      } finally {
        setLoading(false);
      }
    })();
  }, [publicToken]);

  function respond(action: "approve" | "decline") {
    startTransition(() => {
      void (async () => {
        try {
          const payload = await respondToCraftBoardProposal(publicToken, action);
          setProposal(payload.proposal);
          setMessage(
            action === "approve"
              ? "Proposal approved. Craft & Board will follow up with next steps."
              : "Proposal marked as not moving forward."
          );
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Unable to update proposal response.");
        }
      })();
    });
  }

  if (loading) {
    return (
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-[rgba(38,29,23,0.12)] bg-white/70 p-8 text-sm text-[#5d5047]">
          Loading proposal...
        </div>
      </section>
    );
  }

  if (error || !proposal) {
    return (
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-rose-300/40 bg-rose-50 p-8 text-sm text-rose-700">
          {error ?? "Proposal not found."}
        </div>
      </section>
    );
  }

  const responseState = proposal.customerApprovedAt
    ? "APPROVED"
    : proposal.customerDeclinedAt
      ? "DECLINED"
      : proposal.status;

  return (
    <section className="px-6 py-12 md:py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <article className="rounded-[2.25rem] border border-[rgba(38,29,23,0.1)] bg-[rgba(255,250,244,0.92)] p-8 shadow-[0_30px_80px_rgba(68,50,37,0.08)] md:p-10">
          <p className="text-xs uppercase tracking-[0.35em] text-[#8a6e58]">Craft & Board Proposal</p>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="font-[family-name:var(--font-cormorant)] text-4xl leading-none text-[#261d17] md:text-6xl">
                {proposal.title}
              </h1>
              <p className="mt-4 text-sm text-[#5d5047]">
                Proposal {proposal.proposalNumber} for {proposal.customerNameSnapshot}
              </p>
            </div>
            <div className="rounded-full border border-[rgba(38,29,23,0.12)] bg-white/70 px-4 py-2 text-sm text-[#3c2f26]">
              {humanizeToken(responseState)}
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[#4a3d34]">
            This proposal reflects the reviewed shelf configuration and pricing prepared for your project. Approval lets Craft & Board move into the next step of confirming details and preparing the order. Payment and scheduling happen separately after approval.
          </p>
        </article>

        {message ? (
          <div className="rounded-[1.75rem] border border-emerald-300/40 bg-emerald-50 p-5 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <article className="rounded-[2rem] border border-[rgba(38,29,23,0.1)] bg-white/80 p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8a6e58]">Reviewed Configuration</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2 text-sm text-[#3c2f26]">
                <div className="rounded-[1.25rem] border border-[rgba(38,29,23,0.08)] bg-[#fcf7f1] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8a6e58]">Product</p>
                  <p className="mt-2">{proposal.productName}</p>
                </div>
                <div className="rounded-[1.25rem] border border-[rgba(38,29,23,0.08)] bg-[#fcf7f1] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8a6e58]">Dimensions</p>
                  <p className="mt-2">
                    {proposal.reviewedWidthValue ?? "?"}&quot; × {proposal.reviewedDepthValue ?? "?"}&quot; ×{" "}
                    {proposal.reviewedThicknessValue ?? "?"}&quot;
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-[rgba(38,29,23,0.08)] bg-[#fcf7f1] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8a6e58]">Quantity</p>
                  <p className="mt-2">{proposal.reviewedQuantity}</p>
                </div>
                <div className="rounded-[1.25rem] border border-[rgba(38,29,23,0.08)] bg-[#fcf7f1] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8a6e58]">Finish + Mounting</p>
                  <p className="mt-2">{proposal.reviewedMaterialLabel ?? "Custom finish"}</p>
                  <p className="mt-1">{proposal.reviewedMountingLabel ?? "Reviewed mounting"}</p>
                </div>
              </div>
            </article>

            <article className="rounded-[2rem] border border-[rgba(38,29,23,0.1)] bg-white/80 p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8a6e58]">Scope</p>
              <p className="mt-5 text-base leading-8 text-[#3c2f26]">{proposal.scopeSummary}</p>
              {proposal.inclusionsText ? (
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8a6e58]">Inclusions</p>
                  <p className="mt-2 text-sm leading-7 text-[#4a3d34]">{proposal.inclusionsText}</p>
                </div>
              ) : null}
              {proposal.exclusionsText ? (
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8a6e58]">Exclusions</p>
                  <p className="mt-2 text-sm leading-7 text-[#4a3d34]">{proposal.exclusionsText}</p>
                </div>
              ) : null}
              {proposal.notesForCustomer ? (
                <div className="mt-6 rounded-[1.25rem] border border-[rgba(38,29,23,0.08)] bg-[#fcf7f1] p-4 text-sm leading-7 text-[#4a3d34]">
                  {proposal.notesForCustomer}
                </div>
              ) : null}
            </article>
          </div>

          <div className="space-y-8">
            <article className="rounded-[2rem] border border-[rgba(38,29,23,0.1)] bg-white/80 p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8a6e58]">Pricing Summary</p>
              <div className="mt-5 space-y-3">
                {proposal.lineItems.length ? (
                  proposal.lineItems.map((item) => (
                    <div key={item.id} className="rounded-[1.25rem] border border-[rgba(38,29,23,0.08)] bg-[#fcf7f1] p-4 text-sm text-[#3c2f26]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          {item.description ? <p className="mt-1 leading-6 text-[#5d5047]">{item.description}</p> : null}
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8a6e58]">
                            {item.quantity} {item.unitLabel ?? "item"}
                          </p>
                        </div>
                        <p className="font-medium">{formatCurrency(item.lineTotalAmountCents, proposal.currencyCode)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.25rem] border border-dashed border-[rgba(38,29,23,0.12)] p-4 text-sm text-[#5d5047]">
                    Pricing details will be confirmed directly by the Craft & Board team.
                  </div>
                )}
              </div>
              <div className="mt-6 space-y-2 border-t border-[rgba(38,29,23,0.08)] pt-5 text-sm text-[#3c2f26]">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(proposal.subtotalAmountCents, proposal.currencyCode)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping / Delivery</span>
                  <span>{formatCurrency(proposal.shippingAmountCents, proposal.currencyCode)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <span>-{formatCurrency(proposal.discountAmountCents, proposal.currencyCode)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 text-base font-semibold text-[#261d17]">
                  <span>Total</span>
                  <span>{formatCurrency(proposal.totalAmountCents, proposal.currencyCode)}</span>
                </div>
              </div>
              {proposal.leadTimeText ? (
                <div className="mt-5 rounded-[1.25rem] border border-[rgba(38,29,23,0.08)] bg-[#fcf7f1] p-4 text-sm text-[#4a3d34]">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8a6e58]">Lead Time</p>
                  <p className="mt-2">{proposal.leadTimeText}</p>
                </div>
              ) : null}
            </article>

            <article className="rounded-[2rem] border border-[rgba(38,29,23,0.1)] bg-white/80 p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8a6e58]">Next Step</p>
              <p className="mt-4 text-sm leading-7 text-[#4a3d34]">
                Approving this proposal tells Craft & Board you want to move forward with the reviewed scope. Final production details, payment collection, and scheduling are handled after approval.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => respond("approve")}
                  disabled={isPending || Boolean(proposal.customerApprovedAt || proposal.customerDeclinedAt)}
                  className="rounded-full bg-[#261d17] px-5 py-3 text-sm font-medium text-[#fff9f3] disabled:opacity-60"
                >
                  {isPending ? "Updating..." : "Approve Proposal"}
                </button>
                <button
                  type="button"
                  onClick={() => respond("decline")}
                  disabled={isPending || Boolean(proposal.customerApprovedAt || proposal.customerDeclinedAt)}
                  className="rounded-full border border-[rgba(38,29,23,0.14)] px-5 py-3 text-sm text-[#3c2f26] disabled:opacity-60"
                >
                  Decline Proposal
                </button>
              </div>
              <div className="mt-6 text-xs uppercase tracking-[0.18em] text-[#8a6e58]">
                Shared {proposal.sharedAt ? formatDateTime(proposal.sharedAt) : "Not yet"}
              </div>
            </article>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-[#5d5047]">
          <Link href="/shop/floating-shelves" className="text-[#3c2f26] underline-offset-4 hover:underline">
            Browse floating shelves
          </Link>
          <Link href="/gallery" className="text-[#3c2f26] underline-offset-4 hover:underline">
            View gallery
          </Link>
        </div>
      </div>
    </section>
  );
}
