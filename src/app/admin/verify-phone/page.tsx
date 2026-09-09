import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AuthCard } from "@/components/AuthCard";
import { AdminOtpForm } from "@/components/AdminOtpForm";

export const dynamic = "force-dynamic";

export default async function AdminVerifyPhonePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return (
    <AuthCard title="Verify your identity" subtitle="One more step before you can access the Admin Panel.">
      <AdminOtpForm />
    </AuthCard>
  );
}
