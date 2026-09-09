import { NextResponse } from "next/server";
import { prisma, withRlsContext } from "@/server/db";
import { getVerifiedAdmin } from "@/lib/admin-guard";
import { siteSettingUpsertSchema } from "@/lib/validation";
import { logAdminAction } from "@/lib/audit";

export async function GET() {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const settings = await prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ settings });
}

export async function POST(req: Request) {
  const admin = await getVerifiedAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = siteSettingUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fix the highlighted fields" }, { status: 400 });
  }

  const setting = await withRlsContext({ userId: admin.id, role: "ADMIN" }, (tx) =>
    tx.siteSetting.upsert({
      where: { key: parsed.data.key },
      update: { value: parsed.data.value },
      create: { key: parsed.data.key, value: parsed.data.value },
    })
  );

  await logAdminAction(admin, "SETTINGS_CHANGED", {
    targetType: "SiteSetting",
    targetId: setting.key,
    metadata: { key: setting.key },
  });

  return NextResponse.json({ success: true, setting });
}
