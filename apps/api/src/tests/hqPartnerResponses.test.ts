import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  prisma: {
    hqPartnerResponse: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn()
    }
  }
}));

vi.mock("../lib/prisma.js", () => prismaMocks);

import { getHqPartnerResponseView } from "../modules/hq/service.js";
import { isHqAllowedEmail, personNameForEmail } from "../modules/hq/partners.js";

const ORG = "org_local_craft_board";

function response(personName: string, question: number, body: string) {
  return {
    id: `${personName}-${question}`,
    organizationId: ORG,
    personName,
    question,
    body,
    submittedAt: new Date("2026-08-24T00:00:00.000Z"),
    updatedAt: new Date("2026-08-24T00:00:00.000Z")
  };
}

describe("hq blind-then-reveal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("never returns another partner's body for a question the viewer has not answered", async () => {
    prismaMocks.prisma.hqPartnerResponse.findMany.mockResolvedValueOnce([
      response("Tim", 1, "TIM_SECRET_Q1"),
      response("Tim", 2, "TIM_SECRET_Q2")
    ]);

    const view = await getHqPartnerResponseView({
      organizationId: ORG,
      viewerPersonName: "Brandon"
    });

    expect(JSON.stringify(view)).not.toContain("TIM_SECRET");

    const q1 = view.questions.find((entry) => entry.question === 1)!;
    expect(q1.unlocked).toBe(false);
    expect(q1.responses).toEqual([]);
    expect(q1.locked).toEqual([{ personName: "Tim", hasAnswered: true }]);
    // metadata only — the body key must be absent, not null or empty
    expect(q1.locked[0]).not.toHaveProperty("body");
  });

  it("unlocks per question, not all at once", async () => {
    prismaMocks.prisma.hqPartnerResponse.findMany.mockResolvedValueOnce([
      response("Brandon", 1, "BRANDON_Q1"),
      response("Tim", 1, "TIM_SECRET_Q1"),
      response("Tim", 2, "TIM_SECRET_Q2")
    ]);

    const view = await getHqPartnerResponseView({
      organizationId: ORG,
      viewerPersonName: "Brandon"
    });

    const q1 = view.questions.find((entry) => entry.question === 1)!;
    const q2 = view.questions.find((entry) => entry.question === 2)!;

    expect(q1.unlocked).toBe(true);
    expect(q1.responses.map((entry) => entry.body)).toContain("TIM_SECRET_Q1");

    expect(q2.unlocked).toBe(false);
    expect(JSON.stringify(q2)).not.toContain("TIM_SECRET_Q2");
  });

  it("scopes the query by organizationId", async () => {
    prismaMocks.prisma.hqPartnerResponse.findMany.mockResolvedValueOnce([]);

    await getHqPartnerResponseView({ organizationId: ORG, viewerPersonName: "Tim" });

    expect(prismaMocks.prisma.hqPartnerResponse.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: ORG } })
    );
  });

  it("treats an allowlisted non-roster viewer as having answered nothing", async () => {
    prismaMocks.prisma.hqPartnerResponse.findMany.mockResolvedValueOnce([
      response("Tim", 1, "TIM_SECRET_Q1")
    ]);

    const view = await getHqPartnerResponseView({
      organizationId: ORG,
      viewerPersonName: null
    });

    expect(JSON.stringify(view)).not.toContain("TIM_SECRET");
    expect(view.questions.every((entry) => entry.unlocked === false)).toBe(true);
  });

  it("ignores whitespace-only bodies when deciding unlock", async () => {
    prismaMocks.prisma.hqPartnerResponse.findMany.mockResolvedValueOnce([
      response("Brandon", 1, "   "),
      response("Tim", 1, "TIM_SECRET_Q1")
    ]);

    const view = await getHqPartnerResponseView({
      organizationId: ORG,
      viewerPersonName: "Brandon"
    });

    const q1 = view.questions.find((entry) => entry.question === 1)!;
    expect(q1.unlocked).toBe(false);
    expect(JSON.stringify(view)).not.toContain("TIM_SECRET");
  });
});

describe("hq allowlist and roster", () => {
  it("fails closed when HQ_ALLOWED_EMAILS is unset or empty", () => {
    expect(isHqAllowedEmail("brandonbozarth30@gmail.com", undefined)).toBe(false);
    expect(isHqAllowedEmail("brandonbozarth30@gmail.com", "")).toBe(false);
  });

  it("matches case-insensitively and ignores surrounding whitespace", () => {
    const allowed = " Brandonbozarth30@Gmail.com , dekent1000@gmail.com ";
    expect(isHqAllowedEmail("brandonbozarth30@gmail.com", allowed)).toBe(true);
    expect(isHqAllowedEmail("DEKENT1000@GMAIL.COM", allowed)).toBe(true);
    expect(isHqAllowedEmail("stranger@example.com", allowed)).toBe(false);
  });

  it("maps partner emails to the personName used by HqPartnerResponse", () => {
    expect(personNameForEmail("brandonbozarth30@gmail.com")).toBe("Brandon");
    expect(personNameForEmail("dekent1000@gmail.com")).toBe("Tim");
    expect(personNameForEmail("tyler@sublimedesignnv.com")).toBe("Tyler");
    expect(personNameForEmail("stranger@example.com")).toBeNull();
  });
});
