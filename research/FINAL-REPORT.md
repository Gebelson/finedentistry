# Fine Dentistry — relatório de entrega local

Data: 17/11/2026. **Não houve deploy, push, merge, alteração de DNS ou configuração externa.** Preview local: http://127.0.0.1:3000.

## Escopo entregue

- Next.js App Router, React, TypeScript, Tailwind e componentes próprios; páginas pré-renderizadas e conteúdo separado da apresentação.
- 274 URLs públicas oficiais inspecionadas; inventário em CSV, conteúdo bruto e manifesto com fonte por registro.
- 270 registros de conteúdo: 23 tratamentos, 222 artigos do blog e páginas institucionais/recursos. Com home, tecnologia, privacidade e paginação do blog, 291 rotas de conteúdo foram abertas pelo teste de navegador.
- Home completa, prática, três médicos e biografias, equipe, tecnologias, Invisalign, serviços com filtro, financiamento, planos, novos pacientes, ofertas sem preços não confirmados, FAQ com 18 respostas extraídas, galeria com dez casos, avaliações com excertos reais, notícias com links, carreiras, pós-operatório com títulos/listas, contato e informação de privacidade.
- Header fixo com mudança de contraste; navegação mobile; estados de foco; FAQ nativo; carrossel com botões e swipe; viewer da galeria; animação breve no hero; reduced motion.
- Agendamento honesto em três etapas com seleção e encaminhamento real para telefone/formulário oficial. Nenhum dado de paciente é coletado ou persistido nesta versão.
- SEO local estrutural: títulos/descrições, breadcrumbs, schema Dentist sem classificação inventada, sitemap condicionado ao domínio, robots/noindex adequados à revisão local. Mapa de redirecionamentos preparado; 301 não ativados.

## Pedidos posteriores incorporados

1. Foto da equipe na capa, substituindo o retrato inicial da doutora.
2. Restauração generativa de nitidez/exposição da foto, mantendo a original em arquivo separado. A versão gerada tem 1686 × 933 pixels: aparência mais definida, **não 8K real**. Veja `image-enhancement.md` para prompt, ferramenta e limites; conferir rostos e bordados antes de publicar.
3. Mapa Google real em seção exclusiva, sem container ou margens laterais: largura integral da tela, 320 px de altura no desktop e 280 px no celular. Fica depois de “Your neighborhood. Your dental home.” e antes de “Dental care, with you in mind.”. O marcador foi observado no endereço da clínica. O mapa é serviço externo e seu carregamento depende do Google.

As instruções anexas foram usadas como especificação do trabalho solicitado. A política de eficiência do usuário e suas decisões posteriores tiveram precedência. O documento não foi tratado como autorização para publicar ou instalar integrações externas.

## Validação executada

| Verificação | Resultado |
|---|---|
| `npm run lint` | Sem erros ou avisos na última execução |
| `npm run typecheck` | Passou |
| `npm run build` | Passou; 296 entradas estáticas incluindo infraestrutura/404 |
| `npm test` | Fluxo de agendamento/fallback e Escape passaram |
| `npm run test:audit` | 291 rotas HTTP 200; um H1 por rota; nenhum href vazio `#`; 404 real no caminho inexistente |
| Responsividade | 320, 375, 390, 430, 768, 1024, 1440 e 1920 px, sem overflow; nenhuma imagem quebrada na home |
| Interações | Menu/navegação mobile, filtro, FAQ, carrossel, galeria, seleção obrigatória, voltar, foco e Escape passaram |
| Capa/mapa | Teste confirmou imagem tratada, mapa alinhado em x=0, largura igual ao viewport, altura até 320 e ordem entre as duas seções solicitadas |
| Acessibilidade | Auditoria focada final em seis cenários, incluindo FAQ mobile, com regras WCAG 2.0/2.1/2.2 A/AA: zero violações detectadas por axe |
| Pós-operatório | Título “Veneers” restaurado e lista de sete alimentos preservada sob a seção correta |
| Reduced motion / reflow | Movimento desativado por preferência; sem overflow no equivalente de reflow a 200% |
| Erros JavaScript | Nenhum pageerror no teste completo |
| Lighthouse mobile | Última execução: desempenho 100, acessibilidade 100, boas práticas 100, SEO 66 pelo bloqueio deliberado de indexação; JSON bruto e resumo preservados |

`qa-results.json` contém o teste completo; `a11y-results.json` contém a checagem final com todos os conjuntos de regras A e AA. Capturas em `visual-qa/`. Lighthouse e axe são evidência automatizada, não certificação WCAG nem garantia de Core Web Vitals em produção. INP de usuários reais não foi medido.

As execuções locais do Lighthouse variaram entre 99 e 100 em desempenho e LCP de 0,8 a 2,1 s; a última execução aproveita assets já servidos no ambiente de teste. CLS foi zero e TBT de 20–30 ms. É necessária medição no domínio/infraestrutura finais e com usuários reais após publicação para avaliar comportamento em produção.

O plugin Browser não estava disponível. Foi utilizado Playwright com Chrome instalado; nenhuma inspeção/screenshot foi alegada sem arquivo correspondente. A ferramenta de navegador textual não abriu Nova, mas o Chrome abriu e permitiu medições e screenshots em seis resoluções.

## Revisão e correções

Um revisor independente conferiu renderização, conteúdo, privacidade e arquitetura. Foram corrigidos títulos de procedimentos ausentes, listas achatadas, breadcrumbs indevidos no corpo dos artigos e matérias não apresentadas em News & Media. Testes também encontraram um slug legado com espaço, nomes acessíveis que não incluíam o rótulo visível e favicon ausente; foram corrigidos e verificados novamente. Detalhes da fonte não foram alterados silenciosamente para resolver horários/preços contraditórios.

## Limites e decisões pendentes

Atualização de imagens solicitada posteriormente: dez restaurações adicionais foram integradas a tratamentos, retratos e fotos de atendimento/equipe, com fonte responsiva e qualidade 95. Os registros de antes/depois não foram reconstruídos. O teste específico passou em 21 combinações de rota/largura, além de lint, TypeScript, build e fluxo de agendamento. Consulte `all-images-enhancement.md`, `image-restoration-manifest.json` e `image-quality-qa.json`. Os números Lighthouse anteriores descrevem a entrega anterior; a medição atualizada está em `lighthouse-images-mobile.json`.

- Publicação depende de autorização do usuário.
- Confirmar direitos de fotografias e consentimento dos casos clínicos. Confirmar a fidelidade dos detalhes reconstruídos pela IA na foto da equipe.
- Confirmar horário de quinta-feira, promoções, nível Invisalign e telefones secundários. Omitidos onde conflitantes.
- Política clínica de privacidade e revisão editorial/odontológica ainda devem ser aprovadas pela clínica.
- Nenhuma integração própria de envio ou confirmação existe; sucesso/erro de endpoint não foi simulado como funcionalidade real. Contrato futuro em `appointment-api-contract.md`.
- Formulários de cadastro/histórico e pagamentos permanecem nas URLs oficiais; não foram migrados para um processamento novo. Cherry-Dental-Financing foi inventariada como conteúdo duplicado do financiamento, não uma rota redundante.
- Sitemap só emite URLs após definição de `SITE_URL`. Indexação permanece bloqueada e o resultado SEO do Lighthouse reflete essa restrição deliberada.
- A referência usa fontes comerciais e fotografias diferentes. Foram usadas alternativas de sistema; não existe alegação de equivalência pixel a pixel ou de licença para arquivos da Nova.
- Chromium/Chrome foi testado; Safari/Firefox, leitores de tela, dispositivos físicos e disponibilidade futura de integrações externas não foram certificados.

## Arquivos e fontes

`fine-dentistry-page-inventory.csv`, `fine-dentistry-content-manifest.json`, `legacy-route-map.csv`, `asset-inventory.md`, `fact-conflicts.md`, `nova-design-audit.md` e fontes brutas documentam a migração.

Fontes: https://www.finedentistryorlando.com/ e seu sitemap público; referência visual: https://nova-dental-dev.webflow.io/. As páginas originais e URLs exatas constam no inventário. `README.md` documenta instalação, execução, testes e configuração.

## Atualização posterior — posição do mapa
A pedido do usuário, o mapa foi movido para depois do CTA final, imediatamente acima do footer. Mantém largura total, 320 px no desktop e 280 px no celular. Build passou; teste no navegador em 390 e 1440 px confirmou ordem, largura e ausência de espaço entre mapa e footer. Esta atualização substitui a posição descrita anteriormente.


## Restauração posterior de conteúdo e identidade
Concluídos os pedidos de galeria com 20 casos e legendas originais, horários e redes sociais oficiais, seção The Fine Dentistry Difference e logo original branca. Lint, TypeScript, build, testes específicos em 390/1440 px, agendamento e seis cenários axe passaram. Detalhes em requested-content-restoration.md.

