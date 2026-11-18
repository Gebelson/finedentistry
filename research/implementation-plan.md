# Fine Dentistry — plano de implementação

Especificação: PROMPT-MESTRE.md fornecido pelo usuário. A solicitação autoriza execução contínua e decisões técnicas rotineiras, sem publicar.

1. Registrar auditoria das duas fontes, screenshots e inventário de URLs, textos e imagens.
2. Criar Next.js App Router + TypeScript, CSS editorial e Tailwind, conteúdo em módulos separados. Componentes de navegação, serviços, equipe, FAQ, galeria e agendamento.
3. Implementar home com hero fotográfico, títulos amplos, serif itálica, espaçamento e grids da referência. Paleta branca #ffffff, texto #222326, cinza #f2f2f0, imagem escurecida no hero. Arial e Georgia como alternativas de sistema às fontes comerciais, sem redistribuir arquivos proprietários.
4. Gerar páginas reais a partir do inventário, preservar recursos oficiais e preparar mapa de migração sem ativar redirecionamentos.
5. Agendamento: escolher tratamento, escolher canal oficial e encaminhar. Sem integração de envio, não coletar dados pessoais nem anunciar solicitação enviada.
6. Validar build, TypeScript, lint, rotas, imagens, menu, filtros, modal, teclado, FAQ, galeria, acessibilidade e overflow em oito larguras; guardar evidências e limitações.

Arquivos: app/layout.tsx e app/page.tsx; app/[...slug]/page.tsx para páginas editoriais estáticas; components/ para ilhas interativas; data/content.json para evidências; lib/content.ts para tipos e rotas; tests/smoke.cjs para QA; research/ para fontes e relatórios.

Revisão: evitar alegações médicas sem fonte; omitir ofertas e horários contraditórios; confirmar direitos de imagem antes de publicação; nenhuma contagem de avaliações ou confirmação de reserva fictícia. Preferir server components e JavaScript apenas nas interações.
