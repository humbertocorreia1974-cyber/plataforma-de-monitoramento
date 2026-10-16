# Como publicar Plataforma de Monitoramento na Google Play Store

Seu app ja esta publicado como **site** (o link do deploy).
O **APK** (Android) e gerado quando voce clica em **"Gerar APK"** no builder,
apos o deploy — o JGNEXT empacota o site publicado como TWA (Trusted Web Activity).
Este guia leva esse APK ate a Play Store. Leva ~1-2h na primeira vez.

## 0. O que voce vai precisar
- Conta Google (a mesma de sempre serve)
- **US$ 25** (taxa unica, vitalicia) para a conta de desenvolvedor
- O arquivo **.apk** — clique em "Gerar APK" no builder (disponivel apos o deploy)
- Um icone 512x512 PNG e pelo menos 2 prints da tela do app

## 1. Criar a conta de desenvolvedor
1. Acesse https://play.google.com/console/signup
2. Aceite os termos, pague os US$ 25
3. Preencha nome/endereco (aparece publicamente como "desenvolvedor")

## 2. Criar o app no Play Console
1. Play Console -> **Criar app**
2. Nome do app: **Plataforma de Monitoramento**
3. Idioma padrao: Portugues (Brasil)
4. Tipo: App | Gratuito (ou Pago)
5. Aceite as declaracoes

## 3. Ficha da loja (metadados - ja preenchidos abaixo, so copiar)
- **Nome:** Plataforma de Monitoramento
- **Descricao curta (max 80):** VMS com análise de vídeo por IA self-hosted sobre câmeras existentes, central de
- **Descricao completa:** VMS com análise de vídeo por IA self-hosted sobre câmeras existentes, central de operação de eventos com workflows de operador, e ERP de campo com ordens de serviço, técnicos e estoque de equipamentos em comodato.
- **Categoria:** Produtividade (ajuste se fizer mais sentido outra)
- **Icone:** 512x512 PNG (use o mesmo do app)
- **Imagem de destaque:** 1024x500 PNG
- **Screenshots:** 2 a 8, telefone, minimo 320px
- **Email de contato:** seu email
- **Politica de privacidade:** URL obrigatoria - veja secao 6

## 4. Enviar o app (release)
1. Menu lateral -> **Producao** -> **Criar nova versao**
2. Em "Assinatura de apps", aceite o **Play App Signing** (o Google gerencia a chave)
3. Faca upload do arquivo **.aab/.apk** deste projeto
4. Nome da versao: 1.0 | Notas: "Primeira versao"

## 5. Classificacao de conteudo + publico-alvo
1. **Classificacao de conteudo** -> responda o questionario (app comum = Livre)
2. **Publico-alvo** -> selecione as faixas etarias
3. **App de noticias / Covid / dados financeiros** -> normalmente "Nao"
4. **Seguranca de dados** -> declare o que o app coleta (email de login, etc)

## 6. Politica de privacidade (obrigatoria)
O Google exige uma URL publica com a politica. Opcoes:
- Gere gratis em https://app-privacy-policy-generator.firebaseapp.com
- Hospede o texto em `/privacidade` no proprio Plataforma de Monitoramento (o app ja tem backend)
Cole a URL final no campo "Politica de privacidade" da ficha da loja.

## 7. Enviar para revisao
1. Confira se todas as secoes tem check verde no painel "Visao geral do app"
2. **Enviar para revisao**
3. Revisao do Google: de algumas horas a 7 dias na primeira vez
4. Aprovado = app no ar em https://play.google.com/store/apps/details?id=com.jgnext.plataformademonitorament

## Dados tecnicos deste app (para os formularios)
- **Package ID:** `com.jgnext.plataformademonitorament`
- **Tipo:** TWA (Trusted Web Activity) - o APK abre o site publicado em tela cheia
- **Permissoes:** apenas INTERNET (nenhuma sensivel)

---
_Guia gerado automaticamente pelo JGNEXT. Duvidas: suporte@jgnext.com_
