import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type Role = "user" | "operador" | "cliente" | "tecnico" | "admin";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireRole(roles: Role[]) {
  const session = await requireSession();
  const role = (session.user as any).role as Role | undefined;
  if (!role || !roles.includes(role)) throw new Error("FORBIDDEN");
  return session;
}

export function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function jsonOk(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function getSessionRole(): Promise<Role | null> {
  const session = await getServerSession(authOptions);
  return ((session?.user as any)?.role as Role) ?? null;
}

export async function allowedSiteIds(userId: string, role: Role): Promise<string[] | "all"> {
  if (role === "admin") return "all";
  if (role === "cliente") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { client: { include: { sites: { select: { id: true } } } } },
    });
    return user?.client?.sites.map((s) => s.id) ?? [];
  }
  if (role === "operador") {
    const rows = await prisma.siteOperator.findMany({
      where: { userId },
      select: { siteId: true },
    });
    return rows.map((r) => r.siteId);
  }
  if (role === "tecnico") {
    const tech = await prisma.technician.findUnique({
      where: { userId },
      include: { serviceOrders: { select: { siteId: true } } },
    });
    return Array.from(new Set(tech?.serviceOrders.map((o) => o.siteId) ?? []));
  }
  return [];
}

export async function audit(params: {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: any;
  after?: any;
  ip?: string | null;
  userAgent?: string | null;
  eventId?: string | null;
  incidentId?: string | null;
  serviceOrderId?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        actorRole: params.actorRole ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        before: params.before ?? undefined,
        after: params.after ?? undefined,
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
        eventId: params.eventId ?? null,
        incidentId: params.incidentId ?? null,
        serviceOrderId: params.serviceOrderId ?? null,
      },
    });
  } catch (e) {
    console.error("audit failed", e);
  }
}

export function siteAllowed(allowed: string[] | "all", siteId: string | null | undefined): boolean {
  if (!siteId) return false;
  return allowed === "all" || allowed.includes(siteId);
}

// Esconde a senha de URLs do tipo rtsp://usuario:senha@host (nunca devolver credencial de câmera pela API).
export function maskCredentials(url: string | null | undefined): string | null {
  if (!url) return null;
  return String(url).replace(/(\/\/[^\/:@\s]+):[^@\/\s]*@/, "$1:***@");
}

export function validCameraUrl(url: unknown): boolean {
  if (url == null || url === "") return true;
  try {
    const u = new URL(String(url));
    return ["rtsp:", "rtsps:", "http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
}

export function isStrongPassword(pw: unknown): boolean {
  return typeof pw === "string" && pw.length >= 10 && pw.length <= 128 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw);
}
