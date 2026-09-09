import { prisma } from "@/server/db";

/** Site settings have no per-user RLS restriction on SELECT — safe to read with the plain client. */
export async function getSiteSetting(key: string): Promise<string | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function getWhatsappNumber(): Promise<string | null> {
  return getSiteSetting("whatsapp_number");
}
