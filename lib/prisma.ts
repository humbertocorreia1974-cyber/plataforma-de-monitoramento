import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const base =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = base;

/**
 * Fail-soft wrapper: quando o app roda sem DATABASE_URL acessível (ex.: primeiro
 * deploy antes do cliente conectar o banco), as LEITURAS em Server Components
 * — prisma.x.findMany() etc. — devolvem um valor vazio seguro em vez de derrubar
 * a página com 500. Assim a UI inteira renderiza (vazia) e passa a popular
 * sozinha quando o banco é conectado. Escritas continuam lançando erro (ficam
 * em handlers/actions, não quebram o render da página).
 */
const SAFE_READS: Record<string, unknown> = {
  findMany: [],
  findFirst: null,
  findUnique: null,
  findFirstOrThrow: null,
  findUniqueOrThrow: null,
  count: 0,
  aggregate: {},
  groupBy: [],
};

function isConnError(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message || err || "");
  return (
    /P1001|P1002|P1003|P1017|Can't reach database|ECONNREFUSED|ENOTFOUND|Environment variable not found: DATABASE_URL|getaddrinfo/i.test(
      msg,
    )
  );
}

function wrapModel(model: Record<string, unknown>): Record<string, unknown> {
  return new Proxy(model, {
    get(target, prop: string) {
      const orig = target[prop];
      if (typeof orig !== "function" || !(prop in SAFE_READS)) return orig;
      return async (...args: unknown[]) => {
        try {
          return await (orig as (...a: unknown[]) => Promise<unknown>).apply(
            target,
            args,
          );
        } catch (err) {
          if (isConnError(err)) return SAFE_READS[prop];
          throw err;
        }
      };
    },
  });
}

export const prisma = new Proxy(base, {
  get(target, prop: string) {
    const value = (target as unknown as Record<string, unknown>)[prop];
    // modelos do Prisma são objetos (delegates); métodos utilitários ($connect,
    // $transaction, etc.) e símbolos passam direto.
    if (
      typeof prop === "string" &&
      value &&
      typeof value === "object" &&
      !prop.startsWith("$") &&
      !prop.startsWith("_")
    ) {
      return wrapModel(value as Record<string, unknown>);
    }
    return value;
  },
}) as PrismaClient;
