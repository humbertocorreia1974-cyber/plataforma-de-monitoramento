import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'https://exemplo.com');
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin', '/dashboard', '/painel-admin', '/configuracoes', '/conta'] },
    sitemap: `${base}/sitemap.xml`,
  };
}
