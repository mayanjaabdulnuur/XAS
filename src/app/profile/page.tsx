import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/lib/session";
import { ScholarHeader } from "@/components/ScholarHeader";
import { ProfileForm } from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      level: true,
      avatarPath: true,
      premiumStatus: true,
      premiumExpires: true,
      combination: { select: { code: true, name: true } },
    },
  });

  if (!user) redirect("/login");

  return (
    <>
      <ScholarHeader userLabel={sessionUser.name ?? sessionUser.email} />
      <main className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-xl font-display text-white mb-6">Profile</h1>

        <ProfileForm
          userId={user.id}
          firstName={user.firstName}
          lastName={user.lastName}
          avatarPath={user.avatarPath}
        />

        <dl className="mt-8 text-sm grid grid-cols-2 gap-y-2 text-white/60">
          <dt>Email</dt>
          <dd className="text-white/90">{user.email}</dd>
          <dt>Level</dt>
          <dd className="text-white/90">{user.level === "A_LEVEL" ? "A Level" : "O Level"}</dd>
          {user.combination && (
            <>
              <dt>Combination</dt>
              <dd className="text-white/90">
                {user.combination.code} — {user.combination.name}
              </dd>
            </>
          )}
          <dt>Premium status</dt>
          <dd>
            {user.premiumStatus ? (
              <span className="text-xas-gold">
                Active{user.premiumExpires ? ` until ${user.premiumExpires.toLocaleDateString()}` : ""}
              </span>
            ) : (
              <span className="text-white/60">Not active</span>
            )}
          </dd>
        </dl>

        <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-white/10 text-sm">
          <Link href="/settings" className="text-xas-gold hover:underline">
            Settings
          </Link>
          <Link href="/my-ratings" className="text-xas-gold hover:underline">
            My Ratings
          </Link>
          <Link href="/my-comments" className="text-xas-gold hover:underline">
            My Comments
          </Link>
        </div>
      </main>
    </>
  );
}
