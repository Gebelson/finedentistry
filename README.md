# Fine Dentistry of Downtown Orlando

Redesign institucional em inglês americano, implementado originalmente em Next.js App Router, React, TypeScript e Tailwind CSS. Referência visual: Nova Dental. Marca, equipe, tratamentos e conteúdo: Fine Dentistry.

## Abrir localmente

Requisitos: Node.js 24.22.3+ (linha 24) e npm. Os comandos npm também usam o runtime 24.22.3 instalado no projeto.

```powershell
cd "F:\Codex\2026-11-17\https-www-finedentistryorlando-com-https-www\outputs\fine-dentistry"
npm install
npm run admin:setup
npm run admin:create
npm run content:seed
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

- `app/(site)/page.tsx`: home; foto oficial da equipe na capa e mapa Google imediatamente antes do footer.
- `app/(site)/[...slug]/page.tsx`: páginas institucionais, tratamentos, tecnologias e artigos pré-renderizados.
- `app/(payload)/`: administração isolada do layout e das animações públicas.
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

As integrações de pacientes continuam sem credenciais externas. A administração exige as variáveis locais geradas por `npm run admin:setup`. Veja `.env.example` e `research/appointment-api-contract.md`.

## Administração — workspace

O link **Clinic login** no footer abre `/admin`. Payload gerencia login, sessões e permissões no servidor. Existem perfis de administrador, editor e recepção; nesta etapa, apenas administradores gerenciam usuários. Conteúdo, recepção, calendário interno e analytics estão conectados ao workspace.

O login aceita e-mail ou nome de usuário. Uma conta administrativa local foi criada por solicitação do responsável. A configuração privada inicial permite senha de teste com pelo menos 8 caracteres somente no banco SQLite local; alterações e contas criadas pelo painel continuam exigindo 14 caracteres. Não existem credenciais padrão no código.

`npm run admin:setup` cria o segredo local e configura SQLite em `.data/clinic.db`. `npm run admin:create` solicita nome, e-mail e senha sem ecoar a senha no terminal e cria somente o primeiro administrador. Execute no terminal da pasta do projeto. Não há cadastro público, senha padrão ou login automático. Sem usuários, a página informa que o acesso precisa ser preparado. Depois do primeiro cadastro, gerencie os próximos usuários no painel.

Use senha de pelo menos 14 caracteres. A sessão dura uma hora e usa cookie HTTP-only. O login bloqueia a conta por 15 minutos após cinco tentativas inválidas. Recuperação por e-mail está desativada até configurar um provedor; nenhuma mensagem ou token de recuperação é impresso nos logs. Não apague `.data/` ou troque o segredo para recuperar uma conta real.

O banco e `.env.local` são ignorados pelo Git; `.data/` também é excluída dos envios à Vercel. Não compartilhe esses arquivos. SQLite local não pode ser usado como armazenamento persistente na Vercel: produção requer `DATABASE_URI` PostgreSQL, `PAYLOAD_SECRET` estável, `ADMIN_SERVER_URL` com a origem HTTPS autorizada e migrações do banco. O adaptador PostgreSQL está preparado com alterações automáticas de esquema desativadas. A configuração de produção foi realizada com Neon Free e Vercel Blob. A migração inicial está versionada em migrations/ e foi aplicada antes da publicação; o login e os 222 artigos existentes foram preservados.

O dashboard reúne Dev Mode da homepage, blog, biblioteca de imagens, conversas, configuração do assistente/recepção, contatos e calendário interno. Há relatórios com contagens reais e uma tela de estado das integrações. Os 222 artigos foram importados para o CMS preservando textos, links, tabelas e autoria. Homepage e blog públicos leem a versão publicada do banco, com cache e invalidação na publicação. Outras páginas institucionais e seções ainda usam os dados estáticos existentes.

No Dev Mode é possível editar hero, apresentação, cabeçalho de tratamentos e banner final; selecionar imagens; salvar rascunhos; visualizar a página ao lado dos campos; alternar desktop/mobile; publicar e consultar versões. Rascunhos têm prévia autenticada em `/workspace-preview`, sem exposição pública. O blog tem editor visual com links, tabelas e seleção de imagens, autoria, data e campos SEO. A biblioteca já contém seis fotografias utilizadas no site.

O chat está habilitado em modo híbrido; o ambiente local também permite teste. O administrador pode escolher recepção, assistente de FAQ ou ambos. O assistente consulta as perguntas frequentes existentes da clínica e encaminha questões clínicas para o telefone da prática; não há modelo generativo conectado. Visitantes recebem uma credencial aleatória por conversa, mantida somente na memória da página; não há histórico ou mensagens em localStorage/sessionStorage. O painel recebe as mensagens, permite assumir o atendimento, responder e resolver conversas. O visitante precisa manter o chat aberto para receber respostas; e-mail e SMS não são enviados.

Contatos e agendamentos são registros internos. O calendário usa America/New_York, distingue solicitações, horários planejados, cancelamentos e atendimentos concluídos e verifica conflitos sequenciais do mesmo profissional. Ele não consulta disponibilidade da agenda clínica, não faz confirmação automática e não substitui o sistema de gestão da clínica. A conexão externa, as garantias de concorrência de reservas públicas e os lembretes continuam pendentes.

Relatórios em `/admin/reports` mostram números do workspace; não apresentam contatos como pacientes atendidos nem calculam ROI sem dados financeiros. `/admin/integrations` informa claramente que IA generativa, telefonia, SMS, e-mail, pagamentos/memberships, plataformas de marketing e sincronização clínica ainda não estão conectados. Não existe equivalência integral validada com o painel privado da DentalROI.

Alterações automáticas do esquema SQLite durante requisições estão desativadas. Comandos privados inicializam um banco local novo; bancos existentes precisam de migração explícita. Cópias de segurança locais foram preservadas durante a atualização, mantendo a conta existente e os artigos.

Verificação específica: `npm run test:admin` verifica acesso e login sem credenciais por padrão. Para o ciclo completo, `node --import tsx tests/admin-session.mjs` cria uma conta temporária em um banco local vazio, executa os testes e remove a conta. Requer servidor local em `http://127.0.0.1:3010` (ou `TEST_URL`). Esse teste recusa bancos com contas existentes. Não execute em produção. As capturas ficam em `.cache/admin-qa/`.

Testes dos módulos: `tests/content-admin.cjs`, `tests/clinic-chat.cjs` e `tests/clinic-calendar.cjs`. Use `TEST_URL`, `TEST_ADMIN_USERNAME` e `TEST_ADMIN_PASSWORD` no ambiente, sem gravar credenciais em arquivos versionados. Esses testes criam e removem registros de verificação e restauram configurações alteradas; devem rodar somente em ambiente local de teste. O teste de conteúdo também confirma os 222 corpos/autorias contra a importação original. Evidências e limitações atuais: `docs/clinic-workspace-validation.md`.


## Website analytics and production storage

The admin dashboard links to `/admin/analytics`: 7/30/90-day page views, daily visitor estimates, active estimates, referral categories, devices, countries and contact interactions. Tracking begins at activation; no historical traffic is fabricated. The daily totals are **visitor-days**, not period-wide unique people. Clicks are not confirmed appointments.

Collection uses first-party requests without browser storage identifiers. It ignores staff sessions, known bots, DNT and GPC. No query strings, form contents, chat text or raw IP/user-agent values are stored. A keyed daily hash estimates visitors; its table is separate from aggregate page dimensions. Analytics requires the same persistent database as the workspace. `ANALYTICS_ENABLED=false` pauses ingestion.

Production uses Neon PostgreSQL and public Vercel Blob for editorial images. Media uploads are public assets; do not upload patient records. The initial PostgreSQL schema is versioned in `migrations/`. Apply migrations with the Payload CLI using securely supplied production variables before releasing a schema change. Runtime schema push remains disabled; never set `CMS_SCHEMA_PUSH` on a deployment. Keep secrets outside Git. Website indexing remains disabled until the definitive domain is approved.

