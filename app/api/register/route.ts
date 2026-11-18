export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isStrongPassword } from "@/lib/rbac";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { name?: string; email?: string; password?: string }
    | null;

  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
  }

  const email = String(body.email).trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }
  if (!isStrongPassword(body.password)) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 10 caracteres, com letras e números." }, { status: 400 });
  }

  // Limite simples por IP: 10 cadastros por hora (anti-abuso).
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (ip) {
    const recent = await prisma.auditLog.count({
      where: { action: "register", ip, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (recent >= 10) {
      return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
    }
  }

  const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (existing) {
    return NextResponse.json({ error: "Este email já está cadastrado." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(String(body.password), 10);
  const user = await prisma.user.create({
    data: {
      name: body.name ? String(body.name).trim().slice(0, 120) : null,
      email,
      passwordHash,
    },
    select: { id: true, email: true },
  });

  await prisma.auditLog.create({
    data: { action: "register", entityType: "User", entityId: user.id, ip, userAgent: request.headers.get("user-agent") },
  }).catch(() => {});

  return NextResponse.json({ user }, { status: 201 });
}
