# Animações de entrada e ajustes da faixa

Referência observada em navegador real em 17/11/2026: https://nova-dental-dev.webflow.io/. Medições preservadas em `nova-motion-observations.json`.

## Observação

- Logo e itens do menu entram com fade e deslocamento vertical inicial de aproximadamente -8 px; os itens aparecem em sequência. Em amostras entre 270 e 1091 ms, os valores intermediários convergiram para opacidade 1 e deslocamento 0.
- Títulos usam linhas dentro de máscaras com overflow, com posição inicial de aproximadamente 110% para baixo e opacidade 0.
- As durações/easing exatas de todos os efeitos não foram medidas. A implementação abaixo é original e aproximada, inspirada na observação, sem copiar código Webflow/GSAP.

## Implementação

- `LineReveal`: preserva quebras de linha e ênfases dos títulos escritos; não reescreve o conteúdo nem duplica texto para leitores de tela.
- Hero com três linhas em sequência; navegação com entradas escalonadas; CTA aparece em seguida.
- `ScrollReveals`: IntersectionObserver revela títulos, cards, fotos e blocos ao entrarem no viewport, uma vez por elemento. Cards têm atraso curto entre irmãos. MutationObserver atende os novos cards ao trocar filtros. Foco por teclado revela imediatamente o conteúdo correspondente.
- Sem biblioteca adicional de animação. Uso de transform/opacity, sem mudanças de dimensões durante a entrada. Conteúdo continua disponível quando JavaScript não está habilitado.
- `prefers-reduced-motion`: conteúdo fica visível sem entradas animadas; faixa de selos fica estática e pode ser rolada manualmente.

## Ajustes posteriores do usuário

- Logo do header alinhada à **margem esquerda do conteúdo**, em vez da borda da tela. A área transparente original é compensada por recorte CSS, mantendo o arquivo oficial intacto.
- Botão de pausa removido.
- Imagem editorial de revista (`icon-cred-2-opt.webp`) removida da faixa por pedido explícito; permanecem seis selos/associações, repetidos decorativamente para o loop.
- Hover não pausa. `Animation.updatePlaybackRate(.35)` reduz a velocidade para 35%; ao retirar o mouse, volta a 100%. O método preserva a posição da animação, evitando o salto que ocorreria ao simplesmente alterar animation-duration.
- Fade nas bordas, largura integral e ausência de legendas mantidos. A pausa por foco de teclado permanece como recurso de acessibilidade.

## Validação

- Lint, TypeScript e build: passaram.
- Entradas de hero/títulos e gatilho por rolagem: passaram em 390 e 1440 px; reduced motion manteve conteúdo visível.
- Faixa: passou em 390, 1440 e 1920 px, incluindo máscara, loop, ausência do botão/imagem removidos, desaceleração sem parar, retorno à velocidade normal e alinhamento da logo com o gutter do conteúdo.
- Teste de agendamento passou novamente.
- Seis cenários axe passaram sem violações detectadas; não é certificação WCAG.
- Rolagem completa da home conferida para detectar elementos que permanecessem pendentes/ocultos; resultado registrado durante a validação.
- Lighthouse atualizado: `lighthouse-entry-motion.json`, medição local de laboratório.
