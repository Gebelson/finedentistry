# Auditoria visual — Nova Dental

Referência pública inspecionada com Chrome/Playwright em 17/11/2026: https://nova-dental-dev.webflow.io/. A ferramenta web textual não abriu a referência, mas o navegador real abriu normalmente. Capturas em 1920×1080, 1440×900, 1024×768, 768×1024, 390×844 e 375×812 estão em `visual-qa/`. Valores extraídos do DOM em `nova-dom.json` e `nova-measurements.json`; nenhum código ou arquivo de fonte da referência foi copiado.

## Medições e observações

- Body branco (`rgb(255,255,255)`); texto principal `rgb(34,35,38)`.
- Header `position: fixed`; navegação sobre hero, logo esquerda, links e CTA entre parênteses. Mobile troca navegação por botão de menu.
- Em 1440 px, H1 medido com x=40 e y≈150; largura≈765 e altura≈320. A captura de 1920 mostra container centralizado.
- H1: família comercial Neue Haas Grotesk Display Pro, peso 500, 108 px / 90,72 px no DOM capturado. Destaque serif itálico. Não redistribuímos fontes comerciais; Arial e Georgia são alternativas de sistema documentadas, sem equivalência métrica exata.
- About: Neue Montreal, peso 500, 60 px / 61,2 px. H2 principais: 80 px / 76,8 px no DOM de referência. Implementação usa escala fluida equivalente em função da largura e do conteúdo real.
- Hero: foto close-up full-bleed, tratamento escuro, headline esquerda e CTA inferior deslocado. Mobile coloca texto perto da parte inferior da foto. A escolha posterior do usuário substitui o retrato por foto de grupo oficial da Fine Dentistry.
- Serviços: grade fotográfica numerada, ícone circular + e hover discreto; adaptação usa cards com links para páginas de tratamentos verdadeiras.
- Why Us: quatro argumentos, imagens e números. Implementação usa fotografia clínica com quatro linhas editoriais e links.
- Depoimentos: controles de anterior/próximo e arraste. Implementação usa dois excertos reais, sem nomes/quotes da Nova.
- Equipe: referência apresenta carrossel de cinco perfis fictícios. Fine apresenta os três profissionais reais em grade e biografias, uma adaptação deliberada ao conteúdo verdadeiro.
- Modal capturado em `nova-booking.png`: painel amplo com sidebar das três etapas (Service, Contact details, Confirmation), título grande, seleção e avanço. Implementação original mantém três etapas, painel escuro amplo no desktop e scroll no mobile; conteúdo final encaminha para um canal oficial porque não há integração de envio.
- CTA final: foto ampla, título grande, serif itálica, descrição e CTA; footer editorial.
- Durações/easings internos completos não foram medidos. A implementação usa hover de imagem de 650 ms e entrada única de hero de 900 ms; são aproximações, com reduced motion.

## Diferenças documentadas

Fotografia de equipe, fontes de sistema, texto real mais extenso, equipe em grade, catálogo de 23 tratamentos, artigos locais, galeria e mapa tornam a implementação diferente da landing page da referência. A hierarquia, escala, tons neutros, linguagem fotográfica e interações foram mantidas como direção visual, sem alegação de reprodução pixel a pixel. O mapa foi solicitado pelo usuário entre a seção de localização e o CTA final.
