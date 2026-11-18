# PROMPT MESTRE PARA CODEX — FINE DENTISTRY OF DOWNTOWN ORLANDO

## MISSÃO E PRINCÍPIO FUNDAMENTAL

Atue como uma equipe sênior composta de UX/UI designer, diretor de arte digital, engenheiro frontend, arquiteto Next.js/React, especialista em conteúdo/SEO local, QA engineer, especialista em acessibilidade e profissional de performance Web.

Quero construir um **site institucional completo e premium para Fine Dentistry of Downtown Orlando**, usando o site Nova Dental como **referência visual, de comportamento e de arquitetura de experiência**, e o site Fine Dentistry como **fonte primária e autoritativa de conteúdo e identidade comercial**:

- **CONTEÚDO / MARCA / DADOS / IMAGENS autorizadas:** https://www.finedentistryorlando.com/
- **DESIGN / LAYOUT / INTERAÇÕES / RESPONSIVIDADE:** https://nova-dental-dev.webflow.io/
- **Case study do criador do layout:** https://phenomenonstudio.com/projects/nova-dental-booking-trust-and-education-working-together-to-change-what-visiting-feels-like/

**O site resultante deve ser da Fine Dentistry, não da Nova Dental.** Deve parecer um website premium desenhado profissionalmente, com fidelidade à linguagem visual da referência, mas sem reutilizar código proprietário, identidade de terceiros, logos, fotografias, nomes de profissionais ou depoimentos da Nova Dental. Faça implementação original; use apenas assets da clínica que o responsável tiver direito de utilizar. Se direitos/licenças de recursos não puderem ser verificados, registre a pendência e use uma alternativa autorizada, sem fingir autorização.

**Idioma de todo o website: inglês americano (en-US).** Português apenas nos relatórios para mim. Marca oficial: "Fine Dentistry of Downtown Orlando". Não traduzir para português. Público: pacientes em Orlando, Flórida, incluindo novos pacientes, famílias e interessados em serviços odontológicos e estéticos. A proposta visual é luxo editorial sóbrio + acolhimento humano + tecnologia + credibilidade clínica. Nada de template genérico ou aparência artificial de IA.

## REGRAS DE EXECUÇÃO

1. Execute a tarefa no repositório atualmente aberto pelo Codex. Comece lendo AGENTS.md, package.json, README, git status, estrutura e código. Preserve funcionalidades preexistentes e não destrua arquivos do usuário. Se o diretório estiver vazio, inicie um projeto apropriado. Se já existir stack funcional, adapte-se a ela em vez de reescrever tudo sem necessidade.
2. Trabalhe de ponta a ponta: pesquisa, extração de conteúdo, documentação, componentes, páginas, interações, validação visual e testes. Não pare depois de entregar somente um plano.
3. Não publique em produção, não faça push, merge, alterações de DNS ou configurações externas sem autorização explícita. Desenvolvimento local e execução de testes são permitidos.
4. Não invente fatos, tratamentos, preços, credenciais, prêmios, fotos de pacientes, profissionais, depoimentos, avaliações, horários, parcerias, políticas ou links. Cada dado factual precisa de URL de origem ou confirmação explícita.
5. Não substitua conteúdo da Fine Dentistry pelos textos e nomes fictícios da Nova Dental. Se alguma imagem ou informação faltar, use fallback visual elegante e sinalize no relatório.
6. Não declare algo "concluído", "testado" ou "integrado" sem evidência. Se o navegador, a rede ou ferramentas de pesquisa estiverem bloqueados, informe as limitações e continue com o que estiver acessível, sem alegar inspeção/screenshot inexistente.
7. Respeite robots.txt, limites de acesso e direitos autorais. Inspecione somente URLs públicas sem autenticação e faça requisições moderadas. Evite scripts de scraping que sobrecarreguem o servidor.
8. Tome boas decisões técnicas sem pedir confirmação para escolhas triviais. Deixe pendências **apenas** quando forem essenciais por envolverem acesso, pagamentos, dados sensíveis, credenciais, licença de assets ou fatos contraditórios.

## SKILLS — VERIFICAR E USAR

Procure primeiro por skills já instaladas em `.agents/skills` ou diretórios configurados. Use as aplicáveis em cada etapa: `frontend-design`, `ui-ux-pro-max`, `web-design-guidelines`, `playwright-cli`, `webapp-testing`, `vercel-react-best-practices`. Se não estiverem instaladas e houver permissão para instalar pacotes, utilize fontes públicas revisadas:

```powershell
npx skills add anthropics/skills --skill frontend-design -a codex -y
npx skills add nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max -a codex -y
npx skills add vercel-labs/agent-skills --skill web-design-guidelines -a codex -y
npx skills add microsoft/playwright-cli --skill playwright-cli -a codex -y
npx skills add anthropics/skills --skill webapp-testing -a codex -y
npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices -a codex -y
```

Inspecione o conteúdo e as permissões dessas skills antes de executá-las. Se falharem por ambiente/rede, não interrompa o projeto: aplique as diretrizes equivalentes manualmente e registre o bloqueio.

## FASE 1 — PESQUISA EXAUSTIVA DO SITE DE ORIGEM

Antes de criar componentes, percorra **todas as páginas públicas e links internos relevantes** do site Fine Dentistry, incluindo menus, rodapé, serviços, posts, FAQ, contatos, campanhas e links para recursos externos. Tente sitemap.xml quando disponível e complemente a coleta por navegação das páginas. Descubra a árvore real do site em vez de assumir que tudo está na home.

Crie os artefatos:

- `research/fine-dentistry-page-inventory.csv`: `source_url`, `page_title`, `h1`, `category`, `status`, `priority`, `target_route`, `last_checked`, `notes`.
- `research/fine-dentistry-content-manifest.json`: conteúdo estruturado em inglês, títulos, parágrafos úteis, listas, perguntas, serviços, CTA, metadados, fontes e assets com fonte/URL originais.
- `research/asset-inventory.md`: foto, logo, retrato, imagem de caso, banner, formato, resolução, URL de origem, licença/estado de autorização, destino previsto.
- `research/fact-conflicts.md`: alegações conflitantes com respectivas URLs, decisão conservadora e itens que exigem confirmação.
- `research/legacy-route-map.csv`: URL antiga para rota nova, títulos SEO, redirects futuros 301 se e quando a migração real for aprovada.

**Categorias mínimas para inventário:**

**Institucional:** Our Practice; Meet the Doctors; Meet the Team; Why Choose Us / Top Dentist; Why Choose an FAGD Dentist; Invisalign provider; Dawson Certified; Office Tour; Careers; Contact.

**General Dentistry:** Dental Emergency, Tooth Pain Treatment, Dental Hygiene, Pediatric Dentistry, Periodontic Dentistry, Root Canal Therapy, Oral Surgery e TMJ Treatment.

**Cosmetic Dentistry:** Cosmetic Dentistry, Dental Veneers, Teeth Whitening, Invisalign for Teens, Invisalign for Adults, Dental Implants e Same-Day Crowns (CEREC).

**Restorative Dentistry:** Restorative Dentistry, Implants, All-on-4 Implant-Retained Dentures, Teeth Express, Same-Day Crowns, Root Canal Therapy, Veneers, Periodontics e Oral Surgery.

**Aesthetics:** Botox Treatment, Lip Fillers, Dermal Fillers e TMJ Treatment.

**Technology:** Comfort Options, Cone Beam CT / CBCT, Intraoral Camera, Same-Day Crowns / Digital Scanner, Oral Cancer Screenings, Digital X-Ray, iTero / 3D Digital Impressions, Soft-Tissue Laser Therapy e tecnologias adicionais efetivamente documentadas.

**Pacientes/recursos:** New Patients, New Patient Forms (preservar link original validado), New Patient Specials, Financing, Dental Membership Plans, Make a Payment (preservar integração existente sem refazer checkout), FAQ, Patient Reviews, Smile Gallery, Post-op Information, Medical History Update, Blog, News & Media.

Liste também páginas que não estejam nesse roteiro mas forem encontradas. Registre quais URLs retornam 404, redirecionam ou têm conteúdo repetido. Deduplicate por categoria mas preserve metadados/URLs originais para SEO.

### Dados já observados — conferir novamente nas URLs originais

- Nome: **Fine Dentistry of Downtown Orlando**.
- Endereço: **429 N Fern Creek Avenue, Orlando, FL 32803, USA**.
- Telefone principal: **+1 407-898-1621**; link `tel:+14078981621`.
- E-mail: **frontoffice@finedentistryorlando.com**.
- Instagram: https://www.instagram.com/finedentistryofdowntownorlando/.
- Médicos apresentados: **Dr. Aileen Trivedi, DMD, FAGD**, **Dr. Sergio Lascurain** e **Dr. Amanda Perez** (conferir cargos, especialidades e biografias completas na página Meet-The-Doctor).
- Diferenciais destacados: comprehensive dentistry for all ages; same-day treatments; in-house restoration milling; Invisalign provider; Dawson Certified practice; 3D imaging; soft-tissue laser therapy.
- Financiamento: Cherry, CareCredit, Sunbit e, em página específica, Healthcare Finance Direct; conferir status e links ativos.
- O site possui fotos reais, logos/certificações, galeria antes/depois, FAQs, reviews, vídeos e promoções. Preserve fontes/consentimentos apropriados.
- Promoções observadas na página New Patient Specials: US$ 99 new patient adult special; US$ 79 child special (7 and under); US$ 999 single-tooth extraction; US$ 5,000 off implant-retained dentures; complimentary cosmetic consultation; complimentary second opinion. **Não publicar valores sem conferir ofertas/termos/validade com o responsável.**
- A home exibe mensagem de cerca de 1,1 mil avaliações Google com cinco estrelas; contagem e avaliação são mutáveis. Não embutir como fato eterno: verificar fonte e data, ou usar link para avaliações sem números.
- O site apresenta **informações divergentes**: a página Contact informa quinta-feira 8 AM–6 PM, enquanto alguns rodapés indicam 7 AM–7 PM. Também há números secundários diferentes e textos/badges Invisalign “Blue Diamond”, “Diamond Plus”. Registre isso e **não tente adivinhar qual é o atual**. Para publicar, usar apenas dados consistentes, ou priorizar omissão de informação duvidosa.

**URLs iniciais úteis para investigação** (não são uma lista exaustiva):

- https://www.finedentistryorlando.com/
- https://www.finedentistryorlando.com/Meet-The-Doctor
- https://www.finedentistryorlando.com/Meet-The-Team
- https://www.finedentistryorlando.com/Our-Practice
- https://www.finedentistryorlando.com/Our-Services
- https://www.finedentistryorlando.com/New-Patients
- https://www.finedentistryorlando.com/New-Patient-Specials
- https://www.finedentistryorlando.com/Contact
- https://www.finedentistryorlando.com/Smile-Gallery
- https://www.finedentistryorlando.com/Patient-Reviews
- https://www.finedentistryorlando.com/Faqs
- https://www.finedentistryorlando.com/Blog
- https://www.finedentistryorlando.com/Dental-Financing-Orlando-FL
- https://www.finedentistryorlando.com/Membership-Plans
- https://www.finedentistryorlando.com/Invisalign-Diamond-Plus-Provider-Orlando
- https://www.finedentistryorlando.com/Dental-Implants-Orlando
- https://www.finedentistryorlando.com/Dental-Veneers-Orlando
- https://www.finedentistryorlando.com/Emergency-Dentist-Orlando
- https://www.finedentistryorlando.com/Cone-Beam-CT-Orlando

## FASE 2 — ENGENHARIA REVERSA VISUAL DO NOVA DENTAL

Use navegador com Playwright (quando possível) para **inspecionar efetivamente** a referência Nova Dental e registrar as propriedades visuais com prints anotados. A meta é reproduzir seu nível de refinamento, estrutura, ritmo de composição e interações, trocando identidade e conteúdo, não criar outra direção de arte sem motivo.

Registre em `research/nova-design-audit.md`:

- Breakpoints e screenshots de 1920×1080, 1440×900, 1024×768, 768×1024, 390×844 e 375×812.
- Header: posição, altura, comportamento sticky, menu desktop/mobile, tipografia, contraste, hover/foco, botão de CTA, transições.
- Hero: tratamento fotográfico close-up, altura e crop (`object-position`), headline display, uso de itálico/serif em palavra de destaque, CTA, contraste/overlay, ritmo de entrada e composição nos diversos breakpoints.
- Seção About: tipografia editorial de grande escala, imagens, margem/colunas, texto secundário.
- Serviços: cards/editorial grid numerados com fotografias, tratamento de hover, botão (+), posicionamento da descrição e rolagem.
- Why Us: quatro blocos visuais/argumentos de autoridade com imagens e números.
- Testimonials: estrutura, cards, swipe/carrossel, controles e experiência de rolagem.
- Team: retratos, apresentação, especialidades e comportamento responsivo.
- CTA final, footer, links e transições.
- Modal/painel de **Book an Appointment**: sequência em três etapas, seleção de tratamento/profissional, coleta de contato e estado final; foco, teclado, mobile e validações.
- Tokens precisos inferidos da observação: fontes e seus pesos, cores, bordas, radius, spacing, gutters, max-width, tamanhos de headlines, line-height, proporções de imagens, durações/easings, sombra, máscaras e eventuais efeitos de scroll.

Use os **valores reais obtidos de inspeção**; se um item não puder ser determinado, marque como aproximação. Não invente uma suposta medição. Fotografia e logotipo da Nova Dental são apenas referência contextual e não devem aparecer como identidade final. Se uma tipografia exata não puder ser licenciada, encontre equivalente legal de alta qualidade e documente.

**Direção estética:** contemporânea, editorial, luxury minimalism, tipografia expressiva com uma combinação equilibrada de sans serif e serif, espaços negativos generosos, imagens grandes, preto/branco/neutros elegantes e microinterações sutis. Adaptar as cores só quando houver evidência da identidade visual da Fine Dentistry. Evitar excesso de dourado, gradientes chamativos, ícones genéricos, sombras pesadas, cards SaaS padronizados e animação gratuita. **Mobile é uma experiência desenhada, não apenas um desktop espremido.**

## FASE 3 — ESTRUTURA DE INFORMAÇÃO E PÁGINAS

Crie navegação limpa que mantenha o máximo do conteúdo importante da Fine Dentistry, sem despejar 50 links no menu principal.

### Home com a linguagem Nova Dental

1. **Hero premium** de alto impacto com fotografia Fine Dentistry aprovada: headline original em inglês, focada na marca, atendimento odontológico e localidade Downtown Orlando. CTA primário “Request an Appointment” e secundário para explorar tratamentos.
2. **About Fine Dentistry**: história, filosofia, atendimento compassivo, qualidade técnica, abordagem personalizada.
3. **Our Services**: cards com destaque inicial para Dental Implants, Veneers, Invisalign, Same-Day Crowns, Preventive Dentistry, Teeth Whitening, Emergency Dentistry e serviços relevantes de fato existentes. CTA “Explore All Services”. Não inventar um serviço só para preencher grid.
4. **Why Choose Fine Dentistry**: tecnologia, conforto, experiência/credenciais documentadas, atendimento aos pacientes, tratamentos no mesmo dia.
5. **Trust & Recognition**: credenciais, selos e prêmios *apenas se verificados*, com assets autorizados; evitar afirmações absolutas sem fontes.
6. **Patient Stories**: reviews reais com fonte/link, sem os nomes ou testemunhos fictícios da Nova Dental; controle de carrossel.
7. **Meet Our Doctors**: retratos, nomes e biografias verificadas dos três profissionais listados no site atual.
8. **Smile Gallery**: fotos antes/depois autorizadas, legenda/consentimento, controles responsivos e sem resultados garantidos implícitos.
9. **For New Patients**: etapas da primeira consulta, seguros/pagamentos, planos e ofertas verificadas.
10. **FAQ**: dúvidas relevantes extraídas da fonte, com accordion acessível.
11. **Find Us / Contact**: endereço real, mapa/link Directions, telefone, e-mail, horários verificados.
12. **CTA final + footer**: alinhado à referência visual, links internos e requisitos legais.

### Páginas internas e rotas

Crie páginas reais para o conteúdo encontrado na fase 1. Roteiro sugerido (ajustar à estrutura existente e inventário):

- `/` — Home.
- `/about` — Our Practice / visão / diferenciais.
- `/our-team` — médicos e equipe, com páginas de perfil quando houver conteúdo suficiente.
- `/services` — índice filtrável por General, Cosmetic, Restorative e Aesthetics.
- `/services/[slug]` — páginas detalhadas para todos os serviços relevantes; conteúdo, benefícios só quando documentados, etapas, perguntas, CTA e links relacionados.
- `/technology` e `/technology/[slug]` — tecnologias documentadas.
- `/invisalign` — destaque e conteúdo verdadeiro de Invisalign.
- `/smile-gallery` — galeria com consentimento, recursos e legendas.
- `/patient-reviews` — avaliações e fontes.
- `/new-patients` — primeira visita, formulários e orientações.
- `/specials` — promoções após confirmação.
- `/financing` — opções verificadas e links de parceiros.
- `/membership` — detalhes e links dos planos.
- `/faq` — perguntas por categoria.
- `/blog` e `/blog/[slug]` — materiais educativos publicados, quando acessíveis.
- `/contact` — contato, local, solicitação de agendamento e direções.
- `/privacy` e outras páginas legais — usar textos oficiais existentes/autorizados; se não houver política validada, deixar pendente e não inventar compromissos jurídicos.

Não gere páginas vazias, dezenas de placeholders ou links quebrados. Se uma rota não puder ser migrada com segurança, documente-a e mantenha caminho claro para o conteúdo original enquanto a substituição não estiver pronta.

## FASE 4 — ARQUITETURA E IMPLEMENTAÇÃO

Se o projeto já tiver stack, respeite-a. Se for novo e não houver restrição, escolha **Next.js App Router, TypeScript, React, Tailwind CSS e componentes reutilizáveis**, usando estrutura pronta para Vercel sem dependência de banco de dados para páginas de conteúdo.

- Tipos e conteúdo com módulos de dados estruturados: `siteConfig`, `navigation`, `doctors`, `services`, `technologies`, `faq`, `testimonials`, `gallery`, `offers`, `officeInfo`, `sourceReferences`. Separar conteúdo de código e centralizar nome, contatos e localização para impedir inconsistências.
- Componentes: Header, NavOverlay/MegaMenu, MobileMenu, Hero, SplitEditorialSection, ServiceCard, ServicesGrid, FeatureSection, DoctorCard, TestimonialCarousel, BeforeAfterGallery, FAQAccordion, CTASection, AppointmentRequestDialog, Footer, ImageWithFallback, Breadcrumbs, SEO metadata.
- Imagens: prefira assets originais da Fine Dentistry com direito de uso confirmado; salve/otimize em formato apropriado e preserve crop relevante, rostos e resolução; `next/image` quando aplicável, sizes corretos, lazy loading abaixo da dobra; não bloqueie LCP no hero.
- Componentes semânticos com aria, foco visível, contraste e navegação por teclado. Animações via CSS e/ou Motion/GSAP **somente quando justificadas** e sem acúmulo desnecessário de dependências. Suportar `prefers-reduced-motion`.
- Responsividade refinada em 320, 375, 390, 430, 768, 1024, 1440 e 1920 pixels, inclusive menus, carrosséis, textos muito longos e cards. Evitar overflow horizontal, botões inacessíveis, overlays que cortam imagem e modais fora da tela.
- URLs, estados de navegação e links reais. Header/footer não devem gerar `href="#"` sem função.
- CTA para `tel:`, `mailto:` e Directions reais.
- Não use banco de dados sem necessidade; para conteúdo inicialmente estático, prefira arquivos tipados de fácil edição. Caso o blog demande gerenciamento contínuo, desenhe interface de conteúdo substituível por CMS, sem adicionar CMS pesado prematuramente.
- No backend, nada de chaves no frontend, open redirects, logs de informações de saúde ou coleta de dados médicos sensíveis desnecessários.

### Agendamento — requisito crítico

Reproduza a experiência **visual** e a clareza do fluxo em três etapas do Nova Dental, mas **não dê ao paciente uma confirmação de consulta que não existe**.

1. Serviço e, se pertinente, profissional desejado (opcional caso a disponibilidade não seja conhecida).
2. Nome, e-mail, telefone, data/horário preferencial (e alternativa opcional), validação e consentimento/aviso de privacidade conforme política efetiva.
3. **Solicitação enviada** apenas após sucesso real de um endpoint autorizado / integração comprovada; texto explícito: a equipe entrará em contato para confirmar disponibilidade.

Caso ainda não haja credenciais ou integração de envio aprovada, **não exiba sucesso fictício nem persista dados pessoais localmente**. Implemente a interface preparada para integração com contrato de API claro, com fallback funcional para telefonar ou para o formulário oficial existente após validar sua URL. Não colete sintomas, históricos médicos, dados de seguro ou informações clínicas nesse formulário de marketing. Não use `mailto:` com informações sensíveis. Mensagens de erro, loading, retorno ao passo anterior e teclado devem funcionar. Interações mobile precisam ser tão boas quanto desktop.

## FASE 5 — SEO LOCAL, QUALIDADE E SEGURANÇA

- SEO orientado a Orlando, FL sem keyword stuffing: títulos e descrições únicos, hierarquia H1/H2/H3, URLs legíveis, canonical correto quando o domínio final estiver confirmado, Open Graph e Twitter cards, breadcrumbs, sitemap e robots adequados ao ambiente.
- JSON-LD com schema `Dentist`/`LocalBusiness` apenas com dados verificados; endereço, telefone, horários e redes sociais consistentes. Não emitir `aggregateRating` sem fonte/condições aplicáveis. Não inventar preços ou classificações.
- Mapear cada URL legada para nova URL. Preparar tabela de redirecionamentos, mas ativar 301 **somente quando a migração de domínio/site for autorizada**. Evitar conflitos de páginas canônicas e perda de conteúdo orgânico.
- Privacidade: cuidado redobrado com dados pessoais de pacientes; não adicionar ferramentas de rastreamento ou captura de dados de saúde sem revisão e autorização.
- Acessibilidade: meta WCAG 2.2 AA, menu acionável por teclado, aria-expanded e aria-controls corretos, foco gerenciado em modal, Escape fecha, foco retorna ao gatilho, labels visíveis, erros de formulário anunciados, alt descritivos, reduced motion.
- Performance: Core Web Vitals como metas (LCP < 2,5 s; CLS < 0,1; INP < 200 ms, condições de medição adequadas). Carregar fontes adequadamente, dividir JavaScript, evitar blocos que causam layout shift, compressão de imagens, redução de scripts de terceiros.
- Qualidade editorial: evitar alegações como “completely painless”, “guaranteed”, “best in Orlando” ou dados médicos novos sem fonte/autorização. Preferir textos claros, confiáveis e aprováveis pela equipe clínica.

## FASE 6 — VALIDAÇÃO COMPARATIVA, TESTES E ENTREGA

A cada etapa visual, compare site local e referência por screenshots **quando a ferramenta permitir**; não considere a página pronta só porque carrega. As fotos e textos serão diferentes, então compare geometria e linguagem visual, não pixels idênticos. Use screenshots das mesmas resoluções e revise lado a lado: hero/crop, grid, pesos de fonte, espaçamentos, alturas de seção, menu, hover, modal, footer e mobile.

Testes obrigatórios, conforme stack:

- Execução de lint, typecheck e build.
- Navegação por todas as rotas principais; evitar 404, imagens quebradas, erros JS e warnings relevantes.
- Clique de menu desktop e mobile; abrir/fechar, foco, Escape, fechar ao navegar; teclado e touch.
- Carrossel por mouse, swipe, teclado; FAQ accordion; imagens da gallery; links externos e `tel:`.
- Fluxo de agendamento: abrir, selecionar, voltar, validar, simular erro de rede, sucesso real apenas com integração válida.
- Testes em desktop, tablet e mobile; overflow-x, sticky header, zoom 200%, reduced motion.
- Lighthouse / auditoria de performance, SEO e acessibilidade quando disponíveis.
- Visual checks de 1440×900, 1024×768 e 390×844, com evidências em `research/visual-qa/` se possível.

### Entregáveis que espero dentro do repositório

1. Site realmente implementado e inicializável localmente com comandos documentados.
2. Conteúdo e assets autorizados estruturados para edição fácil.
3. Páginas internas com rotas funcionais.
4. Design system e componentes reutilizáveis.
5. Formulário/agendamento honesto e funcional dentro das integrações disponíveis.
6. Inventários de conteúdo, assets, URLs e conflitos de dados.
7. Testes executados e evidências de qualidade visual.
8. `README.md` com setup, variáveis necessárias, execução, testes e limites de integração.
9. `research/FINAL-REPORT.md` com: o que foi implementado, URLs auditadas, páginas migradas, diferenças visuais remanescentes, resultado de cada teste, riscos/licenças, conflitos pendentes, recursos externos e sugestões de próximos passos.

### CRITÉRIOS DE ACEITAÇÃO

- **Design:** reconhecivelmente inspirado no Nova Dental, não um template dental genérico.
- **Identidade:** 100% Fine Dentistry no conteúdo, equipe e CTAs; nenhum texto de Nova Dental vazado.
- **Conteúdo:** cobertura ampla, com inventário comprovável de páginas relevantes do site antigo.
- **Usabilidade:** mobile e desktop impecáveis, interações sem glitches.
- **Fatos:** nenhuma informação inventada ou conflitante publicada como certeza.
- **Funcionalidade:** CTA, navegação e formulários não podem ser fingidos.
- **SEO:** rotas semânticas e preservação planejada do conteúdo legado.
- **Qualidade:** build e testes com resultado real documentado.
- **Segurança:** nada de deploy/merge/push ou exposição de dados sem aprovação.

Comece agora por inspecionar o repositório e os sites, produzir a auditoria concisa, instalar/ativar skills disponíveis e implementar a primeira versão completa. **Não pare após o diagnóstico.** Ao terminar, apresente de forma sucinta os resultados concretos, os comandos para abrir o projeto e as pendências que realmente exigem decisão humana.
