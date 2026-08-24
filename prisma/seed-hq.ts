/**
 * Craft & Board HQ partner seed.
 *
 * Creates the organization, the three partners as Users, and their
 * OrganizationMember rows at OWNER. Idempotent: every write is an upsert keyed
 * on a unique column, so running it repeatedly changes nothing.
 *
 * Runs against whatever DATABASE_URL points at, so the same script seeds local
 * Docker Postgres today and Railway later with no edits.
 *
 *   DATABASE_URL=postgresql://... pnpm hq:seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ORG_ID = "org_local_craft_board";
const ORG_NAME = "Craft & Board";
const ORG_SLUG = "craftandboard";

/**
 * The partner roster. `personName` is the key used by HqPartnerResponse and
 * must stay in step with `apps/api/src/modules/hq/partners.ts` and
 * `apps/web/src/content/hq/roles.ts`.
 */
const PARTNERS = [
  { email: "brandonbozarth30@gmail.com", name: "Brandon Bozarth", personName: "Brandon" },
  { email: "dekent1000@gmail.com", name: "Tim Turner", personName: "Tim" },
  { email: "tyler@sublimedesignnv.com", name: "Tyler Phillips", personName: "Tyler" }
] as const;

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: ORG_ID },
    update: { name: ORG_NAME, slug: ORG_SLUG },
    create: { id: ORG_ID, name: ORG_NAME, slug: ORG_SLUG }
  });

  console.log(`organization  ${organization.slug} (${organization.id})`);

  for (const partner of PARTNERS) {
    const user = await prisma.user.upsert({
      where: { email: partner.email },
      update: { name: partner.name, organizationId: organization.id },
      create: {
        email: partner.email,
        name: partner.name,
        organizationId: organization.id
      }
    });

    const membership = await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: user.id
        }
      },
      update: { role: "OWNER" },
      create: {
        organizationId: organization.id,
        userId: user.id,
        role: "OWNER"
      }
    });

    console.log(
      `partner       ${partner.personName.padEnd(8)} ${partner.email.padEnd(30)} ${membership.role}`
    );
  }

  const owners = await prisma.organizationMember.count({
    where: { organizationId: organization.id, role: "OWNER" }
  });

  console.log(`\nOWNER memberships in ${organization.slug}: ${owners}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
