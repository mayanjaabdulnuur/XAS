import { redirect } from "next/navigation";
import { requireVerifiedAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

// WhatsApp number is just one entry in Site Settings — kept as its own
// spec-listed nav item, but backed by the same store/page rather than a
// duplicate form, so there's only one place this value is ever edited.
export default async function AdminWhatsappPage() {
  await requireVerifiedAdmin();
  redirect("/admin/settings");
}
