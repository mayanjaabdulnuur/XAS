import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

// Public on purpose — the registration form needs this list before the
// scholar has an account or session. Admin CRUD for these lands in Phase 6;
// for now they're seeded (see prisma/seed.ts) and editable via
// `psql` or direct SQL until that admin UI exists.
export async function GET() {
  const combinations = await prisma.aLevelCombination.findMany({
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });
  return NextResponse.json({ combinations });
}
