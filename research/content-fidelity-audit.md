# Auditoria de fidelidade do conteúdo

Data: 17/11/2026. Comparação dos snapshots oficiais coletados durante a implementação com os arquivos e componentes atuais. Esta auditoria não altera o site e não afirma que o site de origem permaneceu sem mudanças após a coleta.

## Conclusão

Houve redação nova de apresentação, cortes deliberados e omissões que precisam de correção. A versão tem ampla cobertura de rotas, mas não preserva integralmente o conteúdo original. A declaração anterior de entrega completa foi mais abrangente que as evidências de fidelidade editorial permitiam.

## Redação e recursos acrescentados

- Headlines, títulos de seções, CTAs e textos de apresentação novos, por exemplo “Your smile. Our dedication. Beautifully personal.” e “A conversation comes first.”. São redação de marketing, não citações do original.
- Resumos de biografias e descrições de páginas reescritos com base nas fontes.
- Interface própria de agendamento em três etapas; encaminhamento ao canal oficial, sem envio próprio ou confirmação real.
- Página `/privacy` com explicação técnica desta implementação; não corresponde a uma política clínica original ou aprovada.
- Frase de preenchimento em páginas com um único parágrafo: “Our team can discuss how this service fits your goals and answer your questions at your visit.”. É texto novo, sem transcrição direta da fonte.
- Mapa e posicionamento conforme pedidos do usuário; imagens restauradas por IA conforme pedidos posteriores. As versões restauradas não são cópias intactas dos arquivos originais e podem reconstruir detalhes.

Não foi identificado nesta revisão um novo médico, serviço, endereço, telefone, depoimento ou prêmio fictício acrescentado. Isso é uma conclusão limitada aos elementos examinados, não certificação frase a frase de toda a redação.

## Omissões deliberadas

- Horários: omitidos do site inteiro devido à divergência de quinta-feira. Os horários consistentes dos outros dias também ficaram indisponíveis na interface, embora existam na fonte.
- Valores e termos de promoções: substituídos por orientação de confirmação e link oficial.
- Nível Invisalign: omitido pela divergência entre Blue Diamond, Diamond Plus e referências históricas.
- Contagem/classificação fixa de avaliações e números secundários de telefone: omitidos para evitar dados divergentes ou mutáveis.
- Detalhes dos planos de membership não foram extraídos da integração original: página local resumida com encaminhamento oficial.
- Pagamentos e cadastro permanecem em integrações oficiais; não foram reimplementados.
- Reviews: a home usa apenas dois excertos curtos reais; página de avaliações encaminha à fonte em vez de reproduzir o acervo completo.

## Omissões e perdas identificadas

### 1. Filtro amplo removeu conteúdo útil e ressalvas clínicas

O gerador descartou blocos inteiros que contivessem palavras como `guarantee`, `painless`, `diamond`, `highest quality` ou o símbolo `$`. Isso foi excessivo: em vez de ajustar uma alegação problemática, removeu informações legítimas na mesma passagem.

A comparação encontrou **169 blocos de título, parágrafo ou lista ausentes/alterados em 84 rotas**, misturando reescritas deliberadas com perdas por filtro. Esse número não representa 169 erros independentes nem mede todo o conteúdo não renderizado.

Foram identificadas **quatro ressalvas clínicas retiradas indevidamente**, nos artigos originais:

- https://www.finedentistryorlando.com/Blog/Post/Veneers-vs-Lumineers-Whats-the-Difference — três passagens sobre limites do resultado estético, variabilidade do preparo e ausência de durabilidade garantida.
- https://www.finedentistryorlando.com/Blog/Post/Dental-Bridge-vs-Dental-Implant-Which-Is-Better-for-a-Missing-Tooth — uma passagem que limita a afirmação sobre preservação óssea.

Esses casos evidenciam que a regra retirou inclusive frases que negavam uma garantia. O conteúdo precisa ser restaurado e revisado em contexto antes de publicação.

### 2. Galeria incompleta

A fonte `/Smile-Gallery` contém 20 imagens; a implementação apresenta dez. Ficaram de fora imagens e casos de outras modalidades. Todos os casos exibidos receberam legenda genérica “Invisalign treatment”, em vez de um mapeamento individual completo das legendas originais. A correspondência caso a caso precisa ser conferida.

### 3. Tour do consultório

O título “Office Tour” migrou para `/about`, mas a galeria com fotos externas/internas e seus links ampliados não foi renderizada. Parte dos arquivos foi baixada, o que não equivale a estar disponível na interface.

### 4. Visão da equipe

Em `/our-team/team`, o parágrafo original da visão foi retirado pelo filtro por conter expressões como “highest quality” e “pain-free”. A rota ficou com foto e título, sem preservar a mensagem institucional completa. Também não foi encontrado acesso direto a essa rota na navegação principal/rodapé examinados.

### 5. Link de atualização do histórico médico

`/Form/Fill/Medical-History` foi inventariado, mas seu acesso não foi incluído na interface nova. O link de cadastro de novos pacientes e o de pagamento existem; o de atualização do histórico ficou de fora.

### 6. Blog: cobertura de artigos não equivale à migração integral

Os 222 artigos encontrados têm registros locais, mas houve cortes de parágrafos por filtro. As imagens próprias dos artigos, links contextuais dentro dos textos e metadados como datas/autoria não foram preservados integralmente na apresentação. A extração por `textContent` perdeu hyperlinks no corpo dos textos.

### 7. Reconhecimento, selos e conteúdo complementar

Prêmios/selos presentes na home original, fotografias específicas de serviços e vídeos não foram reproduzidos integralmente. A implementação reutiliza poucas fotografias editoriais em várias páginas. O conteúdo textual de FAGD e Dawson foi preservado em rotas próprias, mas isso não substitui o conjunto original de evidências visuais e reconhecimento.

## Pontos que não estão ausentes

- Três médicos reais preservados, com resumos e biografias adaptadas.
- 23 tratamentos e 222 registros de artigos.
- FAQ original com 18 perguntas institucionais/odontológicas, além de cinco respostas resumidas na home.
- Financiamento menciona Healthcare Finance Direct, Cherry, CareCredit e Sunbit; nem todo botão/fluxo externo original foi reproduzido.
- Cadastro de novos pacientes e pagamentos têm caminhos para o site oficial.

## Prioridade recomendada para correção

1. Restaurar ressalvas clínicas e remover o filtro destrutivo; revisar passagens em contexto.
2. Restaurar tour, galeria completa e legendas corretas, visão da equipe e acesso ao histórico médico.
3. Comparar cada página com a fonte e conferir imagens, links, datas, autoria e informações institucionais.
4. Separar claramente redação de marketing nova de fatos/citações oficiais, mantendo a rastreabilidade.

O detalhamento bruto das diferenças está em `content-fidelity-differences.json`. Os snapshots originais permanecem preservados em `pages.json`, portanto a maior parte do texto removido pode ser recuperada sem recomeçar a pesquisa.

## Atualização posterior: itens restaurados
A galeria agora exibe os 20 casos originais com as oito legendas de tratamento verificadas na fonte. Horários consistentes, Instagram e Facebook foram restaurados no contato e footer; quinta-feira continua sinalizada para confirmação. The Fine Dentistry Difference voltou à home com os sete arquivos oficiais de reconhecimento. Logo original restaurada em branco sobre fundo escuro e em preto sobre fundo branco. Consulte requested-content-restoration.md. As demais pendências desta auditoria permanecem em aberto.

