# Integração futura de solicitações

Estado atual: **nenhum endpoint de envio configurado ou chamado**. As três etapas encaminham para telefone ou `https://www.finedentistryorlando.com/Contact`. Não são coletados dados pessoais. O estado final afirma que a consulta não está confirmada.

Para ativar envio próprio, a clínica deverá escolher um destino autorizado e aprovar o aviso de privacidade. Contrato proposto, ainda não implementado:

`POST /api/appointments`, JSON com `service`, `preferredDoctor` opcional, `name`, `email`, `phone`, `preferredDate`, `preferredTime`, `privacyAcknowledged`. Não incluir sintomas, histórico, documentos, seguro ou dados clínicos.

- Validar no servidor e no cliente; limitar tamanho, frequência e origem das requisições.
- Manter credenciais somente no servidor. Não registrar corpo, email ou telefone em logs.
- Responder `201` somente depois de aceitação real pelo destino, com identificador não sensível. A UI dirá “Request received; the team will contact you to confirm availability.”
- Erros de validação: `400`; indisponibilidade: `503`; limite: `429`. Em erro de rede, manter estado apenas em memória e disponibilizar telefone.
- Nenhuma resposta representa consulta confirmada. Nunca gravar informações pessoais em localStorage/sessionStorage.
- Testes futuros devem cobrir validação, timeout, rejeição, falha do destino e sucesso real em ambiente autorizado, sem usar dados de pacientes.

A revisão local testa o comportamento de fallback, navegação, retorno, validação de seleção, Escape e foco; teste de sucesso/erro de envio é inaplicável enquanto não existe integração.
