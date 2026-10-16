# SEO - Plataforma de Monitoramento

Este app ja sai com SEO tecnico pronto: sitemap.xml, robots.txt, titulo/
descricao por pagina e uma chave IndexNow (o JGNEXT avisa Bing/Yandex/
Naver/Seznam a cada deploy - automatico, voce nao faz nada).

## Para aparecer no Google e no Bing (5 min, uma vez)

### Google Search Console
1. https://search.google.com/search-console -> Adicionar propriedade -> dominio do app
2. Verifique (mais facil: registro DNS TXT no seu provedor de dominio)
3. Menu Sitemaps -> adicione https://SEU-DOMINIO/sitemap.xml

### Bing Webmaster Tools
1. https://www.bing.com/webmasters -> Adicionar site
2. Importar do Google Search Console (1 clique, sem arquivo)

### (opcional) verificacao por meta tag, sem DNS
Defina no ambiente do deploy:
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<codigo do Google>
  NEXT_PUBLIC_BING_SITE_VERIFICATION=<codigo do Bing>
e adicione no metadata do app/layout.tsx:
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION, other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } }
