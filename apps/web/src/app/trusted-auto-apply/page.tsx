import { TrustedAutoApplyRulesPanel } from "../../components/trusted-auto-apply-rules-panel";
import { getMachines, getTrustedAutoApplyRules, getViewerContext } from "../../lib/api";

export default async function TrustedAutoApplyPage() {
  const [context, rulesPayload, machinesPayload] = await Promise.all([
    getViewerContext(),
    getTrustedAutoApplyRules(),
    getMachines()
  ]);

  if (!context) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Trusted Auto-Apply</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Authentication required</h2>
        <p className="mt-3 text-sm text-slate-300">Sign in to review or manage trusted auto-apply rules.</p>
      </section>
    );
  }

  const canManage = context.membership.role === "OWNER" || context.membership.role === "ADMIN";

  return (
    <section className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Trusted Auto-Apply</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Conservative automation for obvious machine-confirmed stage signals</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          Manual review stays the default. These rules only allow a small HIGH-confidence subset of machine-linked stage candidates to apply automatically.
        </p>
      </div>

      {rulesPayload && machinesPayload ? (
        <TrustedAutoApplyRulesPanel
          initialRules={rulesPayload.rules}
          machines={machinesPayload.machines}
          canManage={canManage}
        />
      ) : (
        <div className="rounded-[1.5rem] border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100">
          Trusted auto-apply configuration is unavailable for the current user or organization.
        </div>
      )}
    </section>
  );
}
