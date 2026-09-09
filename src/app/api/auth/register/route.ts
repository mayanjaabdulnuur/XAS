import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { registerSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/password";
import { saveAvatarUpload, FileValidationError } from "@/lib/storage";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = await consumeRateLimit(`register:${ip}`, 8, 60 * 60);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }

  const formData = await req.formData();

  const raw = {
    firstName: formData.get("firstName")?.toString() ?? "",
    lastName: formData.get("lastName")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
    confirmPassword: formData.get("confirmPassword")?.toString() ?? "",
    level: formData.get("level")?.toString() ?? "",
    combinationId: formData.get("combinationId")?.toString() ?? "",
    acceptTerms: formData.get("acceptTerms")?.toString() === "true",
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fix the highlighted fields", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  if (data.level === "A_LEVEL") {
    const combo = await prisma.aLevelCombination.findUnique({
      where: { id: data.combinationId },
    });
    if (!combo) {
      return NextResponse.json(
        { error: "Select a valid A Level combination" },
        { status: 400 }
      );
    }
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    // Not a hard enumeration block (registration UX benefits from telling
    // the user their email is taken), but we avoid confirming *why* in a
    // way that would help an attacker distinguish account states further.
    return NextResponse.json(
      { error: "This email cannot be registered. Try logging in or resetting your password instead." },
      { status: 409 }
    );
  }

  let avatarPath: string | undefined;
  const avatarFile = formData.get("avatar");
  if (avatarFile instanceof File && avatarFile.size > 0) {
    try {
      avatarPath = await saveAvatarUpload(avatarFile);
    } catch (err) {
      if (err instanceof FileValidationError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      level: data.level,
      combinationId: data.level === "A_LEVEL" ? data.combinationId : null,
      avatarPath,
      role: "SCHOLAR",
    },
    select: { id: true, email: true },
  });

  return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
}
