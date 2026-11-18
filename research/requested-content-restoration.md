# Ajustes de conteúdo e identidade solicitados

Fonte conferida novamente: https://www.finedentistryorlando.com/ e https://www.finedentistryorlando.com/Smile-Gallery em 17/11/2026. Nenhuma publicação.

## Galeria

Restauradas as 20 imagens clínicas da fonte, sem edição por IA. Cada arquivo foi associado ao título H2/H3 imediatamente anterior na página oficial. Mapeamento em `gallery-source-mapping.json` e conteúdo em `data/gallery.json`.

São oito legendas distintas: Invisalign Treatment; Invisalign, Zoom Whitening, Crowns & Fillings; Cosmetic Crowns & Whitening; Implants, Crowns, Invisalign & Whitening; Cosmetic Reconstruction; Bridges, Crowns & Whitening; Implant Retained Hybrid Denture; Invisalign, Implants, Crowns & Whitening.

Para dar visibilidade à variedade, os primeiros cards apresentam um caso de cada legenda; depois aparecem os demais casos. Nenhuma categoria clínica foi inferida apenas pela aparência dos dentes. O modal mostra a legenda real e navega pelos 20 casos. Os dois vídeos da galeria original foram registrados no inventário, mas não estão incorporados nesta alteração.

## Horários e redes sociais

Horários adicionados ao contato da home, página Contact e footer: segunda–quarta 7 AM–7 PM; sexta 7 AM–4 PM; sábado 9 AM–1 PM. Quinta aparece como “Please call to confirm”, pois Contact informa 8 AM–6 PM e o rodapé original 7 AM–7 PM. Nenhum horário de domingo foi inventado.

Links oficiais encontrados na home e restaurados com nomes visíveis:

- Instagram: https://www.instagram.com/finedentistryofdowntownorlando/
- Facebook: https://www.facebook.com/FineDentistryDowntownOrlando/

## The Fine Dentistry Difference

Seção restaurada na home, entre apresentação da clínica e tratamentos. Sete arquivos originais: Invisalign Blue Diamond Provider 2026, Dawson Alumni Association, ADA, Orlando Magazine Top Dentists 2026, FDA, Orlando Family Magazine Top Dentists 2026 e destaque editorial da Dra. Trivedi. Os selos usam os arquivos oficiais, sem regeneração e sem alteração de cores/nomes.

O selo Blue Diamond 2026 foi restaurado conforme pedido explícito do usuário e screenshot fornecido, correspondendo ao arquivo atualmente apresentado na home oficial. A divergência histórica com textos Diamond Plus/Premier continua registrada; isso não é uma validação independente de todas as credenciais.

## Logo original

Arquivo oficial `https://finedentistry.blob.core.windows.net/content/images/bannerlogo.webp` usado no header e footer. A versão branca é aplicada por CSS `brightness(0) invert(1)`, preservando exatamente a geometria e o canal alfa, sem reconstrução por IA. Header sobre a capa e footer usam branco; header de fundo branco usa a mesma marca em preto para contraste. Não foi desenhada uma marca substituta.

## Validação

- Lint, TypeScript e build passaram.
- `tests/gallery.cjs`: 20 casos, legendas de tratamentos, imagens carregadas, modal e navegação; 390 e 1440 px.
- `tests/visit-information.cjs`: horários e links oficiais na home, contato e footer; 390 e 1440 px.
- `tests/recognition-logo.cjs`: seção e sete arquivos, logo original, cor branca/escura conforme fundo, sem overflow; 390 e 1440 px.
- Teste de agendamento passou novamente.
- Evidências em `visual-qa/official-logo-hero.png`, `fine-dentistry-difference.png`, `footer-hours-social-logo.png` e `gallery-restored-cases.png`.

Estes ajustes não encerram todas as pendências registradas na auditoria de fidelidade. O tour do consultório, os links/metadados de artigos e os demais cortes de texto continuam documentados para revisão.

## Faixa de logos e alinhamento — atualização posterior
A seção de reconhecimento passou a ocupar a largura inteira, com animação CSS linear infinita e dois conjuntos idênticos para continuidade, máscara de fade nas bordas e sem figcaptions. Conjunto duplicado oculto de tecnologias assistivas; botão pausar/retomar, pausa ao hover/foco e alternativa estática com rolagem manual em reduced motion. Logo do header alinhada em x=0, inclusive descontando o padding transparente do arquivo original por recorte CSS, sem alterar o arquivo. Testes passaram em 390, 1440 e 1920 px, além de lint, TypeScript, build e seis cenários axe.


## Direção atualizada de movimento e margem
A orientação mais recente substitui o alinhamento na borda da tela: a logo do header agora coincide com a margem esquerda do conteúdo. Botão de pausa e imagem editorial de revista removidos da faixa; permanecem seis selos. Hover apenas reduz a velocidade para 35%, sem pausa nem reinício do loop. Foram adicionadas entradas de menu, títulos por linhas e blocos em scroll inspiradas em observação da Nova Dental. Detalhes e verificações em entry-motion-audit.md.


## Footer — orientação mais recente
Mapa removido da home. Horários removidos somente do footer e preservados na seção de contato da home e em Contact. Facebook e Instagram passaram a usar ícones SVG com nomes acessíveis, imediatamente abaixo do email no footer; links de texto duplicados foram retirados da coluna de recursos. A informação de privacidade foi ajustada para refletir apenas os links externos de direções, sem mapa incorporado. Build, lint, TypeScript e testes específicos em 390/1440 px passaram. As varreduras axe aguardam as animações de entrada terminarem antes de medir contraste, evitando medir estados intermediários de opacidade.


## Contato — horários em duas colunas
Ícones pequenos de Facebook e Instagram adicionados abaixo do email no bloco de contato, com os mesmos links oficiais do footer. Bloco Stay connected e a frase longa Please call (407) 898-1621 to confirm Thursday hours and appointment availability removidos. Office hours agora tem segunda–quarta à esquerda e quinta–sábado à direita, inclusive em telas pequenas; na linha de quinta permanece Please call to confirm, conforme a imagem de referência. Horários continuam fora do footer e o mapa continua removido. Lint, TypeScript, build e testes de contato em 390/768/1440 px passaram; regressão do footer em 390/1440 px também passou.


## Logo do footer alinhada à margem
Aplicada a mesma compensação da área transparente usada no header. A parte visível da logo do footer coincide com a margem esquerda do conteúdo, preservando seu tamanho e arquivo original. Build passou; alinhamento validado em 390, 768, 1440 e 1920 px, com regressão dos ícones do footer também passando.

