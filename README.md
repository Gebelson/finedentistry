# Fine Dentistry of Downtown Orlando

Redesign institucional em inglês americano, implementado originalmente em Next.js App Router, React, TypeScript e Tailwind CSS. Referência visual: Nova Dental. Marca, equipe, tratamentos e conteúdo: Fine Dentistry.

## Abrir localmente

Requisitos: Node.js 22.20+ e npm.

```powershell
cd "F:\Codex\2026-11-17\https-www-finedentistryorlando-com-https-www\outputs\fine-dentistry"
npm install
npm run dev
```

Abra http://127.0.0.1:3000. Para executar a versão de produção local:

```powershell
npm run build
npm start
```

## Verificação

```powershell
npm run lint
npm run typecheck
npm run build
npm test
node tests/audit.cjs
```

Os testes de navegador usam o Chrome instalado (`channel: 'chrome'`). O plugin Browser não estava disponível; foi usado Playwright diretamente. `tests/smoke.cjs` testa o fluxo crítico do agendamento. `tests/audit.cjs` percorre conteúdo, imagens, oito larguras, menus, filtros, FAQ, carrossel, galeria, foco e acessibilidade com axe. A auditoria grava evidências em `research/visual-qa` e `research/qa-results.json`.

## Estrutura

- `app/page.tsx`: home; foto oficial da equipe na capa e mapa Google antes do CTA final, conforme solicitado.
- `app/[...slug]/page.tsx`: páginas institucionais, tratamentos, tecnologias e artigos pré-renderizados.
- `components/`: navegação, agendamento, componentes editoriais, galeria, FAQ, índice do blog e mapa.
- `data/content.json`: conteúdo estruturado com URL de origem, títulos, parágrafos e listas.
- `data/ui.json`: dados compactos dos serviços e médicos; evita enviar todo o arquivo editorial aos componentes interativos.
- `lib/site-data.ts`: contato, depoimentos curtos publicados pela clínica, FAQ e equipe.
- `public/images/`: arquivos da fonte oficial para revisão local.
- `research/`: inventários, conflitos, fontes brutas, mapa de migração e evidências.

## Conteúdo e integrações

270 registros de conteúdo incluem 23 tratamentos e 222 artigos do blog, além de páginas institucionais e de pacientes. O blog tem paginação local; conteúdo clínico mantém títulos e listas. As informações são versões para revisão editorial pela clínica, não aprovação clínica ou jurídica automática.

O agendamento tem três etapas: tratamento/profissional, orientação de contato e encaminhamento real para telefone ou formulário oficial. Não existe endpoint de envio autorizado. Portanto, o site não solicita dados pessoais, não guarda informações no navegador e não exibe reserva confirmada ou solicitação enviada. Formulários de pacientes, histórico médico e pagamentos continuam nas integrações oficiais; não foram recriados.

O mapa usa um iframe Google Maps em inglês, com carregamento sob demanda e link para rotas. O conteúdo do mapa e sua disponibilidade são controlados pelo Google. É o recurso de terceiros adicionado a pedido do usuário.

A seção do mapa ocupa toda a largura da tela, sem padding lateral; tem 320 px no desktop e 280 px no celular, depois do CTA final e imediatamente acima do footer. A foto da capa recebeu restauração generativa, conservando o original separado. O resultado é mais nítido visualmente, mas possui 1686 × 933 pixels e não é 8K nativo; a revisão de detalhes reconstruídos é necessária antes da publicação. Veja `research/image-enhancement.md`.

As demais fotografias editoriais também receberam dez variantes restauradas. O mapa em `data/image-enhancements.json` permite ativar/reverter cada uma; originais preservados. Fotos de antes/depois e o texto da placa permanecem originais. Veja `research/all-images-enhancement.md`. Teste específico: `node tests/image-quality.cjs`.

## Antes de publicar

A publicação depende de autorização explícita. Confirmar direitos das fotografias, consentimento das imagens de casos clínicos, texto de privacidade, ofertas e horários. Confirmar o domínio definitivo e a integração de solicitações, caso se deseje envio próprio.

Por padrão, metadata e `robots.txt` bloqueiam indexação. `sitemap.xml` fica sem URLs enquanto `SITE_URL` não for informado. O mapa legado é somente um plano: nenhum redirecionamento 301 foi ativado. Para o ambiente aprovado, configurar `SITE_URL` e `SITE_INDEXABLE=true`, além da metadata de indexação em `app/layout.tsx`, após revisão.

Nenhuma chave de API ou credencial é necessária para abrir a versão local. Veja `.env.example` e `research/appointment-api-contract.md` para a preparação de uma integração futura.

