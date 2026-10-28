# Sistema de design — Plataforma de Monitoramento
Gerado com **UI/UX Pro Max** (curadoria de estilo + paleta + tipografia).
- **Estilo:** Minimalism
- **Modo:** light
- **Fontes:** Outfit (títulos) / Work Sans (corpo)
- **Efeitos:** Subtle hover transitions
- **Padrão de landing:** Hero + Features + CTA — Hero with headline/image > Value prop > Key features (3-5) > CTA section > Footer
## Tokens (CSS vars em `app/globals.css`)
```css
--bg: 210 40% 98%;
--surface: 0 0% 100%;
--surface-2: 214 45% 95%;
--border: 214 32% 91%;
--fg: 217 33% 17%;
--fg-muted: 215 19% 40%;
--brand: 221 83% 53%;
--brand-fg: 0 0% 100%;
--accent: 199 89% 48%;
--accent-fg: 0 0% 100%;
--danger: 0 84% 48%;
--danger-fg: 0 0% 100%;
--warning: 32 95% 44%;
--warning-fg: 0 0% 100%;
--success: 142 71% 35%;
--success-fg: 0 0% 100%;
```
_Use SEMPRE os tokens (`bg-brand`, `text-fg`, `border-border`…), nunca hex cru._

### Tokens semânticos de status
`danger`/`warning`/`success` existem para estados que o operador precisa
identificar à distância na fila de eventos (escalado/crítico, atenção,
resolvido/ok). Nunca usar `accent` ou `brand` para esses estados — são cores
decorativas, não semânticas, e não dão o alarme visual que a central de
operação de segurança exige.