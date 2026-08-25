"use server";

import { revalidatePath } from "next/cache";
import { saveHqPartnerAnswer } from "../../../../lib/hq/data";

/**
 * Saves the signed-in partner's answer. The API derives the author from the
 * session, so nothing here sends a personName and nothing here can write on
 * another partner's behalf.
 *
 * Reserved question range for this section: 101-112 (see
 * content/hq/partnership-agreement.ts). Adding a 13th question there means
 * bumping the upper bound below to match.
 */
export async function saveHqAnswerAction(formData: FormData) {
  const question = Number(formData.get("question"));
  const body = String(formData.get("body") ?? "");
  const responseIdRaw = formData.get("responseId");
  const responseId = typeof responseIdRaw === "string" && responseIdRaw ? responseIdRaw : null;

  if (!Number.isInteger(question) || question < 101 || question > 112) {
    return;
  }

  await saveHqPartnerAnswer({ responseId, question, body });

  revalidatePath("/hq/partnership-agreement");
  revalidatePath("/hq");
}
