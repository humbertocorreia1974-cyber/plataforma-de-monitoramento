export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clientes/:path*",
    "/sites/:path*",
    "/cameras/:path*",
    "/operacao/:path*",
    "/contratos/:path*",
    "/estoque/:path*",
    "/detection-rules/:path*",
    "/motion-prefilter/:path*",
    "/faturamento/:path*",
    "/incidentes/:path*",
  ],
};
