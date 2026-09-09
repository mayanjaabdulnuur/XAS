import { prisma, withRlsContext } from "../src/server/db";

// Example combinations from the spec. Not permanently hard-coded into the
// app — this is just starting data an admin can edit once the Phase 6
// admin panel ships (or via `psql` / a GUI Postgres client right now —
// see README for why `prisma studio` isn't the recommended path on Termux).
const DEFAULT_COMBINATIONS = [
  { code: "PCM", name: "Physics, Chemistry, Mathematics" },
  { code: "PCB", name: "Physics, Chemistry, Biology" },
  { code: "PM", name: "Physics, Mathematics" },
  { code: "CBG", name: "Chemistry, Biology, Geography" },
];

// Example subjects from the spec, per level. Admin CRUD for these lands in
// Phase 6; editable via `psql` or direct SQL until then.
const DEFAULT_SUBJECTS: { name: string; level: "O_LEVEL" | "A_LEVEL"; slug: string }[] = [
  { name: "Mathematics", level: "O_LEVEL", slug: "o-mathematics" },
  { name: "Chemistry", level: "O_LEVEL", slug: "o-chemistry" },
  { name: "Physics", level: "O_LEVEL", slug: "o-physics" },
  { name: "Biology", level: "O_LEVEL", slug: "o-biology" },
  { name: "English", level: "O_LEVEL", slug: "o-english" },
  { name: "Geography", level: "O_LEVEL", slug: "o-geography" },
  { name: "Computer Science", level: "O_LEVEL", slug: "o-computer-science" },
  { name: "Mathematics", level: "A_LEVEL", slug: "a-mathematics" },
  { name: "Chemistry", level: "A_LEVEL", slug: "a-chemistry" },
  { name: "Physics", level: "A_LEVEL", slug: "a-physics" },
  { name: "Biology", level: "A_LEVEL", slug: "a-biology" },
  { name: "Geography", level: "A_LEVEL", slug: "a-geography" },
];

const DEFAULT_RESOURCE_CATEGORIES = ["Notes", "Past Papers", "Revision Materials", "Study Guides"];

// Placeholder — configurable via Site Settings once the Phase 6 admin UI
// exists; editable via `psql` right now. Never hardcoded into
// application code itself (see src/lib/site-settings.ts).
const DEFAULT_SETTINGS: Record<string, string> = {
  whatsapp_number: "+000000000000",
};

async function main() {
  for (const combo of DEFAULT_COMBINATIONS) {
    await prisma.aLevelCombination.upsert({
      where: { code: combo.code },
      update: {},
      create: combo,
    });
  }

  for (const subject of DEFAULT_SUBJECTS) {
    await prisma.subject.upsert({
      where: { slug: subject.slug },
      update: {},
      create: subject,
    });
  }

  for (const name of DEFAULT_RESOURCE_CATEGORIES) {
    await prisma.resourceCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // SiteSetting has an admin-only write RLS policy (see prisma/rls.sql),
  // so seeding it needs an admin-role context — there's no real admin user
  // yet on a fresh database, so this uses role:"ADMIN" with no specific
  // userId, which the policy's app_is_admin() check accepts on its own.
  await withRlsContext({ userId: null, role: "ADMIN" }, async (tx) => {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await tx.siteSetting.upsert({
        where: { key },
        update: {},
        create: { key, value },
      });
    }
  });

  console.log(
    `Seeded ${DEFAULT_COMBINATIONS.length} combinations, ${DEFAULT_SUBJECTS.length} subjects, ${DEFAULT_RESOURCE_CATEGORIES.length} resource categories, ${Object.keys(DEFAULT_SETTINGS).length} site settings.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
