"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  getPublicCraftBoardDeposit,
  initiateCraftBoardDepositPayment,
  type CraftBoardDepositRequestItem
} from "../../lib/api";
import { formatCurrency, formatDateTime, humanizeToken } from "../../lib/mvp";

export function PublicDepositPage({ publicToken }: { publicToken: string }) {
  const [deposit, setDeposit] = useState<CraftBoardDepositRequestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = await getPublicCraftBoardDeposit(publicToken);
        setDeposit(payload?.depositRequest ?? null);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Deposit request not found.");
      } finally {
        setLoading(false);
      }
    })();
  }, [publicToken]);

  function handlePaymentIntent() {
    startTransition(() => {
      void (async () => {
        try {
          const payload = await initiateCraftBoardDepositPayment(publicToken);
          setDeposit(payload.depositRequest);
          setMessage(
            "Payment intent recorded. Craft & Board will confirm the secure checkout handoff and payment completion."
          );
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Unable to start payment.");
        }
      })();
    });
  }

  if (loading) {
    return (
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-[rgba(38,29,23,0.12)] bg-white/70 p-8 text-sm text-[#5d5047]">
          Loading deposit request...
        </div>
      </section>
    );
  }

  if (error || !deposit) {
    return (
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-rose-300/40 bg-rose-50 p-8 text-sm text-rose-700">
          {error ?? "Deposit request not found."}
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-12 md:py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <article className="rounded-[2.25rem] border border-[rgba(38,29,23,0.1)] bg-[rgba(255,250,244,0.92)] p-8 shadow-[0_30px_80px_rgba(68,50,37,0.08)] md:p-10">
          <p className="text-xs uppercase tracking-[0.35em] text-[#8a6e58]">Craft & Board Deposit</p>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="font-[family-name:var(--font-cormorant)] text-4xl leading-none text-[#261d17] md:text-6xl">
                {deposit.title}
              </h1>
              <p className="mt-4 text-sm text-[#5d5047]">
                Deposit request {deposit.depositNumber} for {deposit.customerNameSnapshot}
              </p>
            </div>
            <div className="rounded-full border border-[rgba(38,29,23,0.12)] bg-white/70 px-4 py-2 text-sm text-[#3c2f26]">
              {humanizeToken(deposit.status)}
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[#4a3d34]">
            This deposit secures the next step of your custom Craft & Board project. Your proposal has already been approved. Once the deposit is confirmed, Craft & Board will move into final scheduling and production preparation.
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
              <p className="text-xs uppercase tracking-[0.3em] text-[#8a6e58]">Linked Proposal</p>
              <div className="mt-5 rounded-[1.25rem] border border-[rgba(38,29,23,0.08)] bg-[#fcf7f1] p-4 text-sm text-[#3c2f26]">
                <p>{deposit.proposal?.proposalNumber ?? "Proposal"}</p>
                <p className="mt-1">{deposit.proposal?.title ?? "Approved custom proposal"}</p>
                <p className="mt-1">{deposit.proposal?.productName ?? "Custom floating shelf"}</p>
                <p className="mt-1">Qty {deposit.proposal?.reviewedQuantity ?? 1}</p>
                <p className="mt-1">{deposit.proposal?.reviewedMaterialLabel ?? "Custom finish"}</p>
              </div>
            </article>

            <article className="rounded-[2rem] border border-[rgba(38,29,23,0.1)] bg-white/80 p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8a6e58]">What This Deposit Covers</p>
              <p className="mt-5 text-base leading-8 text-[#3c2f26]">
                {deposit.descriptionText ??
                  "This deposit reserves your project for the next step in the custom order process."}
              </p>
              {deposit.customerInstructionsText ? (
                <div className="mt-6 rounded-[1.25rem] border border-[rgba(38,29,23,0.08)] bg-[#fcf7f1] p-4 text-sm leading-7 text-[#4a3d34]">
                  {deposit.customerInstructionsText}
                </div>
              ) : null}
            </article>
          </div>

          <div className="space-y-8">
            <article className="rounded-[2rem] border border-[rgba(38,29,23,0.1)] bg-white/80 p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8a6e58]">Amount Due Now</p>
              <div className="mt-5 space-y-2 text-sm text-[#3c2f26]">
                <div className="flex items-center justify-between">
                  <span>Proposal Total</span>
                  <span>{formatCurrency(deposit.proposalTotalAmountCents, deposit.currencyCode)}</span>
                </div>
                <div className="flex items-center justify-between pt-1 text-base font-semibold text-[#261d17]">
                  <span>Deposit Due</span>
                  <span>{formatCurrency(deposit.depositAmountCents, deposit.currencyCode)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Remaining Balance</span>
                  <span>{formatCurrency(deposit.remainingBalanceAmountCents ?? 0, deposit.currencyCode)}</span>
                </div>
                {deposit.dueDate ? (
                  <div className="flex items-center justify-between">
                    <span>Due Date</span>
                    <span>{formatDateTime(deposit.dueDate)}</span>
                  </div>
                ) : null}
              </div>
            </article>

            <article className="rounded-[2rem] border border-[rgba(38,29,23,0.1)] bg-white/80 p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8a6e58]">Next Step</p>
              <p className="mt-4 text-sm leading-7 text-[#4a3d34]">
                Starting payment records your intent to pay the required deposit. Craft & Board will confirm the payment handoff and follow up with the next project step after the deposit is completed.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handlePaymentIntent}
                  disabled={isPending || Boolean(deposit.paidAt)}
                  className="rounded-full bg-[#261d17] px-5 py-3 text-sm font-medium text-[#fff9f3] disabled:opacity-60"
                >
                  {isPending ? "Preparing..." : deposit.paidAt ? "Deposit Paid" : "Start Deposit Payment"}
                </button>
              </div>
              <div className="mt-6 text-xs uppercase tracking-[0.18em] text-[#8a6e58]">
                Shared {deposit.sharedAt ? formatDateTime(deposit.sharedAt) : "Not yet"}
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
