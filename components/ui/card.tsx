import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface/70 p-6 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-sm font-semibold text-fg", className)}
      {...props}
    />
  );
}

// 🩹 2026-09-01: era um <p> — o Developer usa <CardBody> como container e
// coloca <div>/grids dentro (div dentro de p = HTML inválido → erro de runtime).
// Agora é <div>, que aceita qualquer filho. `CardContent` é alias (nome shadcn).
export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-2 text-sm leading-relaxed text-fg-muted", className)}
      {...props}
    />
  );
}

export const CardContent = CardBody;
export const CardHeader = CardBody;
export const CardFooter = CardBody;
export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-fg-muted", className)} {...props} />;
}
