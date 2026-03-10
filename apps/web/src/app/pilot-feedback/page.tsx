import { PilotFeedbackForm } from "../../components/pilot-feedback-form";
import { PilotFeedbackList } from "../../components/pilot-feedback-list";

export default function PilotFeedbackPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">MVP Pilot</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Pilot Feedback</h2>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
          Capture contractor friction while it is happening, then use the open-issue list to decide what needs to be
          fixed before the next pilot session.
        </p>
      </div>

      <PilotFeedbackForm />
      <PilotFeedbackList />
    </div>
  );
}
