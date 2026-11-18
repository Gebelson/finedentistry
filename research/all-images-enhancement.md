# Melhoria das fotografias do site

Solicitação: melhorar as imagens do site como a capa. Implementação local, sem publicação.

## Aplicado

- Dez novas restaurações usando a ferramenta image_gen integrada: quatro fotos de tratamentos, três retratos dos médicos, duas cenas de atendimento e a fotografia institucional da equipe. A restauração anterior da capa permanece.
- Arquivos originais preservados. Cada resultado tem um master PNG e uma cópia WebP de qualidade 95. O site usa os masters através do next/image, que gera a versão responsiva em uma única etapa de compressão a qualidade 95.
- Componente `components/site-image.tsx` e mapa `data/image-enhancements.json` atualizam também as páginas internas que reutilizam as fotos. Reverter uma imagem exige apenas remover a entrada correspondente do mapa.
- Dimensões e tamanho de cada arquivo em `image-restoration-manifest.json`; prompts exatos em `image-restoration-prompts.json`.
- A placa da clínica mantém o original de 1086 × 1448, sem reconstrução de texto, com entrega responsiva de alta qualidade.
- Os dez registros de antes/depois mantêm os JPEGs originais de 1000 × 375, exibidos diretamente, sem nova compressão e sem reconstrução generativa de dentes ou resultados clínicos.

## Limitações

A melhoria é de nitidez aparente, não uma captura 8K nativa. Alguns resultados possuem mais pixels que a fonte; outros, menos. A IA reconstrói detalhes: a inspeção visual não certifica identidade biométrica nem fidelidade absoluta de dentes, mãos, bordados ou telas. As versões permanecem para revisão da clínica antes da publicação. Não foram prometidos resultados clínicos nem alterados os registros de antes/depois.

Os arquivos não utilizados pela implementação não foram restaurados desnecessariamente. O mapa externo continua sendo fornecido pelo Google.

## Verificações

- Lint, TypeScript e build passaram após a integração.
- `node tests/image-quality.cjs`: passou em 21 combinações de página/largura (390, 768 e 1440 px), sem imagens quebradas ou overflow; confirmou uso das restaurações, srcsets responsivos e arquivos clínicos originais.
- `npm test`: fluxo de agendamento continuou passando.
- Evidências: `visual-qa/restored-services-viewport.png`, `visual-qa/restored-doctors-viewport.png` e capturas completas correspondentes.
- Resultado Lighthouse após as mudanças: `lighthouse-images-mobile.json`. A medição é local, de laboratório, e não garante desempenho em produção.
